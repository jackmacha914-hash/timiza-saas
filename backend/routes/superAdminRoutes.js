const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


// =====================================================
// SUPER ADMIN AUTHENTICATION
// =====================================================
//
// Every protected route below requires:
// 1. Valid JWT token
// 2. User role = superadmin
//
// =====================================================


// =====================================================
// TEST ROUTE
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

router.post(
    "/create-school",
    protect,
    authorize("superadmin"),
    superAdminController.createSchool
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


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// =====================================================

router.patch(
    "/schools/:id/status",
    protect,
    authorize("superadmin"),
    superAdminController.toggleSchoolStatus
);


module.exports = router;

