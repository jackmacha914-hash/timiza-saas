const express = require('express');
const router = express.Router();

const {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} = require('../controllers/announcementController');

const {
    protect,
    authorize
} = require('../middleware/auth');


// =====================================================
// CREATE ANNOUNCEMENT
// Admin and Teacher
// =====================================================

router.post(
    '/',
    protect,
    authorize('admin', 'teacher'),
    createAnnouncement
);


// =====================================================
// GET ANNOUNCEMENTS
// Any authenticated user
// =====================================================

router.get(
    '/',
    protect,
    getAnnouncements
);


// =====================================================
// DELETE ANNOUNCEMENT
// Admin and Teacher
// =====================================================

router.delete(
    '/:id',
    protect,
    authorize('admin', 'teacher'),
    deleteAnnouncement
);


module.exports = router;
