const mongoose = require("mongoose");

const OnlineLesson = require("../models/OnlineLesson");
const LessonAttendance = require("../models/LessonAttendance");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const User = require("../models/User");

const { createLessonMeeting, updateLessonMeeting, deleteLessonMeeting } = require("../services/meetingService");
const {
    validateLessonReferences
} = require("../services/onlineLessonValidation");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const getSchoolId = (req) => {
    return req.school || req.user?.school;
};

// =====================================================
// CREATE ONLINE LESSON
// =====================================================

exports.createOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;

        const {
            class: className,
            subject: subjectName,
            classId,
            subjectId,
            title,
            description,
            scheduledAt,
            duration,
            meeting,
            materials
        } = req.body;

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (
            (!className && !classId) ||
            (!subjectName && !subjectId) ||
            !title ||
            !scheduledAt ||
            duration === undefined ||
            duration === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Class, subject, title, scheduled time and duration are required."
            });
        }

        // -------------------------------------------------
        // RESOLVE CLASS
        // -------------------------------------------------

        let classRecord;

        if (classId) {
            if (!isValidObjectId(classId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid class ID."
                });
            }

            classRecord = await Class.findOne({
                _id: classId,
                school: schoolId
            });
        } else {
            classRecord = await Class.findOne({
                school: schoolId,
                name: String(className).trim()
            }).sort({ academicYear: -1 });
        }

        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: "Class not found in this school."
            });
        }

        // -------------------------------------------------
        // RESOLVE SUBJECT
        // -------------------------------------------------

        let subject;

        if (subjectId) {
            if (!isValidObjectId(subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid subject ID."
                });
            }

            subject = await Subject.findOne({
                _id: subjectId,
                school: schoolId,
                active: true
            });
        } else {
            subject = await Subject.findOne({
                school: schoolId,
                name: String(subjectName).trim(),
                active: true
            });
        }

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found or inactive."
            });
        }

        // -------------------------------------------------
        // VALIDATE TEACHER
        // -------------------------------------------------

        const teacher = await User.findOne({
            _id: teacherId,
            school: schoolId,
            role: "teacher"
        }).select("_id name email role");

        if (!teacher) {
            return res.status(403).json({
                success: false,
                message: "Teacher account is not valid for this school."
            });
        }

        // -------------------------------------------------
        // DATE VALIDATION
        // -------------------------------------------------

        const scheduledDate = new Date(scheduledAt);

        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid scheduled date and time."
            });
        }

        if (scheduledDate.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Lesson cannot be scheduled in the past."
            });
        }

        // -------------------------------------------------
        // DURATION VALIDATION
        // -------------------------------------------------

        const lessonDuration = Number(duration);

        if (
            !Number.isFinite(lessonDuration) ||
            lessonDuration < 1 ||
            lessonDuration > 1440
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Duration must be between 1 and 1440 minutes."
            });
        }

        // -------------------------------------------------
        // NORMALIZE MATERIALS
        // -------------------------------------------------

        const normalizedMaterials = Array.isArray(materials)
            ? materials
                  .filter(
                      (material) =>
                          material &&
                          material.title &&
                          material.url
                  )
                  .map((material) => ({
                      title: String(material.title)
                          .trim()
                          .slice(0, 200),

                      url: String(material.url).trim(),

                      type: material.type
                          ? String(material.type).trim()
                          : "resource"
                  }))
            : [];

        // -------------------------------------------------
        // NORMALIZE MEETING
        // -------------------------------------------------

        const normalizedMeeting = {
            provider:
                String(meeting?.provider || "external")
                    .trim()
                    .toLowerCase(),

            meetingId:
                meeting?.meetingId
                    ? String(meeting.meetingId).trim()
                    : null,

            meetingUrl:
                meeting?.meetingUrl
                    ? String(meeting.meetingUrl).trim()
                    : null,

            createdAt: null
        };

        const allowedProviders = [
            "google_meet",
            "zoom",
            "microsoft_teams",
            "external",
            "internal"
        ];

        if (!allowedProviders.includes(normalizedMeeting.provider)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported meeting provider."
            });
        }

        // -------------------------------------------------
        // EXTERNAL MEETING VALIDATION
        // -------------------------------------------------

        if (
            normalizedMeeting.provider === "external" &&
            !normalizedMeeting.meetingUrl
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Meeting URL is required for external meetings."
            });
        }

        // -------------------------------------------------
        // CREATE LESSON
        // -------------------------------------------------

        const lesson = await OnlineLesson.create({
            school: schoolId,

            class: classRecord._id,

            subject: subject._id,

            teacher: teacher._id,

            title: String(title).trim(),

            description: description
                ? String(description).trim()
                : "",

            scheduledAt: scheduledDate,

            duration: lessonDuration,

            meeting: normalizedMeeting,

            materials: normalizedMaterials,

            status: "scheduled"
        });

        // -------------------------------------------------
        // POPULATE RESPONSE
        // -------------------------------------------------

        const populatedLesson =
            await OnlineLesson.findOne({
                _id: lesson._id,
                school: schoolId
            })
                .populate(
                    "class",
                    "name level section academicYear"
                )
                .populate(
                    "subject",
                    "name code category"
                )
                .populate(
                    "teacher",
                    "name email"
                );

        return res.status(201).json({
            success: true,
            message:
                "Online lesson created successfully.",
            lesson: populatedLesson
        });

    } catch (error) {
        console.error(
            "Create online lesson error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create online lesson."
        });
    }
};

// =====================================================
// GET TEACHER LESSONS
// =====================================================

exports.getTeacherLessons = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        const lessons = await OnlineLesson.find({
            school: schoolId,
            teacher: teacherId
        })
            .populate("class", "name level section academicYear")
            .populate("subject", "name code category")
            .sort({ scheduledAt: 1 });

        return res.json({
            success: true,
            lessons
        });
    } catch (error) {
        console.error("Get teacher lessons error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load online lessons."
        });
    }
};

// =====================================================
// GET ONLINE LESSON FORM OPTIONS
// =====================================================

exports.getLessonOptions = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        const classes = await Class.find({
            school: schoolId
        })
            .select("_id name level section academicYear")
            .sort({ name: 1 });

        const subjects = await Subject.find({
            school: schoolId,
            active: true
        })
            .select("_id name code category")
            .sort({ name: 1 });

        return res.json({
            success: true,
            classes,
            subjects
        });

    } catch (error) {
        console.error(
            "Get online lesson options error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load lesson options."
        });
    }
};

// =====================================================
// GET SINGLE LESSON
// =====================================================

exports.getOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const userId = req.user.id;
        const role = String(req.user.role || "").toLowerCase();

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID."
            });
        }

        const lesson = await OnlineLesson.findOne({
            _id: req.params.id,
            school: schoolId
        })
            .populate("class", "name level section academicYear teacher students")
            .populate("subject", "name code category")
            .populate("teacher", "name email");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found."
            });
        }

        // -------------------------------------------------
        // TEACHER ACCESS
        // -------------------------------------------------

        if (role === "teacher") {
            if (String(lesson.teacher._id) !== String(userId)) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to access this lesson."
                });
            }

            return res.json({
                success: true,
                lesson
            });
        }

        // -------------------------------------------------
        // STUDENT ACCESS
        // -------------------------------------------------

        if (role === "student") {
            const enrolled = lesson.class.students.some(
                (studentId) => String(studentId) === String(userId)
            );

            if (!enrolled) {
                return res.status(403).json({
                    success: false,
                    message: "You are not enrolled in this class."
                });
            }

            return res.json({
                success: true,
                lesson
            });
        }

        return res.status(403).json({
            success: false,
            message: "You are not authorized to access online lessons."
        });
    } catch (error) {
        console.error("Get online lesson error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load online lesson."
        });
    }
};

// =====================================================
// UPDATE ONLINE LESSON
// =====================================================

exports.updateOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;
        const lessonId = req.params.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID."
            });
        }

        const lesson = await OnlineLesson.findOne({
            _id: lessonId,
            school: schoolId,
            teacher: teacherId
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found or access denied."
            });
        }

        // Cancelled lessons cannot be edited.
        if (lesson.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled lessons cannot be edited."
            });
        }

        const {
            title,
            description,
            scheduledAt,
            duration,
            subjectId,
            classId,
            materials
        } = req.body;

        // -------------------------------------------------
        // CLASS CHANGE
        // -------------------------------------------------

        if (classId !== undefined) {
            if (!isValidObjectId(classId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid class ID."
                });
            }

           const classDoc = await Class.findOne({
    _id: classId,
    school: schoolId
});

if (!classDoc) {
    return res.status(404).json({
        success: false,
        message: "Class not found in this school."
    });
}

            lesson.class = classDoc._id;
        }

        // -------------------------------------------------
        // SUBJECT CHANGE
        // -------------------------------------------------

        if (subjectId !== undefined) {
            if (!isValidObjectId(subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid subject ID."
                });
            }

            const subjectDoc = await Subject.findOne({
                _id: subjectId,
                school: schoolId,
                active: true
            });

            if (!subjectDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Subject not found or inactive."
                });
            }

            lesson.subject = subjectDoc._id;
        }

        // -------------------------------------------------
        // TITLE
        // -------------------------------------------------

        if (title !== undefined) {
            const normalizedTitle = String(title).trim();

            if (!normalizedTitle) {
                return res.status(400).json({
                    success: false,
                    message: "Lesson title cannot be empty."
                });
            }

            if (normalizedTitle.length > 200) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson title cannot exceed 200 characters."
                });
            }

            lesson.title = normalizedTitle;
        }

        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        if (description !== undefined) {
            const normalizedDescription =
                String(description).trim();

            if (normalizedDescription.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Description cannot exceed 5000 characters."
                });
            }

            lesson.description = normalizedDescription;
        }

        // -------------------------------------------------
        // SCHEDULED DATE
        // -------------------------------------------------

        if (scheduledAt !== undefined) {
            const scheduledDate = new Date(scheduledAt);

            if (Number.isNaN(scheduledDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid scheduled date and time."
                });
            }

            if (scheduledDate.getTime() < Date.now()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson cannot be scheduled in the past."
                });
            }

            lesson.scheduledAt = scheduledDate;
        }

        // -------------------------------------------------
        // DURATION
        // -------------------------------------------------

        if (duration !== undefined) {
            const lessonDuration = Number(duration);

            if (
                !Number.isFinite(lessonDuration) ||
                lessonDuration < 1 ||
                lessonDuration > 1440
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Duration must be between 1 and 1440 minutes."
                });
            }

            lesson.duration = lessonDuration;
        }

        // -------------------------------------------------
        // MATERIALS
        // -------------------------------------------------

        if (materials !== undefined) {
            if (!Array.isArray(materials)) {
                return res.status(400).json({
                    success: false,
                    message: "Materials must be an array."
                });
            }

            lesson.materials = materials
                .filter(
                    (material) =>
                        material &&
                        material.title &&
                        material.url
                )
                .map((material) => ({
                    title: String(material.title).trim(),
                    url: String(material.url).trim(),
                    type: material.type
                        ? String(material.type).trim()
                        : "resource"
                }));
        }

        // -------------------------------------------------
        // SAVE
        // -------------------------------------------------

        await lesson.save();

        // -------------------------------------------------
        // POPULATE RESPONSE
        // -------------------------------------------------

        const updatedLesson =
            await OnlineLesson.findOne({
                _id: lesson._id,
                school: schoolId,
                teacher: teacherId
            })
                .populate(
                    "class",
                    "name level section academicYear"
                )
                .populate(
                    "subject",
                    "name code category"
                )
                .populate(
                    "teacher",
                    "name email"
                );

        return res.json({
            success: true,
            message: "Online lesson updated successfully.",
            lesson: updatedLesson
        });

    } catch (error) {
        console.error(
            "Update online lesson error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update online lesson."
        });
    }
};

// =====================================================
// DELETE / CANCEL ONLINE LESSON
// =====================================================

exports.cancelOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;
        const lessonId = req.params.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID."
            });
        }

        const lesson = await OnlineLesson.findOne({
            _id: lessonId,
            school: schoolId,
            teacher: teacherId
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found or access denied."
            });
        }

        // A completed lesson cannot be cancelled.
        if (lesson.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed lessons cannot be cancelled."
            });
        }

        // A lesson that is already cancelled needs no further action.
        if (lesson.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Lesson is already cancelled."
            });
        }

        lesson.status = "cancelled";

        await lesson.save();

        return res.json({
            success: true,
            message: "Online lesson cancelled successfully.",
            lesson
        });

    } catch (error) {
        console.error(
            "Cancel online lesson error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to cancel online lesson."
        });
    }
};

// =====================================================
// START ONLINE LESSON
// =====================================================

exports.startOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;
        const lessonId = req.params.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID."
            });
        }

        const lesson = await OnlineLesson.findOne({
            _id: lessonId,
            school: schoolId,
            teacher: teacherId
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found or access denied."
            });
        }

        // Cancelled lessons cannot be started.
        if (lesson.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled lessons cannot be started."
            });
        }

        // Completed lessons cannot be started again.
        if (lesson.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed lessons cannot be started again."
            });
        }

        // Prevent starting an already-live lesson.
        if (lesson.status === "live") {
            return res.status(400).json({
                success: false,
                message: "Lesson is already live."
            });
        }

        lesson.status = "live";
        lesson.startedAt = new Date();
        lesson.endedAt = null;

        await lesson.save();

        return res.json({
            success: true,
            message: "Online lesson started successfully.",
            lesson
        });

    } catch (error) {
        console.error(
            "Start online lesson error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to start online lesson."
        });
    }
};

// =====================================================
// END ONLINE LESSON
// =====================================================

exports.endOnlineLesson = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;
        const lessonId = req.params.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID."
            });
        }

        const lesson = await OnlineLesson.findOne({
            _id: lessonId,
            school: schoolId,
            teacher: teacherId
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found or access denied."
            });
        }

        // Cancelled lessons cannot be ended.
        if (lesson.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled lessons cannot be ended."
            });
        }

        // A completed lesson cannot be ended again.
        if (lesson.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Lesson is already completed."
            });
        }

        // Only a live lesson can be ended.
        if (lesson.status !== "live") {
            return res.status(400).json({
                success: false,
                message: "Only a live lesson can be ended."
            });
        }

        lesson.status = "completed";
        lesson.endedAt = new Date();

        await lesson.save();

        return res.json({
            success: true,
            message: "Online lesson ended successfully.",
            lesson
        });

    } catch (error) {
        console.error(
            "End online lesson error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to end online lesson."
        });
    }
};
// =====================================================
// RECORD STUDENT JOIN
// =====================================================

exports.recordStudentJoin = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const studentId = req.user.id;

        const lesson = await OnlineLesson.findOne({
            _id: req.params.id,
            school: schoolId
        }).populate("class", "students teacher");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found."
            });
        }

        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can record lesson attendance."
            });
        }

        const enrolled = lesson.class.students.some(
            (id) => String(id) === String(studentId)
        );

        if (!enrolled) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this class."
            });
        }

        let attendance = await LessonAttendance.findOne({
            school: schoolId,
            lesson: lesson._id,
            student: studentId
        });

        if (!attendance) {
            attendance = await LessonAttendance.create({
                school: schoolId,
                lesson: lesson._id,
                student: studentId,
                joinedAt: new Date(),
                status: "present"
            });
        } else if (!attendance.joinedAt) {
            attendance.joinedAt = new Date();
            await attendance.save();
        }

        return res.json({
            success: true,
            message: "Lesson attendance recorded.",
            attendance
        });
    } catch (error) {
        console.error("Record student join error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record lesson attendance."
        });
    }
};

// =====================================================
// RECORD STUDENT LEAVE
// =====================================================

exports.recordStudentLeave = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const studentId = req.user.id;

        const lesson = await OnlineLesson.findOne({
            _id: req.params.id,
            school: schoolId
        }).populate("class", "students");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found."
            });
        }

        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can record lesson attendance."
            });
        }

        const enrolled = lesson.class.students.some(
            (id) => String(id) === String(studentId)
        );

        if (!enrolled) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this class."
            });
        }

        const attendance = await LessonAttendance.findOne({
            school: schoolId,
            lesson: lesson._id,
            student: studentId
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: "No lesson attendance record exists."
            });
        }

        attendance.leftAt = new Date();

        // Simple V1 rule.
        // More precise late / left-early rules can be added later.
        if (lesson.duration && attendance.joinedAt) {
            const expectedEnd =
                new Date(attendance.joinedAt).getTime() +
                lesson.duration * 60 * 1000;

            if (attendance.leftAt.getTime() < expectedEnd) {
                attendance.status = "left_early";
            }
        }

        await attendance.save();

        return res.json({
            success: true,
            message: "Lesson leave recorded.",
            attendance
        });
    } catch (error) {
        console.error("Record student leave error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to record lesson leave."
        });
    }
};

// =====================================================
// GET LESSON ATTENDANCE
// =====================================================

exports.getLessonAttendance = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacherId = req.user.id;

        const lesson = await OnlineLesson.findOne({
            _id: req.params.id,
            school: schoolId,
            teacher: teacherId
        }).populate("class", "students");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Online lesson not found or access denied."
            });
        }

        const attendance = await LessonAttendance.find({
            school: schoolId,
            lesson: lesson._id
        })
            .populate("student", "name email")
            .sort({ joinedAt: 1 });

        return res.json({
            success: true,
            attendance
        });
    } catch (error) {
        console.error("Get lesson attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load lesson attendance."
        });
    }
};

// =====================================================
// CREATE LESSON MEETING
// =====================================================

exports.createLessonMeeting = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        const {
            provider,
            meetingUrl,
            meetingId,
            options
        } = req.body;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!provider) {
            return res.status(400).json({
                success: false,
                message: "Meeting provider is required."
            });
        }

        const meeting = await createLessonMeeting({
            schoolId,
            teacherId,
            lessonId: req.params.id,
            provider,
            meetingOptions: {
                ...(options || {}),
                meetingUrl,
                meetingId
            }
        });

        return res.json({
            success: true,
            message: "Lesson meeting created successfully.",
            meeting
        });
    } catch (error) {
        console.error(
            "Create lesson meeting error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// UPDATE LESSON MEETING
// =====================================================

exports.updateLessonMeeting = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        const meeting = await updateLessonMeeting({
            schoolId,
            teacherId,
            lessonId: req.params.id,
            meetingOptions: req.body || {}
        });

        return res.json({
            success: true,
            message: "Lesson meeting updated successfully.",
            meeting
        });
    } catch (error) {
        console.error(
            "Update lesson meeting error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// DELETE LESSON MEETING
// =====================================================

exports.deleteLessonMeeting = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        const result = await deleteLessonMeeting({
            schoolId,
            teacherId,
            lessonId: req.params.id
        });

        return res.json({
            success: true,
            message: "Lesson meeting removed successfully.",
            ...result
        });
    } catch (error) {
        console.error(
            "Delete lesson meeting error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//student section//
exports.getStudentLessons = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const studentId = req.user.id;

        if (!schoolId) {
            return res.status(403).json({
                message: "No school context."
            });
        }

        // Find classes where this student is actually enrolled.
        const classes = await Class.find({
            school: schoolId,
            students: studentId
        }).select("_id");

        const classIds = classes.map((item) => item._id);

        if (classIds.length === 0) {
            return res.json({
                today: [],
                upcoming: [],
                completed: []
            });
        }

        const lessons = await OnlineLesson.find({
            school: schoolId,
            class: { $in: classIds }
        })
            .populate("class", "name level section academicYear")
            .populate("subject", "name code category")
            .populate("teacher", "name email")
            .sort({ scheduledAt: 1 });

        const now = new Date();

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const today = [];
        const upcoming = [];
        const completed = [];

        for (const lesson of lessons) {
            if (lesson.status === "cancelled") {
                continue;
            }

           if (
    lesson.status === "completed" ||
    lesson.endedAt
) {
    completed.push(lesson);
    continue;
}

if (
    lesson.scheduledAt >= startOfToday &&
    lesson.scheduledAt <= endOfToday
) {
    today.push(lesson);
    continue;
}
            if (lesson.scheduledAt > endOfToday) {
                upcoming.push(lesson);
            }
        }

        res.json({
            today,
            upcoming,
            completed
        });
    } catch (error) {
        console.error("Get student lessons error:", error);

        res.status(500).json({
            message: "Failed to fetch student lessons."
        });
    }
};
