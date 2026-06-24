const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    studentName: {
        type: String,
        required: true,
        trim: true
    },

    studentEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    className: {
        type: String,
        required: true,
        trim: true
    },

    quizTitle: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        selectedOption: {
            type: Number,
            required: true
        },

        isCorrect: {
            type: Boolean,
            default: false
        },

        pointsEarned: {
            type: Number,
            default: 0
        }
    }],

    score: {
        type: Number,
        default: 0
    },

    totalScore: {
        type: Number,
        default: 0
    },

    percentage: {
        type: Number,
        default: 0
    },

    passed: {
        type: Boolean,
        default: false
    },

    timeSpent: {
        type: Number,
        default: 0
    },

    submittedAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});


// Prevent duplicate submissions
submissionSchema.index(
    { school: 1, quiz: 1, user: 1 },
    { unique: true }
);

// Fast dashboard queries
submissionSchema.index({ school: 1, className: 1 });
submissionSchema.index({ school: 1, subject: 1 });
submissionSchema.index({ school: 1, submittedAt: -1 });


// Virtual
submissionSchema.virtual('timeSpentMinutes').get(function () {
    return Math.ceil(this.timeSpent / 60);
});


// Auto score calculator
submissionSchema.methods.calculateScore = async function () {

    const Quiz = mongoose.model('Quiz');

    const quiz = await Quiz.findById(this.quiz);

    if (!quiz) return this;

    let score = 0;
    let totalPossible = 0;

    this.answers.forEach(answer => {

        const question = quiz.questions.id(answer.question);

        if (!question) return;

        totalPossible += question.points || 1;

        if (answer.selectedOption === question.correctAnswer) {

            answer.isCorrect = true;
            answer.pointsEarned = question.points || 1;

            score += answer.pointsEarned;

        } else {

            answer.isCorrect = false;
            answer.pointsEarned = 0;
        }
    });

    this.score = score;
    this.totalScore = totalPossible;
    this.percentage =
        totalPossible > 0
            ? Math.round((score / totalPossible) * 100)
            : 0;

    this.passed =
        this.percentage >= (quiz.passingScore || 60);

    return this.save();
};

module.exports =
    mongoose.models.Submission ||
    mongoose.model('Submission', submissionSchema);
