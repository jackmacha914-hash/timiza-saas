const providers = {
    google_meet: require("./googleMeetProvider"),
    zoom: require("./zoomProvider"),
    microsoft_teams: require("./microsoftTeamsProvider"),
    external: require("./externalProvider"),
    internal: require("./internalProvider")
};

// =====================================================
// GET MEETING PROVIDER
// =====================================================

function getMeetingProvider(provider) {
    const normalizedProvider = String(provider || "")
        .trim()
        .toLowerCase();

    const meetingProvider = providers[normalizedProvider];

    if (!meetingProvider) {
        throw new Error(
            `Unsupported meeting provider: ${normalizedProvider}`
        );
    }

    return meetingProvider;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getMeetingProvider,
    providers
};
