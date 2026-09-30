const mongoose = require('mongoose');

const transportFeeSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
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
    }

}, {
    timestamps: true
});


// One transport fee per route PER SCHOOL
transportFeeSchema.index(
    {
        school: 1,
        route: 1
    },
    {
        unique: true
    }
);


// Reporting indexes
transportFeeSchema.index({
    school: 1
});

module.exports =
    mongoose.models.TransportFee ||
    mongoose.model(
        'TransportFee',
        transportFeeSchema
    );
