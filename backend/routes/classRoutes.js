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
// TEACHER ROUTES
// =====================================================

// Create a class
router.post(
  "/",
  authorize("teacher"),
  createClass
);

// Get classes belonging to the logged-in teacher
router.get(
  "/my-classes",
  authorize("teacher"),
  getTeacherClasses
);

// Get a specific class
router.get(
  "/:id",
  authorize("teacher"),
  getClassById
);

// Update a class
router.put(
  "/:id",
  authorize("teacher"),
  updateClass
);

// Delete a class
router.delete(
  "/:id",
  authorize("teacher"),
  deleteClass
);

// Add a student to a class
router.post(
  "/:id/students",
  authorize("teacher"),
  addStudentToClass
);

// Remove a student from a class
router.delete(
  "/:id/students/:studentId",
  authorize("teacher"),
  removeStudentFromClass
);

module.exports = router;
