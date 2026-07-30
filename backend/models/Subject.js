const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
{
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },

    category: {
        type: String,
        enum: [
            "Core",
            "Science",
            "Humanities",
            "Technical",
            "Languages",
            "Optional"
        ],
        default: "Core"
    },

    active: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

},
{
    timestamps: true
});

subjectSchema.index(
{
    school: 1,
    code: 1
},
{
    unique: true
});

module.exports =
mongoose.models.Subject ||
mongoose.model("Subject", subjectSchema);
