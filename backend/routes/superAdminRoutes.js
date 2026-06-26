const express = require("express");
const router = express.Router();

const superAdminController = require("../controllers/superAdminController");

// Later we'll protect this with superAdmin middleware
router.post(
    "/create-school",
    superAdminController.createSchool
);

module.exports = router;
