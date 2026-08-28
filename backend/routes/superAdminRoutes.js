const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");


// =====================================================
// TEST ROUTE
// =====================================================

router.get(
    "/create-school",
    (req, res) => {

        res.send(
            "Super Admin route is working!"
        );

    }
);


// =====================================================
// CREATE SCHOOL
// =====================================================

router.post(
    "/create-school",
    superAdminController.createSchool
);


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// =====================================================

router.patch(
    "/schools/:id/status",
    superAdminController.toggleSchoolStatus
);


// =====================================================
// LOAD ALL SCHOOLS
// =====================================================

router.get(
    "/schools",
    superAdminController.getSchools
);


// =====================================================
// RESET SCHOOL ADMIN PASSWORD
// =====================================================
//
// Frontend calls:
//
// PATCH
// /api/superadmin/schools/:id/admin/:adminId/reset-password
//
// Example:
//
// /api/superadmin/schools/123/admin/456/reset-password
//
// =====================================================

router.patch(
    "/schools/:id/admin/:adminId/reset-password",
    superAdminController.resetSchoolAdminPassword
);


module.exports = router;

