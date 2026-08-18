const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth");

const ReportCard = require("../models/ReportCard");

let Subject = null;
let Grade = null;
let Class = null;
let Student = null;
let Exam = null;


/* =====================================================
   OPTIONAL MODELS
===================================================== */

try {
    Subject = require("../models/Subject");
} catch (error) {
    console.warn(
        "[ACADEMIC] Subject model unavailable:",
        error.message
    );
}

try {
    // IMPORTANT:
    // Your model is Grade, not Mark.
    Grade = require("../models/Grade");
} catch (error) {
    console.warn(
        "[ACADEMIC] Grade model unavailable:",
        error.message
    );
}

try {
    Class = require("../models/Class");
} catch (error) {
    console.warn(
        "[ACADEMIC] Class model unavailable:",
        error.message
    );
}

try {
    Student = require("../models/Student");
} catch (error) {
    console.warn(
        "[ACADEMIC] Student model unavailable:",
        error.message
    );
}

try {
    Exam = require("../models/Exam");
} catch (error) {
    console.warn(
        "[ACADEMIC] Exam model unavailable:",
        error.message
    );
}


/* =====================================================
   ADMIN AUTHORIZATION
===================================================== */

function adminOnly(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });
    }

    next();
}


/* =====================================================
   SAFE COUNT
===================================================== */

async function safeCount(model, filter = {}) {

    if (!model) {
        return 0;
    }

    try {
        return await model.countDocuments(filter);
    } catch (error) {

        console.warn(
            "[ACADEMIC COUNT]",
            error.message
        );

        return 0;
    }
}


/* =====================================================
   GET SCHOOL ID
===================================================== */

function getSchoolId(req) {

    return (
        req.user?.school ||
        req.user?.schoolId ||
        req.school?._id ||
        req.school?.id ||
        null
    );
}


/* =====================================================
   ROUND NUMBER
===================================================== */

function roundNumber(value, decimals = 2) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {
        return 0;
    }

    return Number(
        Number(value).toFixed(decimals)
    );
}


/* =====================================================
   DASHBOARD
===================================================== */

/*
    GET /api/academic/dashboard
*/

router.get(
    "/dashboard",
    protect,
    adminOnly,
    async (req, res) => {

        try {

            const schoolId =
                getSchoolId(req);

            const schoolFilter =
                schoolId
                    ? { school: schoolId }
                    : {};


            /* =========================================
               SUBJECTS
            ========================================= */

            const totalSubjects =
                await safeCount(
                    Subject,
                    schoolFilter
                );


            /* =========================================
               CLASSES
            ========================================= */

            const totalClasses =
                await safeCount(
                    Class,
                    schoolFilter
                );


            /* =========================================
               STUDENTS
            ========================================= */

            const students =
                await safeCount(
                    Student,
                    schoolFilter
                );


            /* =========================================
               REPORT CARDS
            ========================================= */

            const reportCards =
                await safeCount(
                    ReportCard,
                    schoolFilter
                );


            /* =========================================
               ACTIVE / SCHEDULED EXAMS
            ========================================= */

            let exams = 0;

            if (Exam) {

                try {

                    exams =
                        await Exam.countDocuments({
                            ...schoolFilter,

                            status: {
                                $in: [
                                    "active",
                                    "scheduled"
                                ]
                            }
                        });

                } catch (error) {

                    exams =
                        await safeCount(
                            Exam,
                            schoolFilter
                        );
                }
            }


            /* =========================================
               STUDENTS ASSESSED
            ========================================= */

            let studentsAssessed = 0;

            if (Grade) {

                try {

                    const result =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: "$student"

                                }
                            },

                            {
                                $count:
                                    "students"

                            }

                        ]);

                    studentsAssessed =
                        result[0]?.students || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC STUDENTS ASSESSED]",
                        error.message
                    );
                }
            }


            /* =========================================
               ACTUAL AVERAGE FROM Grade.score
            ========================================= */

            let average = 0;

            if (Grade) {

                try {

                    const result =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: null,

                                    averageScore: {
                                        $avg: "$score"
                                    },

                                    totalGrades: {
                                        $sum: 1
                                    }

                                }

                            }

                        ]);

                    average =
                        roundNumber(
                            result[0]?.averageScore || 0
                        );

                } catch (error) {

                    console.error(
                        "[ACADEMIC AVERAGE]",
                        error
                    );
                }
            }


            /* =========================================
               TERMS FROM GRADES
            ========================================= */

            let terms = [];

            if (Grade) {

                try {

                    terms =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: {

                                        academicYear:
                                            "$academicYear",

                                        term:
                                            "$term"

                                    },

                                    count: {
                                        $sum: 1
                                    },

                                    average: {
                                        $avg: "$score"
                                    }

                                }

                            },

                            {
                                $sort: {

                                    "_id.academicYear":
                                        -1,

                                    "_id.term":
                                        1

                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    year:
                                        "$_id.academicYear",

                                    term:
                                        "$_id.term",

                                    count: 1,

                                    average: {
                                        $round: [
                                            "$average",
                                            2
                                        ]
                                    }

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[ACADEMIC TERMS]",
                        error.message
                    );
                }
            }


            /* =========================================
               EXAM TREND FROM ACTUAL Grade.score
            ========================================= */

            let examTrend = [];

            if (Grade) {

                try {

                    examTrend =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: {

                                        academicYear:
                                            "$academicYear",

                                        term:
                                            "$term"

                                    },

                                    average: {
                                        $avg: "$score"
                                    },

                                    highestScore: {
                                        $max: "$score"
                                    },

                                    lowestScore: {
                                        $min: "$score"
                                    },

                                    totalScores: {
                                        $sum: 1
                                    },

                                    students: {
                                        $addToSet:
                                            "$student"
                                    }

                                }

                            },

                            {
                                $sort: {

                                    "_id.academicYear":
                                        1,

                                    "_id.term":
                                        1

                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    year:
                                        "$_id.academicYear",

                                    term:
                                        "$_id.term",

                                    average: {
                                        $round: [
                                            "$average",
                                            2
                                        ]
                                    },

                                    highestScore: {
                                        $round: [
                                            "$highestScore",
                                            2
                                        ]
                                    },

                                    lowestScore: {
                                        $round: [
                                            "$lowestScore",
                                            2
                                        ]
                                    },

                                    totalScores: 1,

                                    studentsAssessed: {
                                        $size:
                                            "$students"
                                    }

                                }

                            }

                        ]);

                } catch (error) {

                    console.error(
                        "[ACADEMIC EXAM TREND]",
                        error
                    );
                }
            }


            /* =========================================
               RESPONSE
            ========================================= */

            return res.json({

                success: true,

                totalSubjects,

                totalClasses,

                allocations: 0,

                exams,

                // REAL AVERAGE FROM Grade.score
                average,

                reportCards,

                students,

                studentsAssessed,

                terms,

                // REAL TREND FROM Grade.score
                examTrend

            });

        } catch (error) {

            console.error(
                "[ACADEMIC DASHBOARD]",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load academic dashboard."

            });

        }

    }
);


/* =====================================================
   ACADEMIC ANALYTICS
===================================================== */

/*
    GET /api/academic/analytics
*/

router.get(
    "/analytics",
    protect,
    adminOnly,
    async (req, res) => {

        try {

            const schoolId =
                getSchoolId(req);

            const schoolFilter =
                schoolId
                    ? { school: schoolId }
                    : {};


            /* =========================================
               REPORT CARD ANALYTICS
            ========================================= */

            const reportCardStats =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id: {

                                year:
                                    "$year",

                                term:
                                    "$term"

                            },

                            count: {
                                $sum: 1
                            },

                            students: {
                                $addToSet:
                                    "$studentId"
                            }

                        }
                    },

                    {
                        $sort: {

                            "_id.year":
                                1,

                            "_id.term":
                                1

                        }
                    },

                    {
                        $project: {

                            _id: 0,

                            year:
                                "$_id.year",

                            term:
                                "$_id.term",

                            count: 1,

                            studentsAssessed: {

                                $size:
                                    "$students"

                            }

                        }

                    }

                ]);


            /* =========================================
               SUBJECT PERFORMANCE
            ========================================= */

            let subjectPerformance = [];

            if (Grade) {

                try {

                    subjectPerformance =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id:
                                        "$subject",

                                    average: {
                                        $avg: "$score"
                                    },

                                    highest: {
                                        $max: "$score"
                                    },

                                    lowest: {
                                        $min: "$score"
                                    },

                                    count: {
                                        $sum: 1
                                    }

                                }

                            },

                            {
                                $sort: {
                                    average: -1
                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    subject:
                                        "$_id",

                                    average: {
                                        $round: [
                                            "$average",
                                            2
                                        ]
                                    },

                                    highest: 1,

                                    lowest: 1,

                                    count: 1

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[SUBJECT PERFORMANCE]",
                        error.message
                    );
                }
            }


            /* =========================================
               CLASS PERFORMANCE
            ========================================= */

            let classPerformance = [];

            if (Grade) {

                try {

                    classPerformance =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id:
                                        "$class",

                                    average: {
                                        $avg: "$score"
                                    },

                                    highest: {
                                        $max: "$score"
                                    },

                                    lowest: {
                                        $min: "$score"
                                    },

                                    count: {
                                        $sum: 1
                                    }

                                }

                            },

                            {
                                $sort: {
                                    average: -1
                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    class:
                                        "$_id",

                                    average: {
                                        $round: [
                                            "$average",
                                            2
                                        ]
                                    },

                                    highest: 1,

                                    lowest: 1,

                                    count: 1

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[CLASS PERFORMANCE]",
                        error.message
                    );
                }
            }


            /* =========================================
               GRADE DISTRIBUTION
            ========================================= */

            let gradeDistribution = [];

            if (Grade) {

                try {

                    gradeDistribution =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $project: {

                                    grade: {

                                        $switch: {

                                            branches: [

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            80
                                                        ]
                                                    },
                                                    then: "A"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            70
                                                        ]
                                                    },
                                                    then: "A-"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            60
                                                        ]
                                                    },
                                                    then: "B+"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            50
                                                        ]
                                                    },
                                                    then: "B"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            40
                                                        ]
                                                    },
                                                    then: "B-"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            30
                                                        ]
                                                    },
                                                    then: "C+"
                                                },

                                                {
                                                    case: {
                                                        $gte: [
                                                            "$score",
                                                            20
                                                        ]
                                                    },
                                                    then: "C"
                                                }

                                            ],

                                            default: "E"

                                        }

                                    }

                                }

                            },

                            {
                                $group: {

                                    _id:
                                        "$grade",

                                    count: {
                                        $sum: 1
                                    }

                                }

                            },

                            {
                                $sort: {
                                    _id: 1
                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    grade:
                                        "$_id",

                                    count: 1

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[GRADE DISTRIBUTION]",
                        error.message
                    );
                }
            }


            /* =========================================
               REAL EXAM TREND
            ========================================= */

            let examTrend = [];

            if (Grade) {

                try {

                    examTrend =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: {

                                        year:
                                            "$academicYear",

                                        term:
                                            "$term"

                                    },

                                    average: {
                                        $avg: "$score"
                                    },

                                    highestScore: {
                                        $max: "$score"
                                    },

                                    lowestScore: {
                                        $min: "$score"
                                    },

                                    totalScores: {
                                        $sum: 1
                                    },

                                    students: {
                                        $addToSet:
                                            "$student"
                                    }

                                }

                            },

                            {
                                $sort: {

                                    "_id.year":
                                        1,

                                    "_id.term":
                                        1

                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    year:
                                        "$_id.year",

                                    term:
                                        "$_id.term",

                                    average: {
                                        $round: [
                                            "$average",
                                            2
                                        ]
                                    },

                                    highestScore: {
                                        $round: [
                                            "$highestScore",
                                            2
                                        ]
                                    },

                                    lowestScore: {
                                        $round: [
                                            "$lowestScore",
                                            2
                                        ]
                                    },

                                    totalScores: 1,

                                    studentsAssessed: {
                                        $size:
                                            "$students"
                                    }

                                }

                            }

                        ]);

                } catch (error) {

                    console.error(
                        "[ACADEMIC ANALYTICS TREND]",
                        error
                    );
                }
            }


            /* =========================================
               OVERALL AVERAGE
            ========================================= */

            let average = 0;

            if (Grade) {

                try {

                    const result =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id: null,

                                    average: {
                                        $avg: "$score"
                                    }

                                }

                            }

                        ]);

                    average =
                        roundNumber(
                            result[0]?.average || 0
                        );

                } catch (error) {

                    console.warn(
                        "[ACADEMIC ANALYTICS AVERAGE]",
                        error.message
                    );
                }
            }


            /* =========================================
               STUDENTS ASSESSED
            ========================================= */

            let studentsAssessed = 0;

            if (Grade) {

                try {

                    const result =
                        await Grade.aggregate([

                            {
                                $match:
                                    schoolFilter
                            },

                            {
                                $group: {

                                    _id:
                                        "$student"

                                }

                            },

                            {
                                $count:
                                    "students"

                            }

                        ]);

                    studentsAssessed =
                        result[0]?.students || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC ANALYTICS STUDENTS]",
                        error.message
                    );
                }
            }


            /* =========================================
               STATUS DISTRIBUTION
            ========================================= */

            const statusDistribution =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id:
                                "$status",

                            count: {
                                $sum: 1
                            }

                        }

                    },

                    {
                        $project: {

                            _id: 0,

                            status:
                                "$_id",

                            count: 1

                        }

                    }

                ]);


            /* =========================================
               YEAR DISTRIBUTION
            ========================================= */

            const yearDistribution =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id:
                                "$year",

                            count: {
                                $sum: 1
                            }

                        }

                    },

                    {
                        $sort: {
                            _id: 1
                        }

                    },

                    {
                        $project: {

                            _id: 0,

                            year:
                                "$_id",

                            count: 1

                        }

                    }

                ]);


            /* =========================================
               RESPONSE
            ========================================= */

            return res.json({

                success: true,

                data: {

                    average,

                    subjectPerformance,

                    classPerformance,

                    gradeDistribution,

                    examTrend,

                    reportCardStats,

                    statusDistribution,

                    yearDistribution,

                    studentsAssessed

                },

                // Keep these at the top level too
                // because your frontend appears to
                // read these properties directly.

                average,

                subjectPerformance,

                classPerformance,

                gradeDistribution,

                examTrend,

                reportCardStats,

                statusDistribution,

                yearDistribution,

                studentsAssessed

            });

        } catch (error) {

            console.error(
                "[ACADEMIC ANALYTICS]",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load academic analytics."

            });

        }

    }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;
