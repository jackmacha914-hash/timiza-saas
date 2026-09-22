const TeacherMeetingIntegration = require("../models/TeacherMeetingIntegration");

// =====================================================
// SUPPORTED PROVIDERS
// =====================================================

const SUPPORTED_PROVIDERS = [
    "google_meet",
    "zoom",
    "microsoft_teams"
];

// =====================================================
// VALIDATE PROVIDER
// =====================================================

function isSupportedProvider(provider) {
    return SUPPORTED_PROVIDERS.includes(
        String(provider || "").trim().toLowerCase()
    );
}

// =====================================================
// GET TEACHER INTEGRATIONS
// =====================================================

exports.getTeacherIntegrations = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        const integrations = await TeacherMeetingIntegration.find({
            school: schoolId,
            teacher: teacherId
        })
            .select(
                "_id provider providerAccountId tokenExpiresAt active createdAt updatedAt"
            )
            .sort({ provider: 1 });

        // -------------------------------------------------
        // RETURN CONNECTION STATUS ONLY
        // NEVER RETURN TOKENS
        // -------------------------------------------------

        const connectionStatus = SUPPORTED_PROVIDERS.map(
            (provider) => {
                const integration = integrations.find(
                    (item) => item.provider === provider
                );

                return {
                    provider,
                    connected: Boolean(
                        integration && integration.active
                    ),
                    integrationId: integration?._id || null,
                    providerAccountId:
                        integration?.providerAccountId || null,
                    tokenExpiresAt:
                        integration?.tokenExpiresAt || null
                };
            }
        );

        return res.json({
            success: true,
            integrations: connectionStatus
        });
    } catch (error) {
        console.error(
            "Get teacher integrations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load meeting integrations."
        });
    }
};

// =====================================================
// CREATE / CONNECT INTEGRATION
// =====================================================
//
// This endpoint is intentionally prepared for OAuth.
// The real OAuth callback will be added when we configure
// Google / Zoom / Microsoft credentials.
//
// For now it creates a connection record only when the
// caller explicitly supplies provider account information.
// Tokens are NOT accepted from the frontend.
// =====================================================

exports.connectIntegration = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        const provider = String(
            req.params.provider || ""
        )
            .trim()
            .toLowerCase();

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isSupportedProvider(provider)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported meeting provider."
            });
        }

        // -------------------------------------------------
        // IMPORTANT
        // Do not accept OAuth access/refresh tokens from
        // the browser.
        // -------------------------------------------------

        const {
            providerAccountId
        } = req.body;

        if (!providerAccountId) {
            return res.status(400).json({
                success: false,
                message:
                    "Provider account ID is required. OAuth connection flow is not configured yet."
            });
        }

        let integration =
            await TeacherMeetingIntegration.findOne({
                school: schoolId,
                teacher: teacherId,
                provider
            });

        if (integration) {
            integration.providerAccountId =
                providerAccountId;

            integration.active = true;

            await integration.save();
        } else {
            integration =
                await TeacherMeetingIntegration.create({
                    school: schoolId,
                    teacher: teacherId,
                    provider,
                    providerAccountId,
                    active: true
                });
        }

        // -------------------------------------------------
        // NEVER RETURN TOKEN FIELDS
        // -------------------------------------------------

        return res.json({
            success: true,
            message: `${provider} integration connected.`,
            integration: {
                id: integration._id,
                provider: integration.provider,
                providerAccountId:
                    integration.providerAccountId,
                active: integration.active
            }
        });
    } catch (error) {
        console.error(
            "Connect teacher integration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to connect meeting provider."
        });
    }
};

// =====================================================
// DISCONNECT INTEGRATION
// =====================================================

exports.disconnectIntegration = async (req, res) => {
    try {
        const schoolId = req.school || req.user?.school;
        const teacherId = req.user.id;

        const provider = String(
            req.params.provider || ""
        )
            .trim()
            .toLowerCase();

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: "No school context."
            });
        }

        if (!isSupportedProvider(provider)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported meeting provider."
            });
        }

        const integration =
            await TeacherMeetingIntegration.findOne({
                school: schoolId,
                teacher: teacherId,
                provider
            });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: "Integration not found."
            });
        }

        integration.active = false;

        // Clear credentials when disconnected.
        integration.encryptedAccessToken = null;
        integration.encryptedRefreshToken = null;
        integration.tokenExpiresAt = null;

        await integration.save();

        return res.json({
            success: true,
            message: `${provider} integration disconnected.`
        });
    } catch (error) {
        console.error(
            "Disconnect teacher integration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to disconnect meeting provider."
        });
    }
};
