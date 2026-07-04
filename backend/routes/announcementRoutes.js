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

// ===============================
// CREATE ANNOUNCEMENT
// Teacher only
// ===============================
router.post(
    '/',
    protect,
    authorize('teacher'),
    createAnnouncement
);

// ===============================
// GET ANNOUNCEMENTS
// Any authenticated user
// ===============================
router.get(
    '/',
    protect,
    getAnnouncements
);

// ===============================
// DELETE ANNOUNCEMENT
// Teacher only
// ===============================
router.delete(
    '/:id',
    protect,
    authorize('teacher'),
    deleteAnnouncement
);

module.exports = router;
