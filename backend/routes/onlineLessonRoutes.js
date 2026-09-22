const express = require("express");

const {
    createOnlineLesson,
    getTeacherLessons,
    getOnlineLesson,
    updateOnlineLesson,
    cancelOnlineLesson,
    startOnlineLesson,
    endOnlineLesson,
    recordStudentJoin,
    recordStudentLeave,
    getLessonAttendance
} = require("../controllers/onlineLessonController");

const { authorize } = require("../middleware/auth");

const router = express.Router();

// =====================================================
// TEACHER LESSON MANAGEMENT
// =====================================================

// Create lesson
router.post(
    "/",
    authorize("teacher"),
    createOnlineLesson
);

// Get teacher's lessons
router.get(
    "/teacher",
    authorize("teacher"),
    getTeacherLessons
);

// Update lesson
router.put(
    "/:id",
    authorize("teacher"),
    updateOnlineLesson
);

// Cancel lesson
router.delete(
    "/:id",
    authorize("teacher"),
    cancelOnlineLesson
);

// Start lesson
router.post(
    "/:id/start",
    authorize("teacher"),
    startOnlineLesson
);

// End lesson
router.post(
    "/:id/end",
    authorize("teacher"),
    endOnlineLesson
);

// Teacher views lesson attendance
router.get(
    "/:id/attendance",
    authorize("teacher"),
    getLessonAttendance
);

// =====================================================
// SHARED LESSON ACCESS
// =====================================================

// Get individual lesson
// Teachers and students are authorized inside controller.
router.get(
    "/:id",
    authorize("teacher", "student"),
    getOnlineLesson
);

// =====================================================
// STUDENT ATTENDANCE
// =====================================================

// Student joins lesson
router.post(
    "/:id/join",
    authorize("student"),
    recordStudentJoin
);

// Student leaves lesson
router.post(
    "/:id/leave",
    authorize("student"),
    recordStudentLeave
);

module.exports = router;
