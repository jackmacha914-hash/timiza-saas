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
   SCHOOL ID
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

    const schoolId = getSchoolId(req);

    return schoolId
        ? { school: schoolId }
        : {};

}


/* =====================================================
   NUMBER HELPER
===================================================== */

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


/* =====================================================
   GET MARK VALUE
===================================================== */

function getMarkValue(mark) {

    const possibleValues = [

        mark?.percentage,
        mark?.percent,
        mark?.score,
        mark?.marks,
        mark?.mark,
        mark?.obtainedMarks,
        mark?.obtained,
        mark?.points,
        mark?.value

    ];

    for (const value of possibleValues) {

        const number = toNumber(value);

        if (number !== null) {

            return number;

        }

    }

    return null;

}


/* =====================================================
   GET MAX MARK
===================================================== */

function getMaxMark(mark) {

    const possibleValues = [

        mark?.maxMarks,
        mark?.maximumMarks,
        mark?.maxScore,
        mark?.totalMarks,
        mark?.outOf,
        mark?.maximum,
        mark?.max

    ];

    for (const value of possibleValues) {

        const number = toNumber(value);

        if (
            number !== null &&
            number > 0
        ) {

            return number;

        }

    }

    return 100;

}


/* =====================================================
   CONVERT MARK TO PERCENTAGE
===================================================== */

function getPercentage(mark) {

    const directPercentage =

        toNumber(mark?.percentage) ??
        toNumber(mark?.percent);

    if (
        directPercentage !== null &&
        directPercentage >= 0
    ) {

        return Math.min(
            100,
            directPercentage
        );

    }

    const value =
        getMarkValue(mark);

    if (value === null) {

        return null;

    }

    const max =
        getMaxMark(mark);

    if (
        !max ||
        max <= 0
    ) {

        return null;

    }

    return Math.min(
        100,
        Math.max(
            0,
            (value / max) * 100
        )
    );

}


/* =====================================================
   GET ID
===================================================== */

function getReferenceId(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        return String(value);

    }

    if (value._id) {

        return String(value._id);

    }

    if (value.id) {

        return String(value.id);

    }

    return null;

}


/* =====================================================
   GET SUBJECT ID
===================================================== */

function getSubjectId(mark) {

    return (
        getReferenceId(mark.subjectId) ||
        getReferenceId(mark.subject) ||
        getReferenceId(mark.subjectRef)
    );

}


/* =====================================================
   GET CLASS ID
===================================================== */

function getClassId(mark) {

    return (
        getReferenceId(mark.classId) ||
        getReferenceId(mark.class) ||
        getReferenceId(mark.classRef)
    );

}


/* =====================================================
   GET STUDENT ID
===================================================== */

function getStudentId(mark) {

    return (
        getReferenceId(mark.studentId) ||
        getReferenceId(mark.student) ||
        getReferenceId(mark.studentRef) ||
        getReferenceId(mark.userId)
    );

}


/* =====================================================
   GET EXAM ID
===================================================== */

function getExamId(mark) {

    return (
        getReferenceId(mark.examId) ||
        getReferenceId(mark.exam) ||
        getReferenceId(mark.examRef)
    );

}


/* =====================================================
   GET TERM
===================================================== */

function getTerm(mark) {

    return (
        mark.term ||
        mark.termName ||
        mark.academicTerm ||
        ""
    );

}


/* =====================================================
   GET YEAR
===================================================== */

function getYear(mark) {

    return (
        mark.year ||
        mark.academicYear ||
        mark.session ||
        ""
    );

}


/* =====================================================
   GET SUBJECT NAME
===================================================== */

function getSubjectName(mark) {

    if (
        mark.subject &&
        typeof mark.subject === "object"
    ) {

        return (
            mark.subject.name ||
            mark.subject.subjectName ||
            mark.subject.title ||
            "Unknown Subject"
        );

    }

    return (
        mark.subjectName ||
        mark.subjectTitle ||
        mark.subject ||
        "Unknown Subject"
    );

}


/* =====================================================
   GET CLASS NAME
===================================================== */

function getClassName(mark) {

    if (
        mark.class &&
        typeof mark.class === "object"
    ) {

        return (
            mark.class.name ||
            mark.class.className ||
            mark.class.title ||
            "Unknown Class"
        );

    }

    return (
        mark.className ||
        mark.classTitle ||
        mark.class ||
        "Unknown Class"
    );

}


/* =====================================================
   GET GRADE
===================================================== */

function getGrade(mark, percentage) {

    if (mark.grade) {

        if (
            typeof mark.grade === "object"
        ) {

            return (
                mark.grade.name ||
                mark.grade.grade ||
                ""
            );

        }

        return String(mark.grade);

    }

    if (percentage === null) {

        return "";

    }

    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "E";

}


/* =====================================================
   LOAD MARKS
===================================================== */

async function loadMarks(schoolFilter) {

    if (!Mark) {

        return [];

    }

    try {

        return await Mark
            .find(schoolFilter)
            .lean();

    } catch (error) {

        console.warn(
            "[ACADEMIC MARKS]",
            error.message
        );

        return [];

    }

}


/* =====================================================
   BUILD MARK ANALYTICS
===================================================== */

async function buildMarkAnalytics(
    schoolFilter
) {

    const marks =
        await loadMarks(schoolFilter);


    const subjectMap = new Map();

    const classMap = new Map();

    const gradeMap = new Map();

    const termMap = new Map();

    let totalPercentage = 0;

    let percentageCount = 0;


    marks.forEach(mark => {

        const percentage =
            getPercentage(mark);

        if (
            percentage === null
        ) {

            return;

        }


        /* -----------------------------------------
           SCHOOL AVERAGE
        ----------------------------------------- */

        totalPercentage += percentage;

        percentageCount++;


        /* -----------------------------------------
           SUBJECT
        ----------------------------------------- */

        const subjectId =
            getSubjectId(mark);

        const subjectName =
            getSubjectName(mark);

        const subjectKey =
            subjectId ||
            subjectName ||
            "unknown";


        if (!subjectMap.has(subjectKey)) {

            subjectMap.set(
                subjectKey,
                {
                    subjectId:
                        subjectId || null,

                    subject:
                        subjectName,

                    total: 0,

                    count: 0
                }
            );

        }


        const subjectData =
            subjectMap.get(subjectKey);

        subjectData.total += percentage;

        subjectData.count++;


        /* -----------------------------------------
           CLASS
        ----------------------------------------- */

        const classId =
            getClassId(mark);

        const className =
            getClassName(mark);

        const classKey =
            classId ||
            className ||
            "unknown";


        if (!classMap.has(classKey)) {

            classMap.set(
                classKey,
                {
                    classId:
                        classId || null,

                    class:
                        className,

                    total: 0,

                    count: 0
                }
            );

        }


        const classData =
            classMap.get(classKey);

        classData.total += percentage;

        classData.count++;


        /* -----------------------------------------
           GRADE
        ----------------------------------------- */

        const grade =
            getGrade(
                mark,
                percentage
            );


        if (grade) {

            gradeMap.set(
                grade,
                (gradeMap.get(grade) || 0) + 1
            );

        }


        /* -----------------------------------------
           TERM TREND
        ----------------------------------------- */

        const year =
            getYear(mark);

        const term =
            getTerm(mark);

        const termKey =
            `${year}|${term}`;


        if (
            year ||
            term
        ) {

            if (!termMap.has(termKey)) {

                termMap.set(
                    termKey,
                    {
                        year,
                        term,
                        total: 0,
                        count: 0
                    }
                );

            }

            const termData =
                termMap.get(termKey);

            termData.total += percentage;

            termData.count++;

        }

    });


    /* ---------------------------------------------
       SUBJECT PERFORMANCE
    --------------------------------------------- */

    const subjectPerformance =
        Array.from(
            subjectMap.values()
        )
            .map(item => ({

                subjectId:
                    item.subjectId,

                subject:
                    item.subject,

                name:
                    item.subject,

                average:
                    Number(
                        (
                            item.total /
                            item.count
                        ).toFixed(2)
                    ),

                assessments:
                    item.count

            }))
            .sort(
                (a, b) =>
                    b.average -
                    a.average
            );


    /* ---------------------------------------------
       CLASS PERFORMANCE
    --------------------------------------------- */

    const classPerformance =
        Array.from(
            classMap.values()
        )
            .map(item => ({

                classId:
                    item.classId,

                class:
                    item.class,

                name:
                    item.class,

                average:
                    Number(
                        (
                            item.total /
                            item.count
                        ).toFixed(2)
                    ),

                assessments:
                    item.count

            }))
            .sort(
                (a, b) =>
                    b.average -
                    a.average
            );


    /* ---------------------------------------------
       GRADE DISTRIBUTION
    --------------------------------------------- */

    const gradeDistribution =
        Array.from(
            gradeMap.entries()
        )
            .map(
                ([grade, count]) => ({

                    grade,

                    count

                })
            )
            .sort(
                (a, b) =>
                    a.grade.localeCompare(
                        b.grade
                    )
            );


    /* ---------------------------------------------
       EXAM / TERM TREND
    --------------------------------------------- */

    const examTrend =
        Array.from(
            termMap.values()
        )
            .map(item => ({

                year:
                    item.year,

                term:
                    item.term,

                average:
                    Number(
                        (
                            item.total /
                            item.count
                        ).toFixed(2)
                    ),

                assessments:
                    item.count

            }))
            .sort((a, b) => {

                const yearA =
                    String(a.year || "");

                const yearB =
                    String(b.year || "");

                if (
                    yearA !== yearB
                ) {

                    return yearA.localeCompare(
                        yearB
                    );

                }

                return String(
                    a.term || ""
                ).localeCompare(
                    String(
                        b.term || ""
                    )
                );

            });


    /* ---------------------------------------------
       SCHOOL AVERAGE
    --------------------------------------------- */

    const average =
        percentageCount
            ? Number(
                (
                    totalPercentage /
                    percentageCount
                ).toFixed(2)
            )
            : 0;


    return {

        average,

        marksCount:
            marks.length,

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
               COUNTS
            ----------------------------------------- */

            const totalSubjects =
                await safeCount(
                    Subject,
                    schoolFilter
                );


            const totalClasses =
                await safeCount(
                    Class,
                    schoolFilter
                );


            const students =
                await safeCount(
                    Student,
                    schoolFilter
                );


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
               MARK ANALYTICS
            ----------------------------------------- */

            const analytics =
                await buildMarkAnalytics(
                    schoolFilter
                );


            /* -----------------------------------------
               STUDENTS ASSESSED
            ----------------------------------------- */

            let studentsAssessed = 0;


            if (Mark) {

                try {

                    const result =
                        await Mark.aggregate([

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


                    studentsAssessed =
                        result[0]
                            ?.students
                            ?.length || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC STUDENTS ASSESSED]",
                        error.message
                    );

                }

            }


            /* -----------------------------------------
               FALLBACK TO REPORT CARDS
            ----------------------------------------- */

            if (
                studentsAssessed === 0
            ) {

                try {

                    const result =
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


                    studentsAssessed =
                        result[0]
                            ?.students
                            ?.length || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC REPORT CARD STUDENTS]",
                        error.message
                    );

                }

            }


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
                    analytics.average,

                reportCards,

                students,

                studentsAssessed,

                terms,

                marksCount:
                    analytics.marksCount,

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
               STUDENTS ASSESSED
            ----------------------------------------- */

            let studentsAssessed = 0;


            if (Mark) {

                try {

                    const result =
                        await Mark.aggregate([

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


                    studentsAssessed =
                        result[0]
                            ?.students
                            ?.length || 0;

                } catch (error) {

                    console.warn(
                        "[ACADEMIC ANALYTICS STUDENTS]",
                        error.message
                    );

                }

            }


            if (
                studentsAssessed === 0
            ) {

                studentsAssessed =
                    reportCardStats.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            item.studentsAssessed,
                        0
                    );

            }


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
               MARK ANALYTICS
            ----------------------------------------- */

            const analytics =
                await buildMarkAnalytics(
                    schoolFilter
                );


            /* -----------------------------------------
               REPORT-CARD FALLBACK TREND
            ----------------------------------------- */

            let examTrend =
                analytics.examTrend;


            if (
                !examTrend.length
            ) {

                examTrend =
                    reportCardStats.map(
                        item => ({

                            year:
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

            return res.json({

                success: true,

                data: {

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

                    studentsAssessed,

                    schoolAverage:
                        analytics.average,

                    average:
                        analytics.average,

                    marksCount:
                        analytics.marksCount

                },

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

                studentsAssessed,

                schoolAverage:
                    analytics.average,

                average:
                    analytics.average,

                marksCount:
                    analytics.marksCount

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
