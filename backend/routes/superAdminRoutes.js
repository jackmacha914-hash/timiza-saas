const express = require("express");

const router = express.Router();

const superAdminController =
    require("../controllers/superAdminController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


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
// LOAD ALL SCHOOLS
// =====================================================

router.get(
    "/schools",

    protect,

    authorize("superadmin"),

    superAdminController.getSchools
);


// =====================================================
// RESET SCHOOL ADMIN PASSWORD
// ONLY SUPER ADMIN CAN DO THIS
// =====================================================

router.post(
    "/schools/:id/reset-password",

    protect,

    authorize("superadmin"),

    superAdminController.resetSchoolAdminPassword
);


module.exports = router;
