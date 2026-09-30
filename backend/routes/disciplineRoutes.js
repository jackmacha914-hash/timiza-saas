const express = require('express');

const router = express.Router();

const {
    createDisciplineCase,
    getDisciplineCases,
    getDisciplineCase,
    updateDisciplineCase,
    deleteDisciplineCase,
    getMyDisciplineCases
} = require('../controllers/disciplineController');

const {
    authorize
} = require('../middleware/auth');


// =====================================================
// STUDENT - GET MY DISCIPLINE CASES
// Student can only see their own discipline records
// =====================================================

router.get(
    '/student/my-cases',
    authorize('student'),
    getMyDisciplineCases
);


// =====================================================
// GET ALL DISCIPLINE CASES
// Authenticated users in the school
// =====================================================

router.get(
    '/',
    getDisciplineCases
);


// =====================================================
// GET ONE DISCIPLINE CASE
// =====================================================

router.get(
    '/:id',
    getDisciplineCase
);


// =====================================================
// CREATE
// Admin + Teacher
// =====================================================

router.post(
    '/',
    authorize('admin', 'teacher'),
    createDisciplineCase
);


// =====================================================
// UPDATE
// Admin + Teacher
// =====================================================

router.put(
    '/:id',
    authorize('admin', 'teacher'),
    updateDisciplineCase
);


// =====================================================
// DELETE
// Admin + Teacher
// =====================================================

router.delete(
    '/:id',
    authorize('admin', 'teacher'),
    deleteDisciplineCase
);


module.exports = router;
