const express = require("express");
const router = express.Router();

const {
    authenticateUser,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

// Protect all subject routes
router.use(authenticateUser);

// Subject Management (Admin only)
router.get("/", authorizeRoles("admin"), getSubjects);

router.post("/", authorizeRoles("admin"), createSubject);

router.put("/:id", authorizeRoles("admin"), updateSubject);

router.delete("/:id", authorizeRoles("admin"), deleteSubject);

module.exports = router;
