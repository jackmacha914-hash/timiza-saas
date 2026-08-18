const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth");

const ReportCard = require("../models/ReportCard");

let Subject = null;
let Mark = null;
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
   HELPER
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


            /* -----------------------------------------
               SUBJECTS
            ----------------------------------------- */

            const totalSubjects =
                await safeCount(
                    Subject,
                    schoolFilter
                );


            /* -----------------------------------------
               CLASSES
            ----------------------------------------- */

            const totalClasses =
                await safeCount(
                    Class,
                    schoolFilter
                );


            /* -----------------------------------------
               STUDENTS
            ----------------------------------------- */

            const students =
                await safeCount(
                    Student,
                    schoolFilter
                );


            /* -----------------------------------------
               REPORT CARDS
            ----------------------------------------- */

            const reportCards =
                await safeCount(
                    ReportCard,
                    schoolFilter
                );


            /* -----------------------------------------
               ACTIVE / SCHEDULED EXAMS
            ----------------------------------------- */

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


            /* -----------------------------------------
               REPORT CARD STATISTICS
            ----------------------------------------- */

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


            /* -----------------------------------------
               TERMS
            ----------------------------------------- */

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


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.json({

                success: true,

                totalSubjects,

                totalClasses,

                allocations: 0,

                exams,

                average: 0,

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


            /* -----------------------------------------
               REPORT CARD ANALYTICS
            ----------------------------------------- */

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


            /* -----------------------------------------
               STUDENT REPORT CARD TOTAL
            ----------------------------------------- */

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


            /* -----------------------------------------
               STATUS DISTRIBUTION
            ----------------------------------------- */

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


            /* -----------------------------------------
               YEAR DISTRIBUTION
            ----------------------------------------- */

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


            /* -----------------------------------------
               SUBJECT PERFORMANCE
               
               IMPORTANT:
               ReportCard does not contain marks.
            ----------------------------------------- */

            const subjectPerformance = [];


            /* -----------------------------------------
               CLASS PERFORMANCE
               
               IMPORTANT:
               ReportCard does not contain className.
            ----------------------------------------- */

            const classPerformance = [];


            /* -----------------------------------------
               GRADE DISTRIBUTION
               
               IMPORTANT:
               ReportCard does not contain grade.
            ----------------------------------------- */

            const gradeDistribution = [];


            /* -----------------------------------------
               EXAM TREND
               
               Report cards only give us report-card
               creation/term information.
            ----------------------------------------- */

            const examTrend =
                reportCardStats.map(item => ({

                    year: item.year,

                    term: item.term,

                    average: null,

                    reportCards:
                        item.count,

                    studentsAssessed:
                        item.studentsAssessed

                }));


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.json({

                success: true,

                data: {

                    subjectPerformance,

                    classPerformance,

                    gradeDistribution,

                    examTrend,

                    reportCardStats,

                    statusDistribution,

                    yearDistribution,

                    studentsAssessed

                },

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
