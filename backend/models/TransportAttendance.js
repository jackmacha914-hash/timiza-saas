const mongoose = require('mongoose');

const transportAttendanceSchema = new mongoose.Schema({

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

    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    present: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});


// One attendance record per student per route per day
transportAttendanceSchema.index(
    {
        school: 1,
        student: 1,
        route: 1,
        date: 1
    },
    {
        unique: true
    }
);


// Fast reporting
transportAttendanceSchema.index({
    school: 1,
    date: 1
});

transportAttendanceSchema.index({
    school: 1,
    route: 1
});

transportAttendanceSchema.index({
    school: 1,
    bus: 1
});

module.exports =
    mongoose.models.TransportAttendance ||
    mongoose.model(
        'TransportAttendance',
        transportAttendanceSchema
    );
