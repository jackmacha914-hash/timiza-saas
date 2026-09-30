const mongoose = require('mongoose');

const transportPaymentSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    term: {
        type: String,
        enum: ['Term 1', 'Term 2', 'Term 3'],
        required: true
    },

    academicYear: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ['Cash', 'Mpesa', 'Bank Transfer'],
        required: true
    },

    balance: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['Unpaid', 'Partial', 'Paid'],
        default: 'Unpaid'
    }

}, {
    timestamps: true
});


// Fast lookups
transportPaymentSchema.index({
    school: 1,
    student: 1
});

transportPaymentSchema.index({
    school: 1,
    route: 1
});

transportPaymentSchema.index({
    school: 1,
    term: 1,
    academicYear: 1
});


// Prevent duplicate transport billing period
transportPaymentSchema.index(
    {
        school: 1,
        student: 1,
        route: 1,
        term: 1,
        academicYear: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.models.TransportPayment ||
    mongoose.model(
        'TransportPayment',
        transportPaymentSchema
    );
