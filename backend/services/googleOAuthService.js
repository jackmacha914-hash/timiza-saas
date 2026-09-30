const { google } = require("googleapis");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    "https://timiza-saas.onrender.com/api/online-lessons/integrations/google_meet/callback";

function getGoogleOAuthClient() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error(
            "Google OAuth credentials are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        );
    }

    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

function getGoogleAuthorizationUrl(state) {
    const oauth2Client = getGoogleOAuthClient();

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events"
        ],
        state,
        prompt: "consent"
    });
}

module.exports = {
    getGoogleOAuthClient,
    getGoogleAuthorizationUrl
};
