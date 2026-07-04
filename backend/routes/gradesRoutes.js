const express = require('express');
const router = express.Router();

const {
    addGrade,
    getStudentGrades,
    updateGrade,
    deleteGrade
} = require('../controllers/gradesController');

const {
    protect,
    authorize
} = require('../middleware/auth');

// ======================================
// ADD GRADE
// Teacher Only
// ======================================
router.post(
    '/',
    protect,
    authorize('teacher'),
    addGrade
);

// ======================================
// GET STUDENT GRADES
// Student & Teacher
// ======================================
router.get(
    '/',
    protect,
    authorize('student', 'teacher'),
    getStudentGrades
);

// ======================================
// UPDATE GRADE
// Teacher Only
// ======================================
router.put(
    '/:id',
    protect,
    authorize('teacher'),
    updateGrade
);

// ======================================
// DELETE GRADE
// Teacher Only
// ======================================
router.delete(
    '/:id',
    protect,
    authorize('teacher'),
    deleteGrade
);

module.exports = router;
