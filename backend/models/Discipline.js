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
        trim: true,
        default: ''
    },


    className: {
        type: String,
        trim: true,
        default: ''
    },


    // =====================================================
    // DISCIPLINE CATEGORY
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


    // =====================================================
    // SEVERITY
    // =====================================================

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


    // =====================================================
    // DESCRIPTION
    // =====================================================

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000
    },


    // =====================================================
    // INCIDENT DATE
    // =====================================================

    incidentDate: {
        type: Date,
        required: true
    },


    // =====================================================
    // REPORTED BY
    //
    // IMPORTANT:
    // Store the actual User ID.
    //
    // This allows:
    //
    // .populate('reportedBy')
    //
    // and allows teacher security:
    //
    // filter.reportedBy = userId
    //
    // =====================================================

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },


    // =====================================================
    // ROLE OF PERSON WHO REPORTED
    // =====================================================

    reportedByRole: {
        type: String,
        enum: [
            'admin',
            'teacher'
        ],
        default: 'teacher'
    },


    // =====================================================
    // ACTION TAKEN
    // =====================================================

    actionTaken: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },


    // =====================================================
    // STATUS
    // =====================================================

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


    // =====================================================
    // RESOLUTION NOTES
    // =====================================================

    resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },


    // =====================================================
    // RESOLVED DATE
    // =====================================================

    resolvedAt: {
        type: Date,
        default: null
    },


    // =====================================================
    // OPTIONAL EXTENDED DISCIPLINE INFORMATION
    //
    // Your frontend already sends these fields when
    // editing a case, so they should exist in the schema.
    // =====================================================

    investigationNotes: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: ''
    },


    resolution: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: ''
    },


    followUpDate: {
        type: Date,
        default: null
    },


    parentNotified: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


// =====================================================
// INDEXES
// =====================================================

disciplineSchema.index({
    school: 1,
    createdAt: -1
});


disciplineSchema.index({
    school: 1,
    reportedBy: 1,
    createdAt: -1
});


disciplineSchema.index({
    school: 1,
    student: 1,
    incidentDate: -1
});


// =====================================================
// EXPORT
// =====================================================

module.exports =
    mongoose.model(
        'Discipline',
        disciplineSchema
    );
