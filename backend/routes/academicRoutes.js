const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth");


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
   MODELS
===================================================== */

function getModel(name, path) {

    try {

        return require(path);

    } catch (error) {

        console.warn(
            `[ACADEMIC] ${name} model could not be loaded:`,
            error.message
        );

        return null;

    }

}

const Subject =
    getModel("Subject", "../models/Subject");

const Class =
    getModel("Class", "../models/Class");

const Student =
    getModel("Student", "../models/Student");

const ReportCard =
    getModel("ReportCard", "../models/ReportCard");

const Exam =
    getModel("Exam", "../models/Exam");


/* =====================================================
   HELPER
===================================================== */

async function countDocuments(model) {

    if (!model) return 0;

    try {

        return await model.countDocuments();

    } catch (error) {

        console.warn(
            "[ACADEMIC COUNT]",
            error.message
        );

        return 0;

    }

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

            const totalSubjects =
                await countDocuments(Subject);

            const totalClasses =
                await countDocuments(Class);

            const students =
                await countDocuments(Student);

            const reportCards =
                await countDocuments(ReportCard);


            let exams = 0;

            if (Exam) {

                try {

                    exams =
                        await Exam.countDocuments({
                            status: {
                                $in: [
                                    "active",
                                    "scheduled"
                                ]
                            }
                        });

                } catch (error) {

                    exams =
                        await countDocuments(Exam);

                }

            }


            /*
             * Calculate allocations.
             *
             * This works with subjects that have
             * a classes array.
             */

            let allocations = 0;

            if (Subject) {

                try {

                    const result =
                        await Subject.aggregate([

                            {
                                $project: {
                                    allocationCount: {
                                        $size: {
                                            $ifNull: [
                                                "$classes",
                                                []
                                            ]
                                        }
                                    }
                                }
                            },

                            {
                                $group: {
                                    _id: null,
                                    total: {
                                        $sum:
                                            "$allocationCount"
                                    }
                                }
                            }

                        ]);

                    allocations =
                        result[0]?.total || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC ALLOCATIONS]",
                        error.message
                    );

                    allocations = 0;

                }

            }


            /*
             * Calculate school average.
             */

            let average = 0;

            if (ReportCard) {

                try {

                    const result =
                        await ReportCard.aggregate([

                            {
                                $group: {
                                    _id: null,

                                    average: {
                                        $avg: "$average"
                                    }
                                }
                            }

                        ]);

                    if (
                        result.length &&
                        typeof result[0].average === "number"
                    ) {

                        average =
                            Math.round(
                                result[0].average * 100
                            ) / 100;

                    }

                } catch (error) {

                    console.warn(
                        "[ACADEMIC AVERAGE]",
                        error.message
                    );

                }

            }


            return res.json({

                success: true,

                totalSubjects,

                totalClasses,

                allocations,

                exams,

                average,

                reportCards,

                students

            });

        } catch (error) {

            console.error(
                "[ACADEMIC DASHBOARD]",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load academic dashboard.",

                error:
                    process.env.NODE_ENV === "production"
                        ? undefined
                        : error.message

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

            let subjectPerformance = [];

            let classPerformance = [];

            let gradeDistribution = [];

            let examTrend = [];


            /*
             * SUBJECT PERFORMANCE
             */

            if (ReportCard) {

                try {

                    subjectPerformance =
                        await ReportCard.aggregate([

                            {
                                $unwind: {
                                    path: "$subjects",
                                    preserveNullAndEmptyArrays: false
                                }
                            },

                            {
                                $group: {

                                    _id:
                                        "$subjects.subjectName",

                                    average: {
                                        $avg:
                                            "$subjects.average"
                                    }

                                }

                            },

                            {
                                $sort: {
                                    average: -1
                                }
                            },

                            {
                                $limit: 20
                            },

                            {
                                $project: {

                                    _id: 0,

                                    subject: "$_id",

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
                        "[ACADEMIC SUBJECT ANALYTICS]",
                        error.message
                    );

                }

            }


            /*
             * CLASS PERFORMANCE
             */

            if (ReportCard) {

                try {

                    classPerformance =
                        await ReportCard.aggregate([

                            {
                                $group: {

                                    _id:
                                        "$className",

                                    average: {
                                        $avg:
                                            "$average"
                                    }

                                }

                            },

                            {
                                $sort: {
                                    average: -1
                                }
                            },

                            {
                                $limit: 20
                            },

                            {
                                $project: {

                                    _id: 0,

                                    className: "$_id",

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
                        "[ACADEMIC CLASS ANALYTICS]",
                        error.message
                    );

                }

            }


            /*
             * GRADE DISTRIBUTION
             */

            if (ReportCard) {

                try {

                    gradeDistribution =
                        await ReportCard.aggregate([

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
                                    count: -1
                                }
                            },

                            {
                                $project: {

                                    _id: 0,

                                    grade: "$_id",

                                    count: 1

                                }

                            }

                        ]);

                } catch (error) {

                    console.warn(
                        "[ACADEMIC GRADE ANALYTICS]",
                        error.message
                    );

                }

            }


            /*
             * EXAM TREND
             */

            if (ReportCard) {

                try {

                    examTrend =
                        await ReportCard.aggregate([

                            {
                                $group: {

                                    _id: {
                                        year: {
                                            $year:
                                                "$createdAt"
                                        },

                                        month: {
                                            $month:
                                                "$createdAt"
                                        }

                                    },

                                    average: {
                                        $avg:
                                            "$average"
                                    }

                                }

                            },

                            {
                                $sort: {
                                    "_id.year": 1,
                                    "_id.month": 1
                                }

                            },

                            {
                                $project: {

                                    _id: 0,

                                    year:
                                        "$_id.year",

                                    month:
                                        "$_id.month",

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
                        "[ACADEMIC TREND ANALYTICS]",
                        error.message
                    );

                }

            }


            /*
             * Return a flexible response.
             *
             * The frontend can use whichever
             * property names it expects.
             */

            return res.json({

                success: true,

                data: {

                    subjectPerformance,

                    classPerformance,

                    gradeDistribution,

                    examTrend

                },

                subjectPerformance,

                classPerformance,

                gradeDistribution,

                examTrend

            });

        } catch (error) {

            console.error(
                "[ACADEMIC ANALYTICS]",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load academic analytics.",

                error:
                    process.env.NODE_ENV === "production"
                        ? undefined
                        : error.message

            });

        }

    }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;
