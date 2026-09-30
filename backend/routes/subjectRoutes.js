const express = require("express");
const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/auth");

const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

// Protect all subject routes
router.use(protect);

// Subject Management — Admin only
router.get(
    "/",
    authorize("admin"),
    getSubjects
);

router.post(
    "/",
    authorize("admin"),
    createSubject
);

router.put(
    "/:id",
    authorize("admin"),
    updateSubject
);

router.delete(
    "/:id",
    authorize("admin"),
    deleteSubject
);

module.exports = router;
