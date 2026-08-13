const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect } = require('../middleware/auth');

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
// =====================================================
// SCHOOL REQUIREMENT
// =====================================================
// Every protected student route must have a school.
// The school comes from the authenticated JWT:
// req.user.school
// =====================================================
//

const requireSchool = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (!req.user.school) {
        return res.status(400).json({
            success: false,
            message: 'School not found in authenticated user'
        });
    }

    next();
};

//
// =====================================================
// MULTER CONFIGURATION
// =====================================================
//

const uploadsDir = path.join(
    __dirname,
    '..',
    'uploads',
    'profile-photos'
);

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
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9).toString(36);

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

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

        const mimetype = filetypes.test(
            file.mimetype
        );

        if (extname && mimetype) {
            return cb(null, true);
        }

        cb(
            new Error(
                'Only image files are allowed.'
            )
        );
    }
});

//
// =====================================================
// PUBLIC ROUTES
// =====================================================
//

//
// Register Student/Teacher
//
// NOTE:
// These registration routes remain public because
// registration happens before authentication.
//
// The controller should assign the correct school
// during SaaS registration.
//
router.post(
    '/register',
    registerUser
);

//
// Register Student only
//
router.post(
    '/register/student',
    registerStudent
);

//
// =====================================================
// PROTECTED ROUTES
// =====================================================
//

// Get all students
router.get(
    '/',
    protect,
    requireSchool,
    getStudents
);

// Get all teachers
router.get(
    '/teachers',
    protect,
    requireSchool,
    getStudents
);

// Get students by class
router.get(
    '/class/:className',
    protect,
    requireSchool,
    getStudentsByClass
);

// Current user's profile
router.get(
    '/profile',
    protect,
    requireSchool,
    getStudentProfile
);

// Any user's profile
router.get(
    '/profile/:id',
    protect,
    requireSchool,
    getStudentProfile
);

// Update profile
router.put(
    '/profile',
    protect,
    requireSchool,
    updateStudentProfile
);

// Change password
router.put(
    '/change-password',
    protect,
    requireSchool,
    changePassword
);

// Upload profile photo
router.post(
    '/profile/photo',
    protect,
    requireSchool,
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
