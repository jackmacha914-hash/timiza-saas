const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({

    // ===============================
    // SAAS TENANT ISOLATION
    // ===============================
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    className: {
        type: String,
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    mealType: {
        type: String,
        required: true
    },

    term: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    frequency: {
        type: String
    },

    amount: {
        type: Number,
        required: true
    },

    receiptNumber: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});


// ===============================
// INDEXES (SAAS SAFE)
// ===============================
mealSchema.index({ school: 1, date: 1 });
mealSchema.index({ school: 1, className: 1 });
mealSchema.index({ school: 1, receiptNumber: 1 }, { unique: true });

module.exports =
    mongoose.models.Meal ||
    mongoose.model('Meal', mealSchema);
