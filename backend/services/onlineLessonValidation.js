const Class = require("../models/Class");
const Subject = require("../models/Subject");
const User = require("../models/User");

async function validateLessonReferences({
    schoolId,
    teacherId,
    classId,
    subjectId
}) {
    // Any teacher in the school can create a lesson for any school class.
    const classRecord = await Class.findOne({
        _id: classId,
        school: schoolId
    });

    if (!classRecord) {
        return {
            valid: false,
            status: 404,
            message: "Class not found in this school."
        };
    }

    const subject = await Subject.findOne({
        _id: subjectId,
        school: schoolId,
        active: true
    });

    if (!subject) {
        return {
            valid: false,
            status: 404,
            message: "Subject not found or inactive."
        };
    }

    // The teacher must still belong to the same school.
    const teacher = await User.findOne({
        _id: teacherId,
        school: schoolId,
        role: "teacher"
    }).select("_id name email role");

    if (!teacher) {
        return {
            valid: false,
            status: 403,
            message: "Teacher account is not valid for this school."
        };
    }

    return {
        valid: true,
        classRecord,
        subject,
        teacher
    };
}

module.exports = {
    validateLessonReferences
};
