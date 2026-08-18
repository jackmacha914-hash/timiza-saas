const express = require("express");
const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

/*
|--------------------------------------------------------------------------
| SUBJECT ROUTES
|--------------------------------------------------------------------------
| All subject routes require authentication.
| Only school admins can manage subjects.
|--------------------------------------------------------------------------
*/

router.use(protect);

// GET /api/subjects
router.get(
    "/",
    authorize("admin"),
    getSubjects
);

// POST /api/subjects
router.post(
    "/",
    authorize("admin"),
    createSubject
);

// PUT /api/subjects/:id
router.put(
    "/:id",
    authorize("admin"),
    updateSubject
);

// DELETE /api/subjects/:id
router.delete(
    "/:id",
    authorize("admin"),
    deleteSubject
);

module.exports = router;
