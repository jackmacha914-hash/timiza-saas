const TeacherMeetingIntegration = require("../models/TeacherMeetingIntegration");
const OnlineLesson = require("../models/OnlineLesson");
const { getMeetingProvider } = require("./meetingProviders");

// =====================================================
// CREATE MEETING FOR LESSON
// =====================================================

async function createLessonMeeting({
    schoolId,
    teacherId,
    lessonId,
    provider,
    meetingOptions = {}
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!teacherId) {
        throw new Error("Teacher ID is required.");
    }

    if (!lessonId) {
        throw new Error("Lesson ID is required.");
    }

    const lesson = await OnlineLesson.findOne({
        _id: lessonId,
        school: schoolId,
        teacher: teacherId
    });

    if (!lesson) {
        throw new Error("Lesson not found or access denied.");
    }

    const normalizedProvider = String(provider || "")
        .trim()
        .toLowerCase();

    if (!normalizedProvider) {
        throw new Error("Meeting provider is required.");
    }

    // -------------------------------------------------
    // EXTERNAL MEETING
    // -------------------------------------------------

    if (normalizedProvider === "external") {
        if (!meetingOptions.meetingUrl) {
            throw new Error(
                "Meeting URL is required for an external meeting."
            );
        }

        lesson.meeting = {
            provider: "external",
            meetingId: meetingOptions.meetingId || null,
            meetingUrl: meetingOptions.meetingUrl,
            createdAt: new Date()
        };

        await lesson.save();

        return lesson.meeting;
    }

    // -------------------------------------------------
    // INTERNAL MEETING
    // -------------------------------------------------

    if (normalizedProvider === "internal") {
        const providerService = getMeetingProvider("internal");

        const meeting = await providerService.createMeeting({
            lesson,
            schoolId,
            teacherId,
            options: meetingOptions
        });

        lesson.meeting = {
            provider: "internal",
            meetingId: meeting.meetingId || null,
            meetingUrl: meeting.meetingUrl || null,
            createdAt: new Date()
        };

        await lesson.save();

        return lesson.meeting;
    }

    // -------------------------------------------------
    // EXTERNAL PROVIDER INTEGRATION
    // GOOGLE / ZOOM / TEAMS
    // -------------------------------------------------

    const integration = await TeacherMeetingIntegration.findOne({
        school: schoolId,
        teacher: teacherId,
        provider: normalizedProvider,
        active: true
    });

    if (!integration) {
        throw new Error(
            `Teacher has not connected ${normalizedProvider}.`
        );
    }

    const providerService = getMeetingProvider(
        normalizedProvider
    );

    const meeting = await providerService.createMeeting({
        lesson,
        schoolId,
        teacherId,
        integration,
        options: meetingOptions
    });

    if (!meeting || !meeting.meetingUrl) {
        throw new Error(
            "Meeting provider did not return a valid meeting URL."
        );
    }

    lesson.meeting = {
        provider: normalizedProvider,
        meetingId: meeting.meetingId || null,
        meetingUrl: meeting.meetingUrl,
        createdAt: new Date()
    };

    await lesson.save();

    return lesson.meeting;
}

// =====================================================
// UPDATE LESSON MEETING
// =====================================================

async function updateLessonMeeting({
    schoolId,
    teacherId,
    lessonId,
    meetingOptions = {}
}) {
    const lesson = await OnlineLesson.findOne({
        _id: lessonId,
        school: schoolId,
        teacher: teacherId
    });

    if (!lesson) {
        throw new Error("Lesson not found or access denied.");
    }

    if (!lesson.meeting?.provider) {
        throw new Error("Lesson does not have a meeting.");
    }

    const provider = lesson.meeting.provider;

    if (
        provider === "external" ||
        provider === "internal"
    ) {
        const providerService = getMeetingProvider(provider);

        const meeting = await providerService.updateMeeting({
            lesson,
            schoolId,
            teacherId,
            options: meetingOptions
        });

        return meeting;
    }

    const integration = await TeacherMeetingIntegration.findOne({
        school: schoolId,
        teacher: teacherId,
        provider,
        active: true
    });

    if (!integration) {
        throw new Error(
            `Teacher has not connected ${provider}.`
        );
    }

    const providerService = getMeetingProvider(provider);

    return providerService.updateMeeting({
        lesson,
        schoolId,
        teacherId,
        integration,
        options: meetingOptions
    });
}

// =====================================================
// DELETE LESSON MEETING
// =====================================================

async function deleteLessonMeeting({
    schoolId,
    teacherId,
    lessonId
}) {
    const lesson = await OnlineLesson.findOne({
        _id: lessonId,
        school: schoolId,
        teacher: teacherId
    });

    if (!lesson) {
        throw new Error("Lesson not found or access denied.");
    }

    if (!lesson.meeting?.provider) {
        return {
            success: true,
            message: "Lesson has no meeting."
        };
    }

    const provider = lesson.meeting.provider;

    if (provider === "external") {
        lesson.meeting = {
            provider: "external",
            meetingId: null,
            meetingUrl: null,
            createdAt: null
        };

        await lesson.save();

        return {
            success: true
        };
    }

    const integration = await TeacherMeetingIntegration.findOne({
        school: schoolId,
        teacher: teacherId,
        provider,
        active: true
    });

    if (!integration && provider !== "internal") {
        throw new Error(
            `Teacher has not connected ${provider}.`
        );
    }

    const providerService = getMeetingProvider(provider);

    await providerService.deleteMeeting({
        lesson,
        schoolId,
        teacherId,
        integration
    });

    lesson.meeting = {
        provider,
        meetingId: null,
        meetingUrl: null,
        createdAt: null
    };

    await lesson.save();

    return {
        success: true
    };
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createLessonMeeting,
    updateLessonMeeting,
    deleteLessonMeeting
};
