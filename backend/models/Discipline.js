const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    admissionNumber: {
        type: String,
        trim: true
    },

    className: {
        type: String,
        trim: true
    },

    category: {
        type: String,
        enum: [
            'Late Coming',
            'Absenteeism',
            'Bullying',
            'Fighting',
            'Disrespect',
            'Theft',
            'Property Damage',
            'Academic Misconduct',
            'Uniform Violation',
            'Substance Violation',
            'Other'
        ],
        required: true
    },

    severity: {
        type: String,
        enum: [
            'low',
            'medium',
            'high',
            'critical'
        ],
        default: 'low'
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000
    },

    incidentDate: {
        type: Date,
        required: true
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    reportedByRole: {
        type: String,
        enum: [
            'admin',
            'teacher'
        ]
    },

    actionTaken: {
        type: String,
        trim: true,
        maxlength: 2000
    },

    status: {
        type: String,
        enum: [
            'reported',
            'under_investigation',
            'hearing_scheduled',
            'action_taken',
            'resolved',
            'dismissed'
        ],
        default: 'reported'
    },

    resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 2000
    },

    resolvedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Discipline', disciplineSchema);
