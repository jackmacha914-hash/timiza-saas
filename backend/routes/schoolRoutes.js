const express = require('express');
const router = express.Router();

const {
  createSchool,
  getSchools
} = require('../controllers/schoolController');

// Super admin routes
router.post('/', createSchool);
router.get('/', getSchools);

module.exports = router;
