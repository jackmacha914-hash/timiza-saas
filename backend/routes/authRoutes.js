const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const {
    authenticateUser,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only Admins and Superadmins can create users
router.post(
    "/register",
    authenticateUser,
    authorizeRoles("admin", "superadmin"),
    registerUser
);

// Optional: keep signup disabled
router.post(
    "/signup",
    authenticateUser,
    authorizeRoles("admin", "superadmin"),
    registerUser
);

// Login remains public
router.post("/login", loginUser);

module.exports = router;
