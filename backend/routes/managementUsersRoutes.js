const express = require('express');

const router = express.Router();

const {
    getSchoolAccounts,
    createSchoolAccount,
    activateSchoolAccount,
    suspendSchoolAccount,
    deleteSchoolAccount
} = require('../controllers/schoolAccountController');


// =====================================================
// GET SCHOOL ACCOUNTS
// GET /api/management-users
// =====================================================

router.get(
    '/',
    getSchoolAccounts
);


// =====================================================
// CREATE SCHOOL ACCOUNT
// POST /api/management-users
// =====================================================

router.post(
    '/',
    createSchoolAccount
);


// =====================================================
// ACTIVATE ACCOUNT
// PATCH /api/management-users/:id/activate
// =====================================================

router.patch(
    '/:id/activate',
    activateSchoolAccount
);


// =====================================================
// SUSPEND ACCOUNT
// PATCH /api/management-users/:id/suspend
// =====================================================

router.patch(
    '/:id/suspend',
    suspendSchoolAccount
);


// =====================================================
// DELETE ACCOUNT
// DELETE /api/management-users/:id
// =====================================================

router.delete(
    '/:id',
    deleteSchoolAccount
);


module.exports = router;
