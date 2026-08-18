const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth");

const ReportCard = require("../models/ReportCard");
const Grade = require("../models/Grade");

let Subject = null;
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
   SCHOOL FILTER
===================================================== */

function getSchoolFilter(req) {

    const schoolId =
        getSchoolId(req);

    if (!schoolId) {

        return {};

    }

    return {
        school: schoolId
    };

}


/* =====================================================
   SAFE COUNT
===================================================== */

async function safeCount(
    model,
    filter = {}
) {

    if (!model) {

        return 0;

    }

    try {

        return await model.countDocuments(
            filter
        );

    } catch (error) {

        console.warn(
            "[ACADEMIC COUNT]",
            error.message
        );

        return 0;

    }

}


/* =====================================================
   ROUND NUMBER
===================================================== */

function round(value, decimals = 2) {

    const factor =
        Math.pow(10, decimals);

    return Math.round(
        value * factor
    ) / factor;

}


/* =====================================================
   GRADE LETTER
===================================================== */

function getGradeLetter(score) {

    const value =
        Number(score);

    if (!Number.isFinite(value)) {

        return "";

    }

    if (value >= 80) return "A";
    if (value >= 70) return "A-";
    if (value >= 60) return "B+";
    if (value >= 50) return "B";
    if (value >= 40) return "B-";
    if (value >= 30) return "C+";
    if (value >= 20) return "C";

    return "E";

}


/* =====================================================
   GRADE ORDER
===================================================== */

function gradeOrder(grade) {

    const order = {

        "A": 1,
        "A-": 2,
        "B+": 3,
        "B": 4,
        "B-": 5,
        "C+": 6,
        "C": 7,
        "E": 8

    };

    return order[grade] || 99;

}


/* =====================================================
   LOAD GRADES
===================================================== */

async function loadGrades(
    schoolFilter
) {

    try {

        return await Grade
            .find(schoolFilter)
            .lean();

    } catch (error) {

        console.error(
            "[ACADEMIC GRADES]",
            error
        );

        return [];

    }

}


/* =====================================================
   BUILD ACADEMIC ANALYTICS
===================================================== */

async function buildAcademicAnalytics(
    schoolFilter
) {

    const grades =
        await loadGrades(
            schoolFilter
        );


    /* =================================================
       EMPTY DATA
    ================================================= */

    if (!grades.length) {

        return {

            gradesCount: 0,

            schoolAverage: 0,

            studentsAssessed: 0,

            subjectPerformance: [],

            classPerformance: [],

            gradeDistribution: [],

            examTrend: []

        };

    }


    /* =================================================
       MAPS
    ================================================= */

    const subjectMap =
        new Map();

    const classMap =
        new Map();

    const gradeMap =
        new Map();

    const termMap =
        new Map();

    const students =
        new Set();


    /* =================================================
       SCHOOL TOTAL
    ================================================= */

    let totalScore = 0;

    let scoreCount = 0;


    /* =================================================
       PROCESS EVERY GRADE
    ================================================= */

    grades.forEach(item => {

        const score =
            Number(item.score);


        if (
            !Number.isFinite(score)
        ) {

            return;

        }


        /* ---------------------------------------------
           SCHOOL AVERAGE
        --------------------------------------------- */

        totalScore += score;

        scoreCount++;


        /* ---------------------------------------------
           STUDENT
        --------------------------------------------- */

        if (item.student) {

            students.add(
                String(item.student)
            );

        }


        /* ---------------------------------------------
           SUBJECT
        --------------------------------------------- */

        const subject =
            String(
                item.subject ||
                "Unknown Subject"
            ).trim();


        if (!subjectMap.has(subject)) {

            subjectMap.set(
                subject,
                {
                    subject,
                    total: 0,
                    count: 0,
                    students: new Set()
                }
            );

        }


        const subjectData =
            subjectMap.get(subject);


        subjectData.total += score;

        subjectData.count++;


        if (item.student) {

            subjectData.students.add(
                String(item.student)
            );

        }


        /* ---------------------------------------------
           CLASS
        --------------------------------------------- */

        const className =
            String(
                item.class ||
                "Unknown Class"
            ).trim();


        if (!classMap.has(className)) {

            classMap.set(
                className,
                {
                    class: className,
                    total: 0,
                    count: 0,
                    students: new Set()
                }
            );

        }


        const classData =
            classMap.get(className);


        classData.total += score;

        classData.count++;


        if (item.student) {

            classData.students.add(
                String(item.student)
            );

        }


        /* ---------------------------------------------
           GRADE DISTRIBUTION
           USE EXACT SAME SCALE AS Grade.js
        --------------------------------------------- */

        const grade =
            getGradeLetter(score);


        if (!gradeMap.has(grade)) {

            gradeMap.set(
                grade,
                0
            );

        }


        gradeMap.set(
            grade,
            gradeMap.get(grade) + 1
        );


        /* ---------------------------------------------
           TERM TREND
        --------------------------------------------- */

        const academicYear =
            String(
                item.academicYear ||
                ""
            ).trim();


        const term =
            String(
                item.term ||
                ""
            ).trim();


        const termKey =
            `${academicYear}|${term}`;


        if (
            academicYear ||
            term
        ) {

            if (!termMap.has(termKey)) {

                termMap.set(
                    termKey,
                    {
                        academicYear,
                        term,
                        total: 0,
                        count: 0,
                        students: new Set()
                    }
                );

            }


            const termData =
                termMap.get(termKey);


            termData.total += score;

            termData.count++;


            if (item.student) {

                termData.students.add(
                    String(item.student)
                );

            }

        }

    });


    /* =================================================
       SCHOOL AVERAGE
    ================================================= */

    const schoolAverage =
        scoreCount > 0

            ? round(
                totalScore /
                scoreCount
            )

            : 0;


    /* =================================================
       SUBJECT PERFORMANCE
    ================================================= */

    const subjectPerformance =
        Array.from(
            subjectMap.values()
        )
            .map(item => ({

                subject:
                    item.subject,

                name:
                    item.subject,

                average:
                    round(
                        item.total /
                        item.count
                    ),

                assessments:
                    item.count,

                students:
                    item.students.size

            }))
            .sort(
                (a, b) =>
                    b.average -
                    a.average
            );


    /* =================================================
       CLASS PERFORMANCE
    ================================================= */

    const classPerformance =
        Array.from(
            classMap.values()
        )
            .map(item => ({

                class:
                    item.class,

                name:
                    item.class,

                average:
                    round(
                        item.total /
                        item.count
                    ),

                assessments:
                    item.count,

                students:
                    item.students.size

            }))
            .sort(
                (a, b) =>
                    b.average -
                    a.average
            );


    /* =================================================
       GRADE DISTRIBUTION
    ================================================= */

    const gradeDistribution =
        Array.from(
            gradeMap.entries()
        )
            .map(
                ([grade, count]) => ({

                    grade,

                    count,

                    percentage:
                        scoreCount > 0
                            ? round(
                                (
                                    count /
                                    scoreCount
                                ) * 100
                            )
                            : 0

                })
            )
            .sort(
                (a, b) =>
                    gradeOrder(a.grade) -
                    gradeOrder(b.grade)
            );


    /* =================================================
       EXAM / TERM TREND
    ================================================= */

    const examTrend =
        Array.from(
            termMap.values()
        )
            .map(item => ({

                year:
                    item.academicYear,

                academicYear:
                    item.academicYear,

                term:
                    item.term,

                average:
                    round(
                        item.total /
                        item.count
                    ),

                assessments:
                    item.count,

                studentsAssessed:
                    item.students.size

            }))
            .sort((a, b) => {

                const yearA =
                    String(
                        a.academicYear ||
                        ""
                    );

                const yearB =
                    String(
                        b.academicYear ||
                        ""
                    );


                if (
                    yearA !== yearB
                ) {

                    return yearA.localeCompare(
                        yearB
                    );

                }


                const termOrder = {

                    "Term 1": 1,
                    "Term 2": 2,
                    "Term 3": 3

                };


                return (
                    (termOrder[a.term] || 99) -
                    (termOrder[b.term] || 99)
                );

            });


    /* =================================================
       RESULT
    ================================================= */

    return {

        gradesCount:
            grades.length,

        schoolAverage,

        studentsAssessed:
            students.size,

        subjectPerformance,

        classPerformance,

        gradeDistribution,

        examTrend

    };

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

            const schoolFilter =
                getSchoolFilter(req);


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
               EXAMS
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
               REAL GRADE ANALYTICS
            ----------------------------------------- */

            const analytics =
                await buildAcademicAnalytics(
                    schoolFilter
                );


            /* -----------------------------------------
               TERMS FROM REPORT CARDS
            ----------------------------------------- */

            let terms = [];


            try {

                terms =
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

                                year:
                                    "$_id.year",

                                term:
                                    "$_id.term",

                                count: 1

                            }

                        }

                    ]);

            } catch (error) {

                console.warn(
                    "[ACADEMIC TERMS]",
                    error.message
                );

            }


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.json({

                success: true,

                totalSubjects,

                totalClasses,

                allocations:
                    0,

                exams,

                average:
                    analytics.schoolAverage,

                schoolAverage:
                    analytics.schoolAverage,

                reportCards,

                students,

                studentsAssessed:
                    analytics.studentsAssessed,

                gradesCount:
                    analytics.gradesCount,

                terms,

                subjectPerformance:
                    analytics.subjectPerformance,

                classPerformance:
                    analytics.classPerformance,

                gradeDistribution:
                    analytics.gradeDistribution,

                examTrend:
                    analytics.examTrend

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
                    process.env.NODE_ENV !== "production"
                        ? error.message
                        : undefined

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

            const schoolFilter =
                getSchoolFilter(req);


            /* -----------------------------------------
               REPORT CARD STATS
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

                            "_id.year": 1,

                            "_id.term": 1

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


            /* -----------------------------------------
               REAL GRADE ANALYTICS
            ----------------------------------------- */

            const analytics =
                await buildAcademicAnalytics(
                    schoolFilter
                );


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

                            status:
                                "$_id",

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

                            year:
                                "$_id",

                            count: 1

                        }

                    }

                ]);


            /* -----------------------------------------
               TREND
            ----------------------------------------- */

            let examTrend =
                analytics.examTrend;


            /*
             * If there are no Grade records yet,
             * use report-card term information.
             */

            if (
                !examTrend.length
            ) {

                examTrend =
                    reportCardStats.map(
                        item => ({

                            year:
                                item.year,

                            academicYear:
                                item.year,

                            term:
                                item.term,

                            average:
                                null,

                            reportCards:
                                item.count,

                            studentsAssessed:
                                item.studentsAssessed

                        })
                    );

            }


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            const responseData = {

                subjectPerformance:
                    analytics.subjectPerformance,

                classPerformance:
                    analytics.classPerformance,

                gradeDistribution:
                    analytics.gradeDistribution,

                examTrend,

                reportCardStats,

                statusDistribution,

                yearDistribution,

                studentsAssessed:
                    analytics.studentsAssessed,

                schoolAverage:
                    analytics.schoolAverage,

                average:
                    analytics.schoolAverage,

                gradesCount:
                    analytics.gradesCount

            };


            return res.json({

                success: true,

                data:
                    responseData,

                ...responseData

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
                    process.env.NODE_ENV !== "production"
                        ? error.message
                        : undefined

            });

        }

    }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;
