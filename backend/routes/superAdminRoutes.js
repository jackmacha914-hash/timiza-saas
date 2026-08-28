const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


// =====================================================
// SUPER ADMIN ROUTE TEST
// =====================================================

router.get(
    "/create-school",
    protect,
    authorize("superadmin"),
    (req, res) => {

        res.json({
            success: true,
            message: "Super Admin route is working!"
        });

    }
);


// =====================================================
// CREATE SCHOOL
// =====================================================
// Only the Super Admin can create schools.
// This creates:
// 1. School
// 2. School Admin account
//
// The existing authentication/login system is unchanged.

router.post(
    "/create-school",
    protect,
    authorize("superadmin"),
    superAdminController.createSchool
);


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// =====================================================

router.patch(
    "/schools/:id/status",
    protect,
    authorize("superadmin"),
    superAdminController.toggleSchoolStatus
);


// =====================================================
// LIST ALL SCHOOLS
// =====================================================

router.get(
    "/schools",
    protect,
    authorize("superadmin"),
    superAdminController.getSchools
);


module.exports = router;
