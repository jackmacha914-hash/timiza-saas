const express = require("express");

const {
    getTeacherIntegrations,
    connectIntegration,
    disconnectIntegration
} = require("../controllers/teacherMeetingIntegrationController");

const { authorize } = require("../middleware/auth");

const router = express.Router();

// =====================================================
// TEACHER MEETING INTEGRATIONS
// =====================================================

// Get current teacher's provider connections
router.get(
    "/",
    authorize("teacher"),
    getTeacherIntegrations
);

// Connect provider
router.post(
    "/:provider/connect",
    authorize("teacher"),
    connectIntegration
);

// Disconnect provider
router.post(
    "/:provider/disconnect",
    authorize("teacher"),
    disconnectIntegration
);

module.exports = router;
