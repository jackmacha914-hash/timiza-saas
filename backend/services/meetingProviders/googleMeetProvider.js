module.exports = {
    name: "google_meet",

    async createMeeting() {
        throw new Error(
            "Google Meet integration is not configured yet."
        );
    },

    async updateMeeting() {
        throw new Error(
            "Google Meet integration is not configured yet."
        );
    },

    async deleteMeeting() {
        return {
            success: true
        };
    }
};
