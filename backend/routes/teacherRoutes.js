const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getTeacherProfile,
    updateTeacherProfile
} = require('../controllers/teacherController');

const router = express.Router();

// ==============================
// TEACHER PROFILE
// ==============================

// Get Teacher Profile
router.get(
    '/profile',
    protect,
    authorize('Teacher'),
    getTeacherProfile
);

// Update Teacher Profile
router.put(
    '/profile',
    protect,
    authorize('Teacher'),
    updateTeacherProfile
);

module.exports = router;
