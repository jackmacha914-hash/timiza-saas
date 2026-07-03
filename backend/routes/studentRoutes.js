const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateUser } = require('../middleware/authMiddleware');

const {
    getStudents,
    getStudentsByClass,
    getStudentProfile,
    updateStudentProfile,
    registerStudent,
    registerUser,
    uploadProfilePhoto,
    changePassword
} = require('../controllers/studentController');

const router = express.Router();

//
// ==============================
// Multer Configuration
// ==============================
//

const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-photos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const userEmail = req.user?.email || 'unknown';

        const sanitizedEmail = userEmail
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9).toString(36);

        const ext = path.extname(file.originalname).toLowerCase();

        cb(
            null,
            `profile-${sanitizedEmail}-${uniqueSuffix}${ext}`
        );
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;

        const extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }

        cb(new Error('Only image files are allowed.'));
    }
});

//
// ==============================
// PUBLIC ROUTES
// ==============================
//

// Register Student/Teacher
router.post('/register', registerUser);

// Register Student only
router.post('/register/student', registerStudent);

//
// ==============================
// PROTECTED ROUTES
// ==============================
//

// Get all students
router.get('/', authenticateUser, getStudents);

// Get all teachers
router.get('/teachers', authenticateUser, getStudents);

// Get students by class
router.get(
    '/class/:className',
    authenticateUser,
    getStudentsByClass
);

// Current user's profile
router.get(
    '/profile',
    authenticateUser,
    getStudentProfile
);

// Any user's profile
router.get(
    '/profile/:id',
    authenticateUser,
    getStudentProfile
);

// Update profile
router.put(
    '/profile',
    authenticateUser,
    updateStudentProfile
);

// Change password
router.put(
    '/change-password',
    authenticateUser,
    changePassword
);

// Upload profile photo
router.post(
    '/profile/photo',
    authenticateUser,
    upload.single('photo'),
    uploadProfilePhoto,
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: err.message,
                code: err.code
            });
        }

        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        next();
    }
);

module.exports = router;
