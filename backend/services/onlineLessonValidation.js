const Class = require("../models/Class");
const Subject = require("../models/Subject");
const User = require("../models/User");

async function validateLessonReferences({
    schoolId,
    teacherId,
    classId,
    subjectId
}) {
    const classRecord = await Class.findOne({
        _id: classId,
        school: schoolId,
        teacher: teacherId
    });

    if (!classRecord) {
        return {
            valid: false,
            status: 403,
            message: "Class not found or you are not the assigned teacher."
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
