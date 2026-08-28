const express = require("express");
const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");


// ========================================
// TEST SUPER ADMIN ROUTE
// ========================================

router.get(
    "/create-school",
    (req, res) => {
        res.send("Super Admin route is working!");
    }
);


// ========================================
// CREATE SCHOOL
// ========================================

router.post(
    "/create-school",
    superAdminController.createSchool
);


// ========================================
// SUSPEND / ACTIVATE SCHOOL
// ========================================

router.patch(
    "/schools/:id/status",
    superAdminController.toggleSchoolStatus
);


// ========================================
// LOAD ALL SCHOOLS
// ========================================

router.get(
    "/schools",
    superAdminController.getSchools
);


// ========================================
// RESET SCHOOL ADMIN PASSWORD
// ========================================
//
// POST
// /api/superadmin/schools/:id/reset-admin-password
//
// :id = School ID
//
// The controller generates/sets the temporary
// password and forces the school admin to
// change it on their next login.
//

router.post(
    "/schools/:id/reset-admin-password",
    superAdminController.resetSchoolAdminPassword
);


module.exports = router;
