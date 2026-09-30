const express = require("express");

const {
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} = require("../controllers/classController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// =====================================================
// ALL CLASS ROUTES REQUIRE AUTHENTICATION
// =====================================================
router.use(protect);

// =====================================================
// ALL CLASS ROUTES REQUIRE A SCHOOL
// =====================================================
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.school) {
    console.error("[CLASS] No school found in authenticated user:", {
      userId: req.user.id,
      role: req.user.role,
    });

    return res.status(400).json({
      success: false,
      message: "School not found in authenticated user",
    });
  }

  next();
});

// =====================================================
// TEACHER ROUTES
// =====================================================

// Create a class
router.post(
  "/",
  authorize("teacher"),
  createClass
);

// =====================================================
// GET ALL CLASSES FOR CURRENT SCHOOL
// =====================================================
router.get(
  "/",
  authorize("teacher"),
  getTeacherClasses
);

// =====================================================
// GET CLASSES BELONGING TO CURRENT TEACHER
// Backwards-compatible endpoint
// GET /api/classes/my-classes
// =====================================================
router.get(
  "/my-classes",
  authorize("teacher"),
  getTeacherClasses
);

// =====================================================
// GET A SPECIFIC CLASS
// =====================================================
router.get(
  "/:id",
  authorize("teacher"),
  getClassById
);

// =====================================================
// UPDATE CLASS
// =====================================================
router.put(
  "/:id",
  authorize("teacher"),
  updateClass
);

// =====================================================
// DELETE CLASS
// =====================================================
router.delete(
  "/:id",
  authorize("teacher"),
  deleteClass
);

// =====================================================
// ADD STUDENT TO CLASS
// =====================================================
router.post(
  "/:id/students",
  authorize("teacher"),
  addStudentToClass
);

// =====================================================
// REMOVE STUDENT FROM CLASS
// =====================================================
router.delete(
  "/:id/students/:studentId",
  authorize("teacher"),
  removeStudentFromClass
);

module.exports = router;
