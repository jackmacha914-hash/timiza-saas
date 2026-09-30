module.exports = {
    name: "external",

    async createMeeting() {
        throw new Error(
            "External meeting provider requires a meeting URL."
        );
    },

    async updateMeeting() {
        throw new Error(
            "External meeting provider does not support automatic updates."
        );
    },

    async deleteMeeting() {
        return {
            success: true
        };
    }
};
