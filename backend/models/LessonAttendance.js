const mongoose = require("mongoose");


// =====================================================
// LESSON ATTENDANCE SCHEMA
// =====================================================

const lessonAttendanceSchema = new mongoose.Schema(

    {
        // =================================================
        // TENANT / SCHOOL
        // =================================================

        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true
        },


        // =================================================
        // ONLINE LESSON
        // =================================================

        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OnlineLesson",
            required: true,
            index: true
        },


        // =================================================
        // STUDENT
        // =================================================

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // =================================================
        // JOIN / LEAVE INFORMATION
        // =================================================

        joinedAt: {
            type: Date,
            default: null
        },

        leftAt: {
            type: Date,
            default: null
        },


        // =================================================
        // ATTENDANCE STATUS
        // =================================================

        status: {
            type: String,
            enum: [
                "present",
                "late",
                "left_early",
                "absent"
            ],
            default: "present",
            index: true
        }
    },

    {
        timestamps: true
    }
);


// =====================================================
// PREVENT DUPLICATE ATTENDANCE
// =====================================================
//
// One student should have only one attendance record
// for a particular online lesson within a school.
// =====================================================

lessonAttendanceSchema.index(
    {
        school: 1,
        lesson: 1,
        student: 1
    },
    {
        unique: true
    }
);


// =====================================================
// LESSON ATTENDANCE QUERIES
// =====================================================

lessonAttendanceSchema.index({
    school: 1,
    lesson: 1,
    status: 1
});


// =====================================================
// STUDENT ATTENDANCE HISTORY
// =====================================================

lessonAttendanceSchema.index({
    school: 1,
    student: 1,
    createdAt: -1
});


// =====================================================
// EXPORT
// =====================================================

module.exports =
    mongoose.models.LessonAttendance ||
    mongoose.model(
        "LessonAttendance",
        lessonAttendanceSchema
    );
