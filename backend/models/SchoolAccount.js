const mongoose = require('mongoose');

const schoolAccountSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    username: {
        type: String,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['student', 'teacher'],
        required: true,
        lowercase: true
    },

    subject: {
        type: String,
        default: ''
    },

    studentClass: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Inactive'],
        default: 'Active'
    }

}, {
    timestamps: true
});


// Same email can exist in different schools
schoolAccountSchema.index({
    school: 1,
    email: 1
}, {
    unique: true
});


// Same username can exist in different schools
schoolAccountSchema.index({
    school: 1,
    username: 1
}, {
    unique: true,
    sparse: true
});

module.exports =
    mongoose.models.SchoolAccount ||
    mongoose.model('SchoolAccount', schoolAccountSchema);
