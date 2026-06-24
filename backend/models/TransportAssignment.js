const mongoose = require('mongoose');

const transportAssignmentSchema = new mongoose.Schema({

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

    bus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },

    assignedAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});


// Prevent duplicate assignment
transportAssignmentSchema.index(
    { school: 1, student: 1 },
    { unique: true }
);


// Fast lookups
transportAssignmentSchema.index({
    school: 1,
    route: 1
});

transportAssignmentSchema.index({
    school: 1,
    bus: 1
});

module.exports =
    mongoose.models.TransportAssignment ||
    mongoose.model(
        'TransportAssignment',
        transportAssignmentSchema
    );
