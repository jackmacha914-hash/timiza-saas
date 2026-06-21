const mongoose = require('mongoose');

const otherChargeSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    chargeType: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    term: {
        type: String,
        required: true
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

module.exports = mongoose.model('OtherCharge', otherChargeSchema);
