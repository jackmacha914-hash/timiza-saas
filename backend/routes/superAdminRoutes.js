const express = require("express");
const router = express.Router();

const superAdminController = require("../controllers/superAdminController");

router.get("/create-school", (req, res) => {
    res.send("Super Admin route is working!");
});

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
// /api/superadmin/schools/:schoolId/reset-admin-password
//
// The Super Admin will use this to reset
// the school's admin password.
//

router.post(
    "/schools/:schoolId/reset-admin-password",
    superAdminController.resetSchoolAdminPassword
);


module.exports = router;
