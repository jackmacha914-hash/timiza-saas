const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    title: {
        type: String,
        required: [true, 'Quiz title is required'],
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },

    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },

    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Teacher ID is required']
    },

    questions: [{
        questionText: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true
        },

        options: [{
            type: String,
            required: true,
            trim: true
        }],

        correctAnswer: {
            type: Number,
            required: [true, 'Correct answer index is required'],
            min: 0
        },

        points: {
            type: Number,
            default: 1,
            min: 0
        },

        explanation: {
            type: String,
            trim: true
        }
    }],

    timeLimit: {
        type: Number,
        default: 30,
        min: 1
    },

    passingScore: {
        type: Number,
        default: 60,
        min: 0,
        max: 100
    },

    isPublished: {
        type: Boolean,
        default: false
    },

    allowMultipleAttempts: {
        type: Boolean,
        default: false
    },

    showCorrectAnswers: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// Tenant-aware indexes
quizSchema.index({ school: 1, teacherId: 1 });
quizSchema.index({ school: 1, class: 1 });
quizSchema.index({ school: 1, subject: 1 });
quizSchema.index({ school: 1, isPublished: 1 });

// Search index
quizSchema.index({
    title: 'text',
    description: 'text'
});


// Total quiz points
quizSchema.virtual('totalPoints').get(function () {
    return this.questions.reduce(
        (sum, q) => sum + (q.points || 1),
        0
    );
});

module.exports =
    mongoose.models.Quiz ||
    mongoose.model('Quiz', quizSchema);
