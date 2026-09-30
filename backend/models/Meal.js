const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
{
    // ===============================
    // SAAS TENANT ISOLATION
    // ===============================
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School is required'],
        index: true
    },

    className: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },

    studentName: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },

    mealType: {
        type: String,
        required: [true, 'Meal type is required'],
        trim: true
    },

    term: {
        type: String,
        required: [true, 'Term is required'],
        enum: ['Term 1', 'Term 2', 'Term 3']
    },

    date: {
        type: Date,
        required: [true, 'Meal date is required']
    },

    frequency: {
        type: String,
        default: ''
    },

    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },

    receiptNumber: {
        type: String,
        required: [true, 'Receipt number is required'],
        trim: true
    }

},
{
    timestamps: true
});

// ===============================
// INDEXES
// ===============================
mealSchema.index({ school: 1, date: 1 });
mealSchema.index({ school: 1, className: 1 });
mealSchema.index(
    { school: 1, receiptNumber: 1 },
    { unique: true }
);

module.exports =
    mongoose.models.Meal ||
    mongoose.model('Meal', mealSchema);
