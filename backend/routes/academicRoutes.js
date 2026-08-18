const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth");

const ReportCard = require("../models/ReportCard");

let Subject = null;
let Mark = null;
let Class = null;
let Student = null;
let Exam = null;
let Grade = null;


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
    Mark = require("../models/Mark");
} catch (error) {
    console.warn(
        "[ACADEMIC] Mark model unavailable:",
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

/*
   IMPORTANT:
   Your actual marks are stored in Grade.score.
*/
try {
    Grade = require("../models/Grade");
} catch (error) {
    console.warn(
        "[ACADEMIC] Grade model unavailable:",
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

    if (value === null || value === undefined) {
        return 0;
    }

    const factor = Math.pow(10, decimals);

    return Math.round(value * factor) / factor;
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

            const schoolId = getSchoolId(req);

            const schoolFilter = schoolId
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
               ACTUAL GRADE AVERAGE
               
               Uses Grade.score
            ========================================= */

            let average = 0;

            if (Grade) {

                try {

                    const averageResult =
                        await Grade.aggregate([

                            {
                                $match: {
                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    }
                                }
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
                            averageResult[0]?.averageScore || 0
                        );

                } catch (error) {

                    console.warn(
                        "[ACADEMIC DASHBOARD AVERAGE]",
                        error.message
                    );

                    average = 0;
                }
            }


            /* =========================================
               REPORT CARD STATISTICS
            ========================================= */

            const reportCardStats =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id: null,

                            studentsAssessed: {
                                $addToSet:
                                    "$studentId"
                            },

                            totalReportCards: {
                                $sum: 1
                            }

                        }
                    }

                ]);


            const studentsAssessed =
                reportCardStats[0]
                    ?.studentsAssessed
                    ?.length || 0;


            /* =========================================
               TERMS
            ========================================= */

            const terms =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id: {
                                year: "$year",
                                term: "$term"
                            },

                            count: {
                                $sum: 1
                            }

                        }
                    },

                    {
                        $sort: {
                            "_id.year": -1,
                            "_id.term": 1
                        }
                    },

                    {
                        $project: {

                            _id: 0,

                            year: "$_id.year",

                            term: "$_id.term",

                            count: 1

                        }

                    }

                ]);


            /* =========================================
               RESPONSE
            ========================================= */

            return res.json({

                success: true,

                totalSubjects,

                totalClasses,

                allocations: 0,

                exams,

                /*
                   NOW CALCULATED FROM Grade.score
                */
                average,

                reportCards,

                students,

                studentsAssessed,

                terms

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
                                year: "$year",
                                term: "$term"
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
                            "_id.year": 1,
                            "_id.term": 1
                        }
                    },

                    {
                        $project: {

                            _id: 0,

                            year: "$_id.year",

                            term: "$_id.term",

                            count: 1,

                            studentsAssessed: {
                                $size:
                                    "$students"
                            }

                        }

                    }

                ]);


            /* =========================================
               STUDENT REPORT CARD TOTAL
            ========================================= */

            const studentsAssessedResult =
                await ReportCard.aggregate([

                    {
                        $match:
                            schoolFilter
                    },

                    {
                        $group: {

                            _id: null,

                            students: {
                                $addToSet:
                                    "$studentId"
                            }

                        }

                    }

                ]);


            const studentsAssessed =
                studentsAssessedResult[0]
                    ?.students
                    ?.length || 0;


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

                            status: "$_id",

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

                            year: "$_id",

                            count: 1

                        }

                    }

                ]);


            /* =========================================
               SUBJECT PERFORMANCE
               
               Uses Grade.score
            ========================================= */

            let subjectPerformance = [];

            if (Grade) {

                try {

                    subjectPerformance =
                        await Grade.aggregate([

                            {
                                $match: {

                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    }

                                }
                            },

                            {
                                $group: {

                                    _id:
                                        "$subject",

                                    average: {
                                        $avg:
                                            "$score"
                                    },

                                    count: {
                                        $sum: 1
                                    }

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

                                    count: 1

                                }
                            },

                            {
                                $sort: {
                                    average: -1
                                }
                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[ACADEMIC SUBJECT PERFORMANCE]",
                        error.message
                    );

                    subjectPerformance = [];
                }
            }


            /* =========================================
               CLASS PERFORMANCE
               
               Uses Grade.score
            ========================================= */

            let classPerformance = [];

            if (Grade) {

                try {

                    classPerformance =
                        await Grade.aggregate([

                            {
                                $match: {

                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    }

                                }
                            },

                            {
                                $group: {

                                    _id:
                                        "$class",

                                    average: {
                                        $avg:
                                            "$score"
                                    },

                                    count: {
                                        $sum: 1
                                    }

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

                                    count: 1

                                }
                            },

                            {
                                $sort: {
                                    average: -1
                                }
                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[ACADEMIC CLASS PERFORMANCE]",
                        error.message
                    );

                    classPerformance = [];
                }
            }


            /* =========================================
               GRADE DISTRIBUTION
               
               Based on Grade.score
            ========================================= */

            let gradeDistribution = [];

            if (Grade) {

                try {

                    gradeDistribution =
                        await Grade.aggregate([

                            {
                                $match: {

                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    }

                                }
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
                        "[ACADEMIC GRADE DISTRIBUTION]",
                        error.message
                    );

                    gradeDistribution = [];
                }
            }


            /* =========================================
               OVERALL AVERAGE
               
               Uses Grade.score
            ========================================= */

            let overallAverage = 0;

            if (Grade) {

                try {

                    const result =
                        await Grade.aggregate([

                            {
                                $match: {

                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    }

                                }
                            },

                            {
                                $group: {

                                    _id: null,

                                    average: {
                                        $avg:
                                            "$score"
                                    },

                                    count: {
                                        $sum: 1
                                    }

                                }
                            }

                        ]);

                    overallAverage =
                        roundNumber(
                            result[0]?.average || 0
                        );

                } catch (error) {

                    console.warn(
                        "[ACADEMIC OVERALL AVERAGE]",
                        error.message
                    );

                    overallAverage = 0;
                }
            }


            /* =========================================
               EXAM / TERM TREND
               
               Uses:
                 Grade.academicYear
                 Grade.term
                 Grade.score
               
               Example:
               
               2025-2026 / Term 1
               average = 67.45
               
               2025-2026 / Term 2
               average = 71.23
            ========================================= */

            let examTrend = [];

            if (Grade) {

                try {

                    examTrend =
                        await Grade.aggregate([

                            {
                                $match: {

                                    ...schoolFilter,

                                    score: {
                                        $exists: true,
                                        $ne: null
                                    },

                                    academicYear: {
                                        $exists: true,
                                        $ne: null
                                    },

                                    term: {
                                        $exists: true,
                                        $ne: null
                                    }

                                }
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
                                        $avg:
                                            "$score"
                                    },

                                    gradesCount: {
                                        $sum: 1
                                    },

                                    students: {
                                        $addToSet:
                                            "$student"
                                    }

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

                                    gradesCount: 1,

                                    studentsAssessed: {
                                        $size:
                                            "$students"
                                    },

                                    /*
                                       Keep this field too
                                       in case your frontend
                                       expects it.
                                    */
                                    reportCards: {
                                        $literal: 0
                                    }

                                }

                            },

                            {
                                $sort: {

                                    year: 1,

                                    term: 1

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[ACADEMIC EXAM TREND]",
                        error.message
                    );

                    examTrend = [];
                }
            }


            /* =========================================
               RESPONSE
            ========================================= */

            return res.json({

                success: true,

                data: {

                    /*
                       Actual Grade.score average
                    */
                    average:
                        overallAverage,

                    subjectPerformance,

                    classPerformance,

                    gradeDistribution,

                    examTrend,

                    reportCardStats,

                    statusDistribution,

                    yearDistribution,

                    studentsAssessed

                },

                /*
                   Keep top-level properties because
                   your existing frontend appears to
                   use them.
                */

                average:
                    overallAverage,

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
