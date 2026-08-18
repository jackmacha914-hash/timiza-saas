const express = require('express');

const router =
    express.Router();


const {
    createDisciplineCase,
    getDisciplineCases,
    getDisciplineCase,
    updateDisciplineCase,
    deleteDisciplineCase
} =
    require('../controllers/disciplineController');


const {
    protect,
    authorize
} =
    require('../middleware/auth');


// =====================================================
// GET ALL
// =====================================================

router.get(
    '/',
    protect,
    getDisciplineCases
);


// =====================================================
// GET ONE
// =====================================================

router.get(
    '/:id',
    protect,
    getDisciplineCase
);


// =====================================================
// CREATE
// =====================================================

router.post(
    '/',
    protect,
    authorize('admin', 'teacher'),
    createDisciplineCase
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    '/:id',
    protect,
    authorize('admin', 'teacher'),
    updateDisciplineCase
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    '/:id',
    protect,
    authorize('admin', 'teacher'),
    deleteDisciplineCase
);


module.exports = router;
