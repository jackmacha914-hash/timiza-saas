const mongoose = require('mongoose');

// Dynamic model name based on class name
const getClassStudentModel = (className) => {
    const modelName = `Student_${className
        .replace(/[^a-zA-Z0-9]/g, '_')}`;

    const schema = new mongoose.Schema(
        {
            // IMPORTANT:
            // Every class-student record belongs to a school
            school: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'School',
                required: true,
                index: true
            },

            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
                index: true
            },

            name: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            class: {
                type: String,
                required: true,
                index: true
            },

            createdAt: {
                type: Date,
                default: Date.now
            },

            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    );

    // Prevent duplicate student records
    // for the same school/class.
    schema.index(
        {
            school: 1,
            studentId: 1,
            class: 1
        },
        {
            unique: true
        }
    );

    return (
        mongoose.models[modelName] ||
        mongoose.model(modelName, schema)
    );
};

module.exports = getClassStudentModel;
