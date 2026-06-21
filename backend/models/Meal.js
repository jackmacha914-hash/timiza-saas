const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
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
}, { timestamps: true });

module.exports = mongoose.model('Meal', mealSchema);
