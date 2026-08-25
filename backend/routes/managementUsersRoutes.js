const express = require('express');
const router = express.Router();

const {
  getManagementUsers,
  createManagementUser,
  activateManagementUser,
  suspendManagementUser,
  deleteManagementUser
} = require('../controllers/schoolAccountController');


// Get students + teachers
router.get('/', getManagementUsers);


// Create student / teacher
router.post('/', createManagementUser);


// Activate
router.patch('/:id/activate', activateManagementUser);


// Suspend
router.patch('/:id/suspend', suspendManagementUser);


// Delete
router.delete('/:id', deleteManagementUser);


module.exports = router;
