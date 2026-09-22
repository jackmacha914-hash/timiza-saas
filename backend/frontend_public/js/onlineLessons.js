(function () {
    "use strict";

    const API_BASE = "/api/online-lessons";

    function getToken() {
        return localStorage.getItem("token");
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch (error) {
            return null;
        }
    }

    async function apiRequest(url, options = {}) {
        const token = getToken();

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers["x-auth-token"] = token;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Online Lessons request failed."
            );
        }

        return data;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(dateValue) {
        if (!dateValue) return "Not scheduled";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    function getStatusLabel(status) {
        const labels = {
            scheduled: "Scheduled",
            live: "Live",
            completed: "Completed",
            cancelled: "Cancelled"
        };

        return labels[status] || status || "Unknown";
    }

    function getLessonId(lesson) {
        return lesson?._id || lesson?.id || "";
    }

    async function loadTeacherLessons() {
        const container = document.getElementById(
            "onlineLessonsList"
        );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="online-lessons-loading">
                Loading online lessons...
            </div>
        `;

        try {
            const data = await apiRequest(
                `${API_BASE}/teacher`
            );

            const lessons = Array.isArray(data.lessons)
                ? data.lessons
                : [];

            renderTeacherLessons(lessons);

        } catch (error) {
            console.error(
                "Load teacher online lessons error:",
                error
            );

            container.innerHTML = `
                <div class="online-lessons-error">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }

    function renderTeacherLessons(lessons) {
        const container = document.getElementById(
            "onlineLessonsList"
        );

        if (!container) {
            return;
        }

        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="online-lessons-empty">
                    <h3>No online lessons yet</h3>
                    <p>Create your first online lesson to get started.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = lessons
            .map((lesson) => {
                const lessonId = getLessonId(lesson);

                const className =
                    lesson.class?.name || "Class";

                const subjectName =
                    lesson.subject?.name || "Subject";

                const title =
                    lesson.title || "Online Lesson";

                const status =
                    lesson.status || "scheduled";

                const meetingUrl =
                    lesson.meeting?.meetingUrl || "";

                return `
                    <div
                        class="online-lesson-card"
                        data-lesson-id="${escapeHtml(lessonId)}"
                    >
                        <div class="online-lesson-card-header">
                            <div>
                                <h3>
                                    ${escapeHtml(title)}
                                </h3>

                                <p>
                                    ${escapeHtml(subjectName)}
                                    ·
                                    ${escapeHtml(className)}
                                </p>
                            </div>

                            <span class="online-lesson-status status-${escapeHtml(status)}">
                                ${escapeHtml(
                                    getStatusLabel(status)
                                )}
                            </span>
                        </div>

                        <div class="online-lesson-details">
                            <div>
                                <strong>Date & Time</strong>
                                <span>
                                    ${escapeHtml(
                                        formatDate(
                                            lesson.scheduledAt
                                        )
                                    )}
                                </span>
                            </div>

                            <div>
                                <strong>Duration</strong>
                                <span>
                                    ${escapeHtml(
                                        lesson.duration
                                    )} minutes
                                </span>
                            </div>

                            <div>
                                <strong>Meeting</strong>
                                <span>
                                    ${
                                        meetingUrl
                                            ? escapeHtml(
                                                  lesson.meeting
                                                      ?.provider ||
                                                      "External"
                                              )
                                            : "Not connected"
                                    }
                                </span>
                            </div>
                        </div>

                        <div class="online-lesson-actions">
                            ${renderLessonActions(lesson)}
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function renderLessonActions(lesson) {
        const lessonId = getLessonId(lesson);

        if (!lessonId) {
            return "";
        }

        if (lesson.status === "scheduled") {
            return `
                <button
                    type="button"
                    class="online-lesson-btn online-lesson-start"
                    data-action="start"
                    data-lesson-id="${escapeHtml(lessonId)}"
                >
                    Start Lesson
                </button>

                <button
                    type="button"
                    class="online-lesson-btn online-lesson-cancel"
                    data-action="cancel"
                    data-lesson-id="${escapeHtml(lessonId)}"
                >
                    Cancel
                </button>
            `;
        }

        if (lesson.status === "live") {
            return `
                ${
                    lesson.meeting?.meetingUrl
                        ? `
                            <a
                                href="${escapeHtml(
                                    lesson.meeting.meetingUrl
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="online-lesson-btn"
                            >
                                Open Meeting
                            </a>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="online-lesson-btn online-lesson-end"
                    data-action="end"
                    data-lesson-id="${escapeHtml(lessonId)}"
                >
                    End Lesson
                </button>
            `;
        }

        if (lesson.status === "completed") {
            return `
                <span class="online-lesson-completed-label">
                    Lesson completed
                </span>
            `;
        }

        if (lesson.status === "cancelled") {
            return `
                <span class="online-lesson-cancelled-label">
                    Lesson cancelled
                </span>
            `;
        }

        return "";
    }

    async function startLesson(lessonId) {
        if (!lessonId) return;

        try {
            await apiRequest(
                `${API_BASE}/${lessonId}/start`,
                {
                    method: "POST"
                }
            );

            await loadTeacherLessons();

        } catch (error) {
            console.error(
                "Start online lesson error:",
                error
            );

            alert(error.message);
        }
    }

    async function endLesson(lessonId) {
        if (!lessonId) return;

        try {
            await apiRequest(
                `${API_BASE}/${lessonId}/end`,
                {
                    method: "POST"
                }
            );

            await loadTeacherLessons();

        } catch (error) {
            console.error(
                "End online lesson error:",
                error
            );

            alert(error.message);
        }
    }

    async function cancelLesson(lessonId) {
        if (!lessonId) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this online lesson?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await apiRequest(
                `${API_BASE}/${lessonId}`,
                {
                    method: "DELETE"
                }
            );

            await loadTeacherLessons();

        } catch (error) {
            console.error(
                "Cancel online lesson error:",
                error
            );

            alert(error.message);
        }
    }

    function setupEventHandlers() {
        document.addEventListener(
            "click",
            function (event) {
                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                const lessonId =
                    button.dataset.lessonId;

                if (action === "start") {
                    startLesson(lessonId);
                }

                if (action === "end") {
                    endLesson(lessonId);
                }

                if (action === "cancel") {
                    cancelLesson(lessonId);
                }
            }
        );
    }

    function init() {
        setupEventHandlers();

        const user = getUser();

        if (
            user &&
            String(user.role || "").toLowerCase() ===
                "teacher"
        ) {
            loadTeacherLessons();
        }
    }

    window.onlineLessons = {
        loadTeacherLessons,
        startLesson,
        endLesson,
        cancelLesson
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }
})();
