// =====================================================
// INTERNAL MEETING PROVIDER
// =====================================================

module.exports = {
    name: "internal",

    async createMeeting() {
        throw new Error(
            "Internal meeting provider is not implemented yet."
        );
    },

    async updateMeeting() {
        throw new Error(
            "Internal meeting provider is not implemented yet."
        );
    },

    async deleteMeeting() {
        return {
            success: true
        };
    }
};
