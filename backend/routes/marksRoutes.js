const express = require('express');

const {
    saveMarks,
    saveStudentMarks,
    getStudentMarks,
    getClassMarks,
    getSubjectMarks,
    finalizeMarks,
    getStudentReportCard,
    deleteStudentMarks
} = require('../controllers/marksController');

const {
    protect,
    authorize
} = require('../middleware/auth');

const router = express.Router();

// ======================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ======================================
router.use(protect);

// ======================================
// TEACHER ROUTES
// ======================================

// Save marks
router.post(
    '/',
    authorize('teacher'),
    saveMarks
);

// Save marks for one student
router.post(
    '/students/:studentId/marks',
    authorize('teacher'),
    saveStudentMarks
);

// View class marks
router.get(
    '/class/:className',
    authorize('teacher'),
    getClassMarks
);

// View subject marks
router.get(
    '/subject/:subject',
    authorize('teacher'),
    getSubjectMarks
);

// Finalize marks
router.put(
    '/finalize/:id',
    authorize('teacher'),
    finalizeMarks
);

// Delete student marks
router.delete(
    '/:studentId/term/:term',
    authorize('teacher'),
    deleteStudentMarks
);

// ======================================
// STUDENT & TEACHER ROUTES
// ======================================

// Get student marks
router.get(
    '/student/:studentId',
    authorize('student', 'teacher'),
    getStudentMarks
);

// Get report card
router.get(
    '/report-card/:studentId',
    authorize('student', 'teacher'),
    getStudentReportCard
);

module.exports = router;
