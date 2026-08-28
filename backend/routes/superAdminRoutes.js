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
    (req, res) => {

        res.json({
            success: true,
            message: "Super Admin route is working!"
        });

    }
);


// =====================================================
// CREATE SCHOOL
// ONLY SUPERADMIN
// =====================================================

router.post(
    "/create-school",
    protect,
    authorize("superadmin"),
    superAdminController.createSchool
);


// =====================================================
// LIST ALL SCHOOLS
// ONLY SUPERADMIN
// =====================================================

router.get(
    "/schools",
    protect,
    authorize("superadmin"),
    superAdminController.getSchools
);


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// ONLY SUPERADMIN
// =====================================================

router.patch(
    "/schools/:id/status",
    protect,
    authorize("superadmin"),
    superAdminController.toggleSchoolStatus
);


// =====================================================
// RESET SCHOOL ADMIN PASSWORD
// ONLY SUPERADMIN
// =====================================================

router.post(
    "/schools/:id/reset-admin-password",
    protect,
    authorize("superadmin"),
    superAdminController.resetSchoolAdminPassword
);


module.exports = router;

