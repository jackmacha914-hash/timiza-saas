const mongoose = require("mongoose");

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

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


/* =====================================================
   ROUND
===================================================== */

function round(value, decimals = 2) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {

        return null;

    }

    const factor =
        Math.pow(10, decimals);

    return Math.round(
        Number(value) * factor
    ) / factor;

}


/* =====================================================
   GET MARK VALUE
===================================================== */

function getObtainedMark(mark) {

    const candidates = [

        mark?.score,

        mark?.marks,

        mark?.mark,

        mark?.obtainedMarks,

        mark?.obtained,

        mark?.totalScore,

        mark?.value

    ];

    for (const value of candidates) {

        const number =
            toNumber(value);

        if (number !== null) {

            return number;

        }

    }

    return null;

}


/* =====================================================
   GET MAX MARK
===================================================== */

function getMaximumMark(mark) {

    const candidates = [

        mark?.totalMarks,

        mark?.maxMarks,

        mark?.maximumMarks,

        mark?.outOf,

        mark?.maxScore,

        mark?.total,

        mark?.exam?.totalMarks

    ];

    for (const value of candidates) {

        const number =
            toNumber(value);

        if (
            number !== null &&
            number > 0
        ) {

            return number;

        }

    }

    /*
     * If the Mark collection stores marks
     * directly as percentages, use 100.
     */

    return 100;

}


/* =====================================================
   GET PERCENTAGE
===================================================== */

function getPercentage(mark) {

    const obtained =
        getObtainedMark(mark);

    if (obtained === null) {

        return null;

    }

    const maximum =
        getMaximumMark(mark);

    if (
        maximum === null ||
        maximum <= 0
    ) {

        return null;

    }

    /*
     * If maximum is 100, this is already
     * a percentage.
     */

    return (
        obtained / maximum
    ) * 100;

}


/* =====================================================
   EXTRACT ID
===================================================== */

function extractId(value) {

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
   EXTRACT NAME
===================================================== */

function extractName(value, fallback = "-") {

    if (!value) {

        return fallback;

    }

    if (typeof value === "string") {

        return value;

    }

    return (
        value.name ||
        value.subjectName ||
        value.className ||
        value.title ||
        fallback
    );

}


/* =====================================================
   MARK SUBJECT INFORMATION
===================================================== */

function getSubjectInfo(mark) {

    const source =

        mark.subject ||
        mark.subjectId ||
        mark.course ||
        mark.courseId ||
        null;

    return {

        id:
            extractId(source),

        name:
            extractName(
                source,
                mark.subjectName ||
                mark.subject ||
                "Unknown Subject"
            )

    };

}


/* =====================================================
   MARK CLASS INFORMATION
===================================================== */

function getClassInfo(mark) {

    const source =

        mark.class ||
        mark.classId ||
        mark.classroom ||
        mark.classroomId ||
        mark.section ||
        mark.sectionId ||
        null;

    return {

        id:
            extractId(source),

        name:
            extractName(
                source,
                mark.className ||
                mark.classroomName ||
                mark.sectionName ||
                "Unknown Class"
            )

    };

}


/* =====================================================
   MARK STUDENT INFORMATION
===================================================== */

function getStudentInfo(mark) {

    const source =

        mark.student ||
        mark.studentId ||
        mark.user ||
        mark.userId ||
        null;

    return {

        id:
            extractId(source),

        name:
            extractName(
                source,
                mark.studentName ||
                mark.name ||
                "Unknown Student"
            )

    };

}


/* =====================================================
   NORMALIZE MARKS
===================================================== */

function normalizeMarks(marks) {

    return marks
        .map(mark => {

            const percentage =
                getPercentage(mark);

            if (percentage === null) {

                return null;

            }

            const subject =
                getSubjectInfo(mark);

            const classroom =
                getClassInfo(mark);

            const student =
                getStudentInfo(mark);

            return {

                raw: mark,

                percentage:
                    Math.max(
                        0,
                        Math.min(
                            100,
                            percentage
                        )
                    ),

                subjectId:
                    subject.id,

                subjectName:
                    subject.name,

                classId:
                    classroom.id,

                className:
                    classroom.name,

                studentId:
                    student.id,

                studentName:
                    student.name,

                year:
                    mark.year ||
                    mark.academicYear ||
                    mark.session ||
                    null,

                term:
                    mark.term ||
                    mark.termName ||
                    null,

                examName:
                    mark.examName ||
                    mark.exam?.name ||
                    mark.exam?.title ||
                    "Assessment"

            };

        })
        .filter(Boolean);

}


/* =====================================================
   GET SCHOOL MARKS
===================================================== */

async function getSchoolMarks(schoolId) {

    if (!Mark) {

        return [];

    }

    try {

        const filter =
            schoolId
                ? { school: schoolId }
                : {};

        return await Mark
            .find(filter)
            .lean();

    } catch (error) {

        console.error(
            "[ACADEMIC MARKS]",
            error
        );

        return [];

    }

}


/* =====================================================
   SUBJECT PERFORMANCE
===================================================== */

function calculateSubjectPerformance(marks) {

    const groups = new Map();

    marks.forEach(mark => {

        const key =
            mark.subjectId ||
            mark.subjectName;

        if (!key) {
            return;
        }

        if (!groups.has(key)) {

            groups.set(
                key,
                {
                    subjectId:
                        mark.subjectId,

                    subject:
                        mark.subjectName,

                    total: 0,

                    count: 0,

                    students:
                        new Set()
                }
            );

        }

        const group =
            groups.get(key);

        group.total +=
            mark.percentage;

        group.count += 1;

        if (mark.studentId) {

            group.students.add(
                mark.studentId
            );

        }

    });

    return Array
        .from(groups.values())
        .map(group => ({

            subjectId:
                group.subjectId,

            subject:
                group.subject,

            average:
                round(
                    group.total /
                    group.count
                ),

            marks:
                group.count,

            students:
                group.students.size

        }))
        .sort(
            (a, b) =>
                b.average - a.average
        );

}


/* =====================================================
   CLASS PERFORMANCE
===================================================== */

function calculateClassPerformance(marks) {

    const groups = new Map();

    marks.forEach(mark => {

        const key =
            mark.classId ||
            mark.className;

        if (!key) {
            return;
        }

        if (!groups.has(key)) {

            groups.set(
                key,
                {
                    classId:
                        mark.classId,

                    className:
                        mark.className,

                    total: 0,

                    count: 0,

                    students:
                        new Set()
                }
            );

        }

        const group =
            groups.get(key);

        group.total +=
            mark.percentage;

        group.count += 1;

        if (mark.studentId) {

            group.students.add(
                mark.studentId
            );

        }

    });

    return Array
        .from(groups.values())
        .map(group => ({

            classId:
                group.classId,

            className:
                group.className,

            average:
                round(
                    group.total /
                    group.count
                ),

            marks:
                group.count,

            students:
                group.students.size

        }))
        .sort(
            (a, b) =>
                b.average - a.average
        );

}


/* =====================================================
   GRADE CALCULATION
===================================================== */

function calculateGrade(percentage) {

    if (percentage >= 80) {
        return "A";
    }

    if (percentage >= 70) {
        return "B";
    }

    if (percentage >= 60) {
        return "C";
    }

    if (percentage >= 50) {
        return "D";
    }

    if (percentage >= 40) {
        return "E";
    }

    return "F";

}


/* =====================================================
   GRADE DISTRIBUTION
===================================================== */

function calculateGradeDistribution(marks) {

    const grades = {

        A: 0,

        B: 0,

        C: 0,

        D: 0,

        E: 0,

        F: 0

    };

    marks.forEach(mark => {

        const grade =
            calculateGrade(
                mark.percentage
            );

        grades[grade]++;

    });

    return Object
        .entries(grades)
        .map(
            ([grade, count]) => ({

                grade,

                count

            })
        );

}


/* =====================================================
   OVERALL AVERAGE
===================================================== */

function calculateOverallAverage(marks) {

    if (!marks.length) {

        return 0;

    }

    const total =
        marks.reduce(
            (sum, mark) =>
                sum + mark.percentage,
            0
        );

    return round(
        total / marks.length
    );

}


/* =====================================================
   UNIQUE STUDENTS
===================================================== */

function countUniqueStudents(marks) {

    const students =
        new Set();

    marks.forEach(mark => {

        if (mark.studentId) {

            students.add(
                mark.studentId
            );

        }

    });

    return students.size;

}


/* =====================================================
   EXAM / TERM TREND
===================================================== */

function calculateExamTrend(marks) {

    const groups =
        new Map();

    marks.forEach(mark => {

        const year =
            mark.year || "Current";

        const term =
            mark.term || "All";

        const key =
            `${year}|${term}`;

        if (!groups.has(key)) {

            groups.set(
                key,
                {
                    year,

                    term,

                    total: 0,

                    count: 0,

                    students:
                        new Set()
                }
            );

        }

        const group =
            groups.get(key);

        group.total +=
            mark.percentage;

        group.count++;

        if (mark.studentId) {

            group.students.add(
                mark.studentId
            );

        }

    });

    return Array
        .from(groups.values())
        .map(group => ({

            year:
                group.year,

            term:
                group.term,

            average:
                round(
                    group.total /
                    group.count
                ),

            marks:
                group.count,

            studentsAssessed:
                group.students.size

        }))
        .sort((a, b) => {

            const yearA =
                String(a.year);

            const yearB =
                String(b.year);

            if (yearA !== yearB) {

                return yearA.localeCompare(
                    yearB
                );

            }

            return String(a.term)
                .localeCompare(
                    String(b.term)
                );

        });

}


/* =====================================================
   STATUS DISTRIBUTION
===================================================== */

async function getStatusDistribution(schoolFilter) {

    try {

        return await ReportCard.aggregate([

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

    } catch (error) {

        console.error(
            "[ACADEMIC STATUS]",
            error
        );

        return [];

    }

}


/* =====================================================
   YEAR DISTRIBUTION
===================================================== */

async function getYearDistribution(schoolFilter) {

    try {

        return await ReportCard.aggregate([

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

    } catch (error) {

        console.error(
            "[ACADEMIC YEAR]",
            error
        );

        return [];

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

async function getAcademicDashboard(req, res) {

    try {

        const schoolId =
            getSchoolId(req);

        const schoolFilter =
            schoolId
                ? { school: schoolId }
                : {};


        /* ---------------------------------------------
           BASIC COUNTS
        --------------------------------------------- */

        const [

            totalSubjects,

            totalClasses,

            students,

            reportCards

        ] = await Promise.all([

            safeCount(
                Subject,
                schoolFilter
            ),

            safeCount(
                Class,
                schoolFilter
            ),

            safeCount(
                Student,
                schoolFilter
            ),

            safeCount(
                ReportCard,
                schoolFilter
            )

        ]);


        /* ---------------------------------------------
           EXAMS
        --------------------------------------------- */

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


        /* ---------------------------------------------
           MARKS
        --------------------------------------------- */

        const rawMarks =
            await getSchoolMarks(
                schoolId
            );

        const marks =
            normalizeMarks(
                rawMarks
            );


        /* ---------------------------------------------
           CALCULATIONS
        --------------------------------------------- */

        const average =
            calculateOverallAverage(
                marks
            );

        const studentsAssessed =
            countUniqueStudents(
                marks
            );


        /* ---------------------------------------------
           ALLOCATIONS
        --------------------------------------------- */

        let allocations = 0;

        if (Subject) {

            try {

                const subjects =
                    await Subject
                        .find(schoolFilter)
                        .select(
                            "classes teachers"
                        )
                        .lean();

                allocations =
                    subjects.reduce(
                        (total, subject) => {

                            return (
                                total +
                                (
                                    Array.isArray(
                                        subject.classes
                                    )
                                        ? subject.classes.length
                                        : 0
                                )
                            );

                        },
                        0
                    );

            } catch (error) {

                allocations = 0;

            }

        }


        /* ---------------------------------------------
           TERMS
        --------------------------------------------- */

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

                        year:
                            "$_id.year",

                        term:
                            "$_id.term",

                        count: 1

                    }

                }

            ]);


        return res.json({

            success: true,

            totalSubjects,

            totalClasses,

            allocations,

            exams,

            average,

            reportCards,

            students,

            studentsAssessed,

            marksRecorded:
                marks.length,

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
                "Unable to load academic dashboard.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });

    }

}


/* =====================================================
   ACADEMIC ANALYTICS
===================================================== */

async function getAcademicAnalytics(req, res) {

    try {

        const schoolId =
            getSchoolId(req);

        const schoolFilter =
            schoolId
                ? { school: schoolId }
                : {};


        /* ---------------------------------------------
           MARKS
        --------------------------------------------- */

        const rawMarks =
            await getSchoolMarks(
                schoolId
            );

        const marks =
            normalizeMarks(
                rawMarks
            );


        /* ---------------------------------------------
           PERFORMANCE
        --------------------------------------------- */

        const subjectPerformance =
            calculateSubjectPerformance(
                marks
            );

        const classPerformance =
            calculateClassPerformance(
                marks
            );

        const gradeDistribution =
            calculateGradeDistribution(
                marks
            );

        const examTrend =
            calculateExamTrend(
                marks
            );


        /* ---------------------------------------------
           OVERALL
        --------------------------------------------- */

        const average =
            calculateOverallAverage(
                marks
            );

        const studentsAssessed =
            countUniqueStudents(
                marks
            );


        /* ---------------------------------------------
           REPORT CARDS
        --------------------------------------------- */

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


        /* ---------------------------------------------
           STATUS
        --------------------------------------------- */

        const statusDistribution =
            await getStatusDistribution(
                schoolFilter
            );


        /* ---------------------------------------------
           YEARS
        --------------------------------------------- */

        const yearDistribution =
            await getYearDistribution(
                schoolFilter
            );


        /* ---------------------------------------------
           RESPONSE
        --------------------------------------------- */

        return res.json({

            success: true,

            data: {

                average,

                marksRecorded:
                    marks.length,

                studentsAssessed,

                subjectPerformance,

                classPerformance,

                gradeDistribution,

                examTrend,

                reportCardStats,

                statusDistribution,

                yearDistribution

            },

            average,

            marksRecorded:
                marks.length,

            studentsAssessed,

            subjectPerformance,

            classPerformance,

            gradeDistribution,

            examTrend,

            reportCardStats,

            statusDistribution,

            yearDistribution

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
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });

    }

}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

    adminOnly,

    getAcademicDashboard,

    getAcademicAnalytics

};
