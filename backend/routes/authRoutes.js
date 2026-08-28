const express = require("express");

const {
    registerUser,
    loginUser,
    changePassword
} = require("../controllers/authController");

const {
    authenticateUser,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// REGISTER USER
// POST /api/auth/register
//
// Only Admins and Superadmins can create users.
// =====================================================

router.post(
    "/register",
    authenticateUser,
    authorizeRoles("admin", "superadmin"),
    registerUser
);


// =====================================================
// SIGNUP
// POST /api/auth/signup
//
// Kept for compatibility.
// Signup is also restricted to Admin/Superadmin.
// =====================================================

router.post(
    "/signup",
    authenticateUser,
    authorizeRoles("admin", "superadmin"),
    registerUser
);


// =====================================================
// LOGIN
// POST /api/auth/login
//
// Public route.
// =====================================================

router.post(
    "/login",
    loginUser
);


// =====================================================
// CHANGE PASSWORD
// POST /api/auth/change-password
//
// IMPORTANT:
// This route MUST be authenticated because the
// controller uses:
//
//     req.user.id
//
// The temporary-password login already gives the user
// a JWT token, so that token is used here.
//
// =====================================================

router.post(
    "/change-password",
    authenticateUser,
    changePassword
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
