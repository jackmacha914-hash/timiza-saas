const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

// =====================================================
// ATTENDANCE ROUTES
// =====================================================

// All attendance routes require authentication
router.use(protect);

// =====================================================
// GET ATTENDANCE
// GET /api/attendance?class=Grade%201&date=2026-08-13
// =====================================================
router.get('/', async (req, res) => {
  try {
    console.log('[ATTENDANCE] GET /api/attendance');
    console.log('[ATTENDANCE] User:', req.user);
    console.log('[ATTENDANCE] Query:', req.query);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    return attendanceController.getAttendance(req, res);
  } catch (error) {
    console.error('[ATTENDANCE] GET error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
});

// =====================================================
// GET ATTENDANCE HISTORY
// GET /api/attendance/history
// ?class=Grade%201&start=2026-08-01&end=2026-08-31
// =====================================================
router.get('/history', async (req, res) => {
  try {
    console.log('[ATTENDANCE] GET /api/attendance/history');
    console.log('[ATTENDANCE] User:', req.user);
    console.log('[ATTENDANCE] Query:', req.query);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    return attendanceController.getAttendanceHistory(req, res);
  } catch (error) {
    console.error('[ATTENDANCE] History error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history',
      error: error.message
    });
  }
});

// =====================================================
// GET SINGLE ATTENDANCE RECORD
// GET /api/attendance/:id
// =====================================================
router.get('/:id', async (req, res) => {
  try {
    console.log('[ATTENDANCE] GET /api/attendance/:id');
    console.log('[ATTENDANCE] ID:', req.params.id);
    console.log('[ATTENDANCE] User:', req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    return attendanceController.getAttendanceById(req, res);
  } catch (error) {
    console.error('[ATTENDANCE] Get by ID error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record',
      error: error.message
    });
  }
});

// =====================================================
// SAVE ATTENDANCE
// POST /api/attendance
//
// Body:
// {
//   "class": "Grade 1",
//   "date": "2026-08-13",
//   "records": [
//     {
//       "studentId": "STUDENT_ID",
//       "status": "present",
//       "remarks": ""
//     }
//   ]
// }
// =====================================================
router.post('/', async (req, res) => {
  try {
    console.log('[ATTENDANCE] POST /api/attendance');
    console.log('[ATTENDANCE] User:', req.user);
    console.log('[ATTENDANCE] Body:', req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    return attendanceController.saveAttendance(req, res);
  } catch (error) {
    console.error('[ATTENDANCE] Save error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to save attendance',
      error: error.message
    });
  }
});

// =====================================================
// ERROR HANDLER
// =====================================================
router.use((err, req, res, next) => {
  console.error('[ATTENDANCE ROUTES ERROR]', err);

  return res.status(500).json({
    success: false,
    message: 'Attendance route error',
    error: err.message
  });
});

module.exports = router;
