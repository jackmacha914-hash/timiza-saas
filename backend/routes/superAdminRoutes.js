const express = require("express");
const router = express.Router();

const superAdminController = require("../controllers/superAdminController");

router.get("/create-school", (req, res) => {
    res.send("Super Admin route is working!");
});

// Later we'll protect this with superAdmin middleware
router.post(
    "/create-school",
    superAdminController.createSchool
);

router.patch(
    "/schools/:id/status",
    superAdminController.toggleSchoolStatus
);

// load all schools
router.get(
    "/schools",
    superAdminController.getSchools
);

module.exports = router;
