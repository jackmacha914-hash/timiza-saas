const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");

const {
    protect
} = require("../middleware/authMiddleware");


// =====================================================
// SUPER ADMIN ROLE CHECK
// =====================================================

function requireSuperAdmin(req, res, next) {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });

    }

    const role =
        String(req.user.role || "")
            .toLowerCase()
            .trim();

    if (role !== "superadmin") {

        return res.status(403).json({
            success: false,
            message: "Super Admin access required"
        });

    }

    next();
}


// =====================================================
// TEST ROUTE
// =====================================================

router.get(
    "/create-school",

    protect,

    requireSuperAdmin,

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

    requireSuperAdmin,

    superAdminController.createSchool
);


// =====================================================
// LIST ALL SCHOOLS
// =====================================================

router.get(
    "/schools",

    protect,

    requireSuperAdmin,

    superAdminController.getSchools
);


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// =====================================================

router.patch(
    "/schools/:id/status",

    protect,

    requireSuperAdmin,

    superAdminController.toggleSchoolStatus
);


// =====================================================
// RESET SCHOOL ADMIN PASSWORD
// =====================================================

router.post(
    "/schools/:schoolId/reset-admin-password",

    protect,

    requireSuperAdmin,

    superAdminController.resetSchoolAdminPassword
);


module.exports = router;
