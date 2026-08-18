const express = require("express");

const router = express.Router();


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


// =====================================================
// MIDDLEWARE VALIDATION
// =====================================================

if (typeof protect !== "function") {

    throw new TypeError(
        "authMiddleware.protect must be a function. Check backend/middleware/authMiddleware.js exports."
    );

}

if (typeof authorize !== "function") {

    throw new TypeError(
        "authMiddleware.authorize must be a function. Check backend/middleware/authMiddleware.js exports."
    );

}


// =====================================================
// SUBJECT CONTROLLER
// =====================================================

const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");


// =====================================================
// CONTROLLER VALIDATION
// =====================================================

if (typeof getSubjects !== "function") {

    throw new TypeError(
        "subjectController.getSubjects must be a function."
    );

}

if (typeof createSubject !== "function") {

    throw new TypeError(
        "subjectController.createSubject must be a function."
    );

}

if (typeof updateSubject !== "function") {

    throw new TypeError(
        "subjectController.updateSubject must be a function."
    );

}

if (typeof deleteSubject !== "function") {

    throw new TypeError(
        "subjectController.deleteSubject must be a function."
    );

}


// =====================================================
// SUBJECT ROUTES
// =====================================================
//
// All routes require authentication.
//
// Only users with the "admin" role can:
// - View subjects
// - Create subjects
// - Update subjects
// - Delete subjects
//
// =====================================================

router.use(protect);


// =====================================================
// GET SUBJECTS
// =====================================================
//
// GET /api/subjects
//
// =====================================================

router.get(
    "/",
    authorize("admin"),
    getSubjects
);


// =====================================================
// CREATE SUBJECT
// =====================================================
//
// POST /api/subjects
//
// =====================================================

router.post(
    "/",
    authorize("admin"),
    createSubject
);


// =====================================================
// UPDATE SUBJECT
// =====================================================
//
// PUT /api/subjects/:id
//
// =====================================================

router.put(
    "/:id",
    authorize("admin"),
    updateSubject
);


// =====================================================
// DELETE SUBJECT
// =====================================================
//
// DELETE /api/subjects/:id
//
// =====================================================

router.delete(
    "/:id",
    authorize("admin"),
    deleteSubject
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
