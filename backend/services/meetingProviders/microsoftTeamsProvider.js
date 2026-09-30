module.exports = {
    name: "microsoft_teams",

    async createMeeting() {
        throw new Error(
            "Microsoft Teams integration is not configured yet."
        );
    },

    async updateMeeting() {
        throw new Error(
            "Microsoft Teams integration is not configured yet."
        );
    },

    async deleteMeeting() {
        return {
            success: true
        };
    }
};
