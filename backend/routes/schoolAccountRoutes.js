const express = require('express');

const router = express.Router();

const { protect } =
    require('../middleware/auth');

const {
    getSchoolAccounts,
    createSchoolAccount,
    activateSchoolAccount,
    suspendSchoolAccount,
    deleteSchoolAccount
} = require('../controllers/schoolAccountController');


// GET students + teachers
router.get(
    '/',
    protect,
    getSchoolAccounts
);


// CREATE
router.post(
    '/',
    protect,
    createSchoolAccount
);


// ACTIVATE
router.patch(
    '/:id/activate',
    protect,
    activateSchoolAccount
);


// SUSPEND
router.patch(
    '/:id/suspend',
    protect,
    suspendSchoolAccount
);


// DELETE
router.delete(
    '/:id',
    protect,
    deleteSchoolAccount
);


module.exports = router;
