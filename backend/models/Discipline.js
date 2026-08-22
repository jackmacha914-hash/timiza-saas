const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({

    // =====================================================
    // SCHOOL
    // =====================================================

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },


    // =====================================================
    // STUDENT
    // =====================================================

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },


    admissionNumber: {
        type: String,
        trim: true
    },


    className: {
        type: String,
        trim: true,
        index: true
    },


    // =====================================================
    // REPORTER
    // =====================================================

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },


    reportedByRole: {
        type: String,
        enum: [
            'admin',
            'teacher'
        ],
        required: true
    },


    // =====================================================
    // DISCIPLINE INFORMATION
    // =====================================================

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


// =====================================================
// INDEXES
// =====================================================

disciplineSchema.index({
    school: 1,
    reportedBy: 1,
    createdAt: -1
});

disciplineSchema.index({
    school: 1,
    className: 1,
    createdAt: -1
});

disciplineSchema.index({
    school: 1,
    student: 1,
    createdAt: -1
});


module.exports =
    mongoose.models.Discipline ||
    mongoose.model('Discipline', disciplineSchema);
