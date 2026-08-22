const express = require('express');

const router = express.Router();

const {
    createDisciplineCase,
    getDisciplineCases,
    getDisciplineCase,
    updateDisciplineCase,
    deleteDisciplineCase
} = require('../controllers/disciplineController');

const {
    protect,
    authorize
} = require('../middleware/auth');


// =====================================================
// ALL DISCIPLINE ROUTES
// User must be authenticated
// =====================================================

router.use(protect);


// =====================================================
// GET ALL DISCIPLINE CASES
// Authenticated school users
// =====================================================

router.get(
    '/',
    getDisciplineCases
);


// =====================================================
// GET ONE DISCIPLINE CASE
// Authenticated school users
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
