module.exports = {
    name: "zoom",

    async createMeeting() {
        throw new Error(
            "Zoom integration is not configured yet."
        );
    },

    async updateMeeting() {
        throw new Error(
            "Zoom integration is not configured yet."
        );
    },

    async deleteMeeting() {
        return {
            success: true
        };
    }
};
