const express = require("express");

const {
    createOnlineLesson,
    getTeacherLessons,
    getLessonOptions,
    getStudentLessons,
    getOnlineLesson,
    updateOnlineLesson,
    cancelOnlineLesson,
    startOnlineLesson,
    endOnlineLesson,
    recordStudentJoin,
    recordStudentLeave,
    getLessonAttendance,
    createLessonMeeting,
    updateLessonMeeting,
    deleteLessonMeeting
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

// Get options for creating an online lesson
router.get(
    "/options",
    authorize("teacher"),
    getLessonOptions
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

// =====================================================
// LESSON MEETING
// =====================================================

// Create lesson meeting
router.post(
    "/:id/meeting",
    authorize("teacher"),
    createLessonMeeting
);

// Update lesson meeting
router.put(
    "/:id/meeting",
    authorize("teacher"),
    updateLessonMeeting
);

// Delete lesson meeting
router.delete(
    "/:id/meeting",
    authorize("teacher"),
    deleteLessonMeeting
);

// =====================================================
// TEACHER ATTENDANCE
// =====================================================

// Teacher views lesson attendance
router.get(
    "/:id/attendance",
    authorize("teacher"),
    getLessonAttendance
);

// STUDENT LESSONS
router.get(
    "/student",
    authorize("student"),
    getStudentLessons
);

// =====================================================
// SHARED LESSON ACCESS
// =====================================================

// Get individual lesson
// Teacher/student authorization is handled inside controller.
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
