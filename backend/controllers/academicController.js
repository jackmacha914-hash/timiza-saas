const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| MODELS
|--------------------------------------------------------------------------
*/

const Subject = require("../models/Subject");
const ReportCard = require("../models/ReportCard");

/*
|--------------------------------------------------------------------------
| OPTIONAL MODELS
|--------------------------------------------------------------------------
|
| Some Timiza installations may use different model names.
| We safely load them so the controller does not crash if a model
| does not exist.
|--------------------------------------------------------------------------
*/

let ClassModel = null;
let Student = null;
let Exam = null;
let Mark = null;
let Grade = null;

try {
    ClassModel = require("../models/Class");
} catch (err) {
    console.warn(
        "[ACADEMIC] Class model not found."
    );
}

try {
    Student = require("../models/Student");
} catch (err) {
    console.warn(
        "[ACADEMIC] Student model not found."
    );
}

try {
    Exam = require("../models/Exam");
} catch (err) {
    console.warn(
        "[ACADEMIC] Exam model not found."
    );
}

try {
    Mark = require("../models/Mark");
} catch (err) {
    console.warn(
        "[ACADEMIC] Mark model not found."
    );
}

try {
    Grade = require("../models/Grade");
} catch (err) {
    console.warn(
        "[ACADEMIC] Grade model not found."
    );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Get the current school ID.
 *
 * Supports:
 *
 * req.school
 * req.school._id
 * req.user.school
 * req.user.schoolId
 */
function getSchoolId(req) {

    const school =
        req.school?._id ||
        req.school?.id ||
        req.school;

    const userSchool =
        req.user?.school?._id ||
        req.user?.school?.id ||
        req.user?.school ||
        req.user?.schoolId;

    const schoolId =
        school ||
        userSchool;

    if (!schoolId) {
        return null;
    }

    return schoolId;
}


/**
 * Convert a possible MongoDB ID into an ObjectId.
 */
function toObjectId(id) {

    if (!id) {
        return null;
    }

    if (id instanceof mongoose.Types.ObjectId) {
        return id;
    }

    if (
        typeof id === "string" &&
        mongoose.Types.ObjectId.isValid(id)
    ) {
        return new mongoose.Types.ObjectId(id);
    }

    return id;
}


/**
 * Safely convert a value to a number.
 */
function number(value) {

    const parsed =
        Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;

}


/**
 * Round numbers to two decimal places.
 */
function round(value) {

    return Math.round(
        number(value) * 100
    ) / 100;

}


/**
 * Extract a numeric score from a mark/result object.
 */
function extractScore(item) {

    if (!item) {
        return null;
    }

    const possibleValues = [

        item.score,

        item.marks,

        item.mark,

        item.average,

        item.percentage,

        item.totalMarks,

        item.obtainedMarks,

        item.obtained,

        item.value

    ];

    for (const value of possibleValues) {

        if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            Number.isFinite(Number(value))
        ) {

            return Number(value);

        }

    }

    return null;

}


/**
 * Convert a score to a percentage.
 */
function percentageFromItem(item) {

    if (!item) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Already a percentage
    |--------------------------------------------------------------------------
    */

    if (
        item.percentage !== undefined &&
        item.percentage !== null &&
        Number.isFinite(Number(item.percentage))
    ) {

        return Math.max(
            0,
            Math.min(
                100,
                Number(item.percentage)
            )
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Average is normally already percentage-based in Timiza
    |--------------------------------------------------------------------------
    */

    if (
        item.average !== undefined &&
        item.average !== null &&
        Number.isFinite(Number(item.average))
    ) {

        return Math.max(
            0,
            Math.min(
                100,
                Number(item.average)
            )
        );

    }


    const score =
        extractScore(item);

    if (score === null) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | If maximum marks are available, calculate percentage.
    |--------------------------------------------------------------------------
    */

    const maxMarks =
        item.maxMarks ??
        item.maximumMarks ??
        item.total ??
        item.outOf ??
        item.maxScore;

    if (
        maxMarks !== undefined &&
        maxMarks !== null &&
        Number(maxMarks) > 0
    ) {

        return Math.max(
            0,
            Math.min(
                100,
                (score / Number(maxMarks)) * 100
            )
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Otherwise assume the score is already 0–100.
    |--------------------------------------------------------------------------
    */

    return Math.max(
        0,
        Math.min(
            100,
            score
        )
    );

}


/**
 * Convert percentage into a grade.
 *
 * You can change these boundaries to match your school's grading system.
 */
function calculateGrade(score) {

    const value =
        number(score);


    if (value >= 80) {
        return "A";
    }

    if (value >= 70) {
        return "B";
    }

    if (value >= 60) {
        return "C";
    }

    if (value >= 50) {
        return "D";
    }

    return "E";

}


/**
 * Return a normalized school filter.
 */
function schoolFilter(schoolId) {

    if (!schoolId) {
        return {};
    }

    return {
        school: schoolId
    };

}


/**
 * Safely count documents.
 */
async function safeCount(Model, filter = {}) {

    if (!Model) {
        return 0;
    }

    try {

        return await Model.countDocuments(
            filter
        );

    } catch (err) {

        console.error(
            "[ACADEMIC COUNT]",
            err.message
        );

        return 0;

    }

}


/*
|--------------------------------------------------------------------------
| GET ACADEMIC DASHBOARD
|--------------------------------------------------------------------------
|
| GET /api/academic/dashboard
|
|--------------------------------------------------------------------------
*/

async function getAcademicDashboard(req, res) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School could not be determined."

            });

        }


        const school =
            toObjectId(schoolId);


        /*
        |--------------------------------------------------------------------------
        | BASIC COUNTS
        |--------------------------------------------------------------------------
        */

        const totalSubjects =
            await safeCount(
                Subject,
                schoolFilter(school)
            );


        const totalClasses =
            await safeCount(
                ClassModel,
                schoolFilter(school)
            );


        const students =
            await safeCount(
                Student,
                schoolFilter(school)
            );


        const reportCards =
            await safeCount(
                ReportCard,
                schoolFilter(school)
            );


        /*
        |--------------------------------------------------------------------------
        | SUBJECT ALLOCATIONS
        |--------------------------------------------------------------------------
        |
        | If subjects contain classes/teachers arrays, calculate allocations
        | from them.
        |--------------------------------------------------------------------------
        */

        let allocations = 0;

        if (Subject) {

            try {

                const subjects =
                    await Subject.find(
                        schoolFilter(school)
                    )
                    .select(
                        "classes teachers"
                    )
                    .lean();

                for (const subject of subjects) {

                    if (
                        Array.isArray(
                            subject.classes
                        )
                    ) {

                        allocations +=
                            subject.classes.length;

                    } else if (
                        Array.isArray(
                            subject.teachers
                        )
                    ) {

                        allocations +=
                            subject.teachers.length;

                    }

                }

            } catch (err) {

                console.error(
                    "[ACADEMIC ALLOCATIONS]",
                    err.message
                );

            }

        }


        /*
        |--------------------------------------------------------------------------
        | ACTIVE EXAMS
        |--------------------------------------------------------------------------
        */

        let exams = 0;

        if (Exam) {

            try {

                exams =
                    await Exam.countDocuments({

                        ...schoolFilter(school),

                        $or: [

                            {
                                status:
                                    "active"
                            },

                            {
                                status:
                                    "published"
                            },

                            {
                                isActive:
                                    true
                            }

                        ]

                    });

            } catch (err) {

                console.error(
                    "[ACADEMIC EXAMS]",
                    err.message
                );

            }

        }


        /*
        |--------------------------------------------------------------------------
        | REPORT CARD AVERAGE
        |--------------------------------------------------------------------------
        |
        | ReportCard schema supplied by you currently does not have an
        | average field, so we calculate it from available academic data
        | where possible.
        |--------------------------------------------------------------------------
        */

        const analytics =
            await buildAcademicAnalytics(
                req
            );


        const average =
            analytics.overallAverage;


        const studentsAssessed =
            analytics.studentsAssessed;


        return res.json({

            success: true,

            totalSubjects,

            totalClasses,

            allocations,

            exams,

            reportCards,

            students,

            studentsAssessed,

            average: round(average),

            schoolAverage:
                round(average),

            subjectPerformance:
                analytics.subjectPerformance,

            classPerformance:
                analytics.classPerformance,

            gradeDistribution:
                analytics.gradeDistribution,

            trend:
                analytics.trend

        });

    } catch (err) {

        console.error(
            "[ACADEMIC DASHBOARD]",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load academic dashboard.",

            error:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined

        });

    }

}


/*
|--------------------------------------------------------------------------
| GET ACADEMIC ANALYTICS
|--------------------------------------------------------------------------
|
| GET /api/academic/analytics
|
|--------------------------------------------------------------------------
*/

async function getAcademicAnalytics(req, res) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School could not be determined."

            });

        }


        const analytics =
            await buildAcademicAnalytics(
                req
            );


        return res.json({

            success: true,

            data: {

                overallAverage:
                    analytics.overallAverage,

                studentsAssessed:
                    analytics.studentsAssessed,

                totalMarks:
                    analytics.totalMarks,

                highestScore:
                    analytics.highestScore,

                lowestScore:
                    analytics.lowestScore

            },

            subjectPerformance:
                analytics.subjectPerformance,

            classPerformance:
                analytics.classPerformance,

            gradeDistribution:
                analytics.gradeDistribution,

            trend:
                analytics.trend,

            /*
            |--------------------------------------------------------------------------
            | Compatibility aliases
            |--------------------------------------------------------------------------
            */

            subjectPerformanceData:
                analytics.subjectPerformance,

            classPerformanceData:
                analytics.classPerformance,

            gradeDistributionData:
                analytics.gradeDistribution,

            trendData:
                analytics.trend

        });

    } catch (err) {

        console.error(
            "[ACADEMIC ANALYTICS]",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load academic analytics.",

            error:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined

        });

    }

}


/*
|--------------------------------------------------------------------------
| BUILD ACADEMIC ANALYTICS
|--------------------------------------------------------------------------
*/

async function buildAcademicAnalytics(req) {

    const schoolId =
        getSchoolId(req);

    const school =
        toObjectId(schoolId);


    /*
    |--------------------------------------------------------------------------
    | RESULT CONTAINERS
    |--------------------------------------------------------------------------
    */

    const subjectMap =
        new Map();

    const classMap =
        new Map();

    const gradeMap =
        new Map();

    const trendMap =
        new Map();

    const studentScores =
        new Map();


    let totalMarks = 0;

    let totalScore = 0;

    let highestScore = 0;

    let lowestScore = 100;


    /*
    |--------------------------------------------------------------------------
    | LOAD MARKS
    |--------------------------------------------------------------------------
    */

    if (Mark) {

        try {

            const marks =
                await Mark.find(
                    schoolFilter(school)
                )
                .lean();


            for (const mark of marks) {

                const score =
                    percentageFromItem(mark);


                if (
                    score === null ||
                    !Number.isFinite(score)
                ) {

                    continue;

                }


                totalMarks++;

                totalScore += score;

                highestScore =
                    Math.max(
                        highestScore,
                        score
                    );

                lowestScore =
                    Math.min(
                        lowestScore,
                        score
                    );


                /*
                |--------------------------------------------------------------------------
                | STUDENT
                |--------------------------------------------------------------------------
                */

                const studentId =
                    mark.studentId ||
                    mark.student ||
                    mark.studentID ||
                    mark.userId;


                if (studentId) {

                    studentScores.set(
                        String(studentId),
                        score
                    );

                }


                /*
                |--------------------------------------------------------------------------
                | SUBJECT
                |--------------------------------------------------------------------------
                */

                const subjectId =
                    mark.subjectId ||
                    mark.subject ||
                    mark.subjectID;


                const subjectName =
                    mark.subjectName ||
                    (
                        typeof mark.subject === "object"
                            ? mark.subject?.name
                            : null
                    ) ||
                    "Unknown Subject";


                const subjectKey =
                    String(
                        subjectId ||
                        subjectName
                    );


                if (
                    !subjectMap.has(
                        subjectKey
                    )
                ) {

                    subjectMap.set(
                        subjectKey,
                        {
                            id:
                                subjectId ||
                                null,

                            name:
                                subjectName,

                            total: 0,

                            score: 0,

                            count: 0
                        }
                    );

                }


                const subject =
                    subjectMap.get(
                        subjectKey
                    );


                subject.total += 1;

                subject.score += score;

                subject.count += 1;


                /*
                |--------------------------------------------------------------------------
                | CLASS
                |--------------------------------------------------------------------------
                */

                const classId =
                    mark.classId ||
                    mark.class ||
                    mark.classID;


                const className =
                    mark.className ||
                    (
                        typeof mark.class === "object"
                            ? mark.class?.name
                            : null
                    ) ||
                    "Unknown Class";


                const classKey =
                    String(
                        classId ||
                        className
                    );


                if (
                    !classMap.has(
                        classKey
                    )
                ) {

                    classMap.set(
                        classKey,
                        {
                            id:
                                classId ||
                                null,

                            name:
                                className,

                            score: 0,

                            count: 0
                        }
                    );

                }


                const classData =
                    classMap.get(
                        classKey
                    );


                classData.score += score;

                classData.count += 1;


                /*
                |--------------------------------------------------------------------------
                | GRADE
                |--------------------------------------------------------------------------
                */

                const grade =
                    calculateGrade(
                        score
                    );


                if (
                    !gradeMap.has(
                        grade
                    )
                ) {

                    gradeMap.set(
                        grade,
                        0
                    );

                }


                gradeMap.set(
                    grade,
                    gradeMap.get(
                        grade
                    ) + 1
                );


                /*
                |--------------------------------------------------------------------------
                | TREND
                |--------------------------------------------------------------------------
                */

                const date =
                    mark.date ||
                    mark.createdAt ||
                    mark.updatedAt;


                let period =
                    "Current";


                if (date) {

                    const d =
                        new Date(date);


                    if (
                        !Number.isNaN(
                            d.getTime()
                        )
                    ) {

                        period =
                            d.toLocaleDateString(
                                "en-US",
                                {
                                    month:
                                        "short",

                                    year:
                                        "numeric"
                                }
                            );

                    }

                }


                if (
                    !trendMap.has(
                        period
                    )
                ) {

                    trendMap.set(
                        period,
                        {
                            score: 0,

                            count: 0
                        }
                    );

                }


                const trend =
                    trendMap.get(
                        period
                    );


                trend.score += score;

                trend.count += 1;

            }

        } catch (err) {

            console.error(
                "[ACADEMIC MARKS]",
                err.message
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FALLBACK: REPORT CARDS
    |--------------------------------------------------------------------------
    |
    | Your current ReportCard model does not explicitly contain marks.
    | However, some generated report cards may contain useful HTML content.
    |
    | We therefore inspect report cards only when Mark data is unavailable.
    |--------------------------------------------------------------------------
    */

    if (
        totalMarks === 0 &&
        ReportCard
    ) {

        try {

            const reports =
                await ReportCard.find(
                    schoolFilter(school)
                )
                .select(
                    "studentId studentName year term status htmlContent createdAt"
                )
                .lean();


            /*
            |--------------------------------------------------------------------------
            | Report cards may contain average values in HTML.
            |--------------------------------------------------------------------------
            */

            for (const report of reports) {

                const html =
                    String(
                        report.htmlContent ||
                        ""
                    );


                if (!html) {
                    continue;
                }


                /*
                |--------------------------------------------------------------------------
                | Attempt to extract common average formats:
                |
                | Average: 75
                | Average: 75%
                | Overall Average: 75
                |--------------------------------------------------------------------------
                */

                const match =
                    html.match(
                        /(?:overall\s+)?average\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i
                    );


                if (!match) {
                    continue;
                }


                const score =
                    Number(match[1]);


                if (
                    !Number.isFinite(score)
                ) {

                    continue;

                }


                if (
                    score < 0 ||
                    score > 100
                ) {

                    continue;

                }


                totalMarks++;

                totalScore += score;

                highestScore =
                    Math.max(
                        highestScore,
                        score
                    );

                lowestScore =
                    Math.min(
                        lowestScore,
                        score
                    );


                if (
                    report.studentId
                ) {

                    studentScores.set(
                        String(
                            report.studentId
                        ),
                        score
                    );

                }


                const grade =
                    calculateGrade(
                        score
                    );


                gradeMap.set(
                    grade,
                    (
                        gradeMap.get(
                            grade
                        ) || 0
                    ) + 1
                );


                const period =
                    report.term
                        ? String(
                            report.term
                        )
                        : "Current";


                if (
                    !trendMap.has(
                        period
                    )
                ) {

                    trendMap.set(
                        period,
                        {
                            score: 0,

                            count: 0
                        }
                    );

                }


                const trend =
                    trendMap.get(
                        period
                    );


                trend.score += score;

                trend.count += 1;

            }

        } catch (err) {

            console.error(
                "[ACADEMIC REPORT FALLBACK]",
                err.message
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | SUBJECT PERFORMANCE
    |--------------------------------------------------------------------------
    */

    const subjectPerformance =
        Array.from(
            subjectMap.values()
        )
        .map(subject => ({

            id:
                subject.id,

            name:
                subject.name,

            average:
                round(
                    subject.score /
                    Math.max(
                        subject.count,
                        1
                    )
                ),

            assessments:
                subject.count

        }))
        .sort(
            (a, b) =>
                b.average -
                a.average
        );


    /*
    |--------------------------------------------------------------------------
    | CLASS PERFORMANCE
    |--------------------------------------------------------------------------
    */

    const classPerformance =
        Array.from(
            classMap.values()
        )
        .map(classData => ({

            id:
                classData.id,

            name:
                classData.name,

            average:
                round(
                    classData.score /
                    Math.max(
                        classData.count,
                        1
                    )
                ),

            assessments:
                classData.count

        }))
        .sort(
            (a, b) =>
                b.average -
                a.average
        );


    /*
    |--------------------------------------------------------------------------
    | GRADE DISTRIBUTION
    |--------------------------------------------------------------------------
    */

    const gradeOrder = [
        "A",
        "B",
        "C",
        "D",
        "E"
    ];


    const gradeDistribution =
        gradeOrder.map(
            grade => ({

                grade,

                count:
                    gradeMap.get(
                        grade
                    ) || 0

            })
        );


    /*
    |--------------------------------------------------------------------------
    | TREND
    |--------------------------------------------------------------------------
    */

    const trend =
        Array.from(
            trendMap.entries()
        )
        .map(
            ([period, value]) => ({

                period,

                average:
                    round(
                        value.score /
                        Math.max(
                            value.count,
                            1
                        )
                    ),

                assessments:
                    value.count

            })
        );


    /*
    |--------------------------------------------------------------------------
    | SORT TREND CHRONOLOGICALLY WHERE POSSIBLE
    |--------------------------------------------------------------------------
    */

    trend.sort(
        (a, b) => {

            if (
                a.period === "Current"
            ) {
                return 1;
            }

            if (
                b.period === "Current"
            ) {
                return -1;
            }

            const aDate =
                new Date(
                    `1 ${a.period}`
                );

            const bDate =
                new Date(
                    `1 ${b.period}`
                );

            if (
                !Number.isNaN(
                    aDate.getTime()
                ) &&
                !Number.isNaN(
                    bDate.getTime()
                )
            ) {

                return (
                    aDate -
                    bDate
                );

            }

            return 0;

        }
    );


    /*
    |--------------------------------------------------------------------------
    | OVERALL AVERAGE
    |--------------------------------------------------------------------------
    */

    const overallAverage =
        totalMarks > 0
            ? round(
                totalScore /
                totalMarks
            )
            : 0;


    /*
    |--------------------------------------------------------------------------
    | STUDENTS ASSESSED
    |--------------------------------------------------------------------------
    */

    const studentsAssessed =
        studentScores.size;


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE EMPTY MINIMUM
    |--------------------------------------------------------------------------
    */

    if (totalMarks === 0) {

        lowestScore = 0;

    }


    /*
    |--------------------------------------------------------------------------
    | RETURN
    |--------------------------------------------------------------------------
    */

    return {

        overallAverage,

        studentsAssessed,

        totalMarks,

        highestScore:
            round(highestScore),

        lowestScore:
            round(lowestScore),

        subjectPerformance,

        classPerformance,

        gradeDistribution,

        trend

    };

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    getAcademicDashboard,

    getAcademicAnalytics

};
