const express = require("express");
const router = express.Router();

const {
    authenticateUser,
    authorizeRoles
} = require("../middleware/authmiddleware");

const {
    getDashboard
} = require("../controllers/academicController");

router.use(authenticateUser);

router.get(
    "/dashboard",
    authorizeRoles("admin"),
    getDashboard
);

module.exports = router;
