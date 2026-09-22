const mongoose = require("mongoose");


// =====================================================
// ONLINE LESSON SCHEMA
// =====================================================

const onlineLessonSchema = new mongoose.Schema(

    {
        // =================================================
        // TENANT / SCHOOL
        // =================================================

        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true
        },


        // =================================================
        // CLASS
        // =================================================

        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true
        },


        // =================================================
        // SUBJECT
        // =================================================

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
            index: true
        },


        // =================================================
        // TEACHER
        // =================================================

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // =================================================
        // LESSON INFORMATION
        // =================================================

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000
        },


        // =================================================
        // SCHEDULE
        // =================================================

        scheduledAt: {
            type: Date,
            required: true,
            index: true
        },

        duration: {
            type: Number,
            required: true,
            min: 1,
            max: 1440
        },


        // =================================================
        // MEETING
        //
        // The lesson does not care how the meeting was
        // created. Provider-specific logic lives elsewhere.
        // =================================================

        meeting: {

            provider: {
                type: String,
                enum: [
                    "google_meet",
                    "zoom",
                    "microsoft_teams",
                    "external",
                    "internal"
                ],
                default: "external"
            },

            meetingId: {
                type: String,
                default: null,
                trim: true
            },

            meetingUrl: {
                type: String,
                default: null,
                trim: true
            },

            createdAt: {
                type: Date,
                default: null
            }
        },


        // =================================================
        // LEARNING MATERIALS
        // =================================================

        materials: [
            {
                title: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 200
                },

                url: {
                    type: String,
                    required: true,
                    trim: true
                },

                type: {
                    type: String,
                    default: "resource",
                    trim: true
                }
            }
        ],


        // =================================================
        // LESSON STATUS
        // =================================================

        status: {
            type: String,
            enum: [
                "scheduled",
                "live",
                "completed",
                "cancelled"
            ],
            default: "scheduled",
            index: true
        },


        // =================================================
        // LESSON LIFECYCLE
        // =================================================

        startedAt: {
            type: Date,
            default: null
        },

        endedAt: {
            type: Date,
            default: null
        },


        // =================================================
        // RECORDING
        //
        // Recording will normally come from the meeting
        // provider rather than our Express server.
        // =================================================

        recordingUrl: {
            type: String,
            default: null,
            trim: true
        }
    },

    {
        timestamps: true
    }
);


// =====================================================
// INDEXES
// =====================================================

// Efficient teacher lesson queries
onlineLessonSchema.index({
    school: 1,
    teacher: 1,
    scheduledAt: -1
});


// Efficient class lesson queries
onlineLessonSchema.index({
    school: 1,
    class: 1,
    scheduledAt: -1
});


// Efficient subject lesson queries
onlineLessonSchema.index({
    school: 1,
    subject: 1,
    scheduledAt: -1
});


// Efficient status queries
onlineLessonSchema.index({
    school: 1,
    status: 1,
    scheduledAt: -1
});


// =====================================================
// EXPORT
// =====================================================

module.exports =
    mongoose.models.OnlineLesson ||
    mongoose.model("OnlineLesson", onlineLessonSchema);
