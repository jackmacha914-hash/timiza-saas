const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({

    // ===============================
    // SAAS TENANT ISOLATION
    // ===============================
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    homework: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    submissionFile: {
        type: String,
        required: true
    },

    comments: {
        type: String,
        default: ''
    },

    grade: {
        type: Number,
        min: 0,
        max: 100
    },

    submittedAt: {
        type: Date,
        default: Date.now
    },

    gradedAt: {
        type: Date
    },

    teacherFeedback: {
        type: String,
        default: ''
    }

}, {
    timestamps: true
});


// ===============================
// INDEXES
// ===============================

// One submission per homework per student per school
homeworkSubmissionSchema.index(
    {
        school: 1,
        homework: 1,
        student: 1
    },
    { unique: true }
);

homeworkSubmissionSchema.index({
    school: 1,
    student: 1
});

homeworkSubmissionSchema.index({
    school: 1,
    homework: 1
});


module.exports =
    mongoose.models.HomeworkSubmission ||
    mongoose.model(
        'HomeworkSubmission',
        homeworkSubmissionSchema
    );
