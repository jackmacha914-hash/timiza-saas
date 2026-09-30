const mongoose = require('mongoose');

const otherChargeSchema = new mongoose.Schema({

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

}, {
    timestamps: true
});


// ===============================
// INDEXES (SAAS SAFE)
// ===============================
otherChargeSchema.index({ school: 1, date: 1 });
otherChargeSchema.index({ school: 1, className: 1 });
otherChargeSchema.index({ school: 1, receiptNumber: 1 }, { unique: true });

module.exports =
    mongoose.models.OtherCharge ||
    mongoose.model('OtherCharge', otherChargeSchema);
