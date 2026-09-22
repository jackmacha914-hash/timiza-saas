const mongoose = require("mongoose");

// =====================================================
// TEACHER MEETING INTEGRATION SCHEMA
// =====================================================

const teacherMeetingIntegrationSchema = new mongoose.Schema(
    {
        // TENANT / SCHOOL
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true
        },

        // TEACHER
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // VIDEO PROVIDER
        provider: {
            type: String,
            enum: [
                "google_meet",
                "zoom",
                "microsoft_teams"
            ],
            required: true,
            index: true
        },

        // PROVIDER ACCOUNT
        providerAccountId: {
            type: String,
            default: null,
            trim: true
        },

        // OAUTH TOKENS
        // These must NEVER be returned to the frontend.
        encryptedAccessToken: {
            type: String,
            default: null
        },

        encryptedRefreshToken: {
            type: String,
            default: null
        },

        tokenExpiresAt: {
            type: Date,
            default: null
        },

        // CONNECTION STATUS
        active: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// One connection per provider for each teacher in a school.
teacherMeetingIntegrationSchema.index(
    {
        school: 1,
        teacher: 1,
        provider: 1
    },
    {
        unique: true
    }
);

// Fast lookup of active integrations.
teacherMeetingIntegrationSchema.index({
    school: 1,
    teacher: 1,
    active: 1
});

module.exports =
    mongoose.models.TeacherMeetingIntegration ||
    mongoose.model(
        "TeacherMeetingIntegration",
        teacherMeetingIntegrationSchema
    );
