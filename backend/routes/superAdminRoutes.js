const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


// =====================================================
// SUPER ADMIN ROUTES
// =====================================================
//
// All routes below require:
// 1. Valid JWT
// 2. superadmin role
//
// =====================================================


// =====================================================
// TEST ROUTE
// GET /api/superadmin/create-school
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
// POST /api/superadmin/create-school
// =====================================================

router.post(
    "/create-school",
    protect,
    authorize("superadmin"),
    superAdminController.createSchool
);


// =====================================================
// LIST ALL SCHOOLS
// GET /api/superadmin/schools
// =====================================================

router.get(
    "/schools",
    protect,
    authorize("superadmin"),
    superAdminController.getSchools
);


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// PATCH /api/superadmin/schools/:id/status
// =====================================================

router.patch(
    "/schools/:id/status",
    protect,
    authorize("superadmin"),
    superAdminController.toggleSchoolStatus
);


// =====================================================
// RESET SCHOOL ADMIN PASSWORD
// POST /api/superadmin/schools/:schoolId/reset-admin-password
// =====================================================

router.post(
    "/schools/:schoolId/reset-admin-password",
    protect,
    authorize("superadmin"),
    superAdminController.resetSchoolAdminPassword
);


module.exports = router;
