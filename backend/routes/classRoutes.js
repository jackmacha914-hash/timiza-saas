const express = require('express');
const { 
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Create a new class (Teacher only)
router.post('/', authorizeRoles('teacher'), createClass);

// Get all classes for the logged-in teacher
router.get('/my-classes', authorizeRoles('teacher'), getTeacherClasses);

// Get class by ID (Teacher only)
router.get('/:id', authorize('teacher'), getClassById);

// Update class (Teacher only)
router.put('/:id', authorize('teacher'), updateClass);

// Delete class (Teacher only)
router.delete('/:id', authorize('teacher'), deleteClass);

// Add student to class (Teacher only)
router.post('/:id/students', authorize('teacher'), addStudentToClass);

// Remove student from class (Teacher only)
router.delete('/:id/students/:studentId', authorize('teacher'), removeStudentFromClass);

module.exports = router;
