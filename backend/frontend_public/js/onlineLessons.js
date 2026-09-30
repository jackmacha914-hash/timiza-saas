(function () {
    "use strict";

    const API_BASE = "/api/online-lessons";

    function getToken() {
        return localStorage.getItem("token");
    }

    function getUser() {
        try {
            return JSON.parse(
                localStorage.getItem("user") || "null"
            );
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
                data.message ||
                "Online Lessons request failed."
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
        if (!dateValue) {
            return "Not scheduled";
        }

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


    /* =====================================================
       LOAD LESSON FORM OPTIONS
       ===================================================== */

    function loadLessonOptions() {
        const classSelect =
            document.getElementById("lessonClass");

        const subjectSelect =
            document.getElementById("lessonSubject");

        if (!classSelect || !subjectSelect) {
            return;
        }

        /*
         * Online Lessons currently use the same static
         * Class and Subject options as the existing
         * Quiz creation flow.
         *
         * We intentionally do NOT call /options here.
         * The selected values are the human-readable names,
         * for example:
         *
         * Class: Grade 3
         * Subject: French
         */

        console.log(
            "Online Lesson class options:",
            Array.from(classSelect.options).map(
                option => option.value
            )
        );

        console.log(
            "Online Lesson subject options:",
            Array.from(subjectSelect.options).map(
                option => option.value
            )
        );
    }


    /* =====================================================
       LOAD TEACHER LESSONS
       ===================================================== */

    async function loadTeacherLessons() {
        const container =
            document.getElementById(
                "onlineLessonsList"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading online lessons...
            </div>
        `;

        try {
            const data = await apiRequest(
                `${API_BASE}/teacher`
            );

            const lessons =
                Array.isArray(data.lessons)
                    ? data.lessons
                    : [];

            renderTeacherLessons(lessons);

        } catch (error) {

            console.error(
                "Load teacher online lessons error:",
                error
            );

            container.innerHTML = `
                <div class="error">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }


    /* =====================================================
       RENDER LESSONS
       ===================================================== */

    function renderTeacherLessons(lessons) {

        const container =
            document.getElementById(
                "onlineLessonsList"
            );

        if (!container) {
            return;
        }

        if (lessons.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <i class="fas fa-video"></i>

                    <h3>No Online Lessons Yet</h3>

                    <p>
                        Create your first online lesson
                        to get started.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML = lessons
            .map((lesson) => {

                const lessonId =
                    getLessonId(lesson);

                const className =
                    lesson.class?.name ||
                    lesson.class ||
                    "Class";

                const subjectName =
                    lesson.subject?.name ||
                    lesson.subject ||
                    "Subject";

                const title =
                    lesson.title ||
                    "Online Lesson";

                const status =
                    lesson.status ||
                    "scheduled";

                const meetingUrl =
                    lesson.meeting?.meetingUrl ||
                    "";

                return `
                    <div
                        class="lesson-card"
                        data-lesson-id="${escapeHtml(
                            lessonId
                        )}"
                    >

                        <div class="lesson-card-header">

                            <div>

                                <h3>
                                    ${escapeHtml(title)}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        subjectName
                                    )}
                                    ·
                                    ${escapeHtml(
                                        className
                                    )}
                                </p>

                            </div>

                            <span
                                class="status-badge status-${escapeHtml(
                                    status
                                )}"
                            >
                                ${escapeHtml(
                                    getStatusLabel(
                                        status
                                    )
                                )}
                            </span>

                        </div>


                        <div class="lesson-details">

                            <div class="lesson-detail">

                                <span class="lesson-detail-label">
                                    Date & Time
                                </span>

                                <span class="lesson-detail-value">
                                    ${escapeHtml(
                                        formatDate(
                                            lesson.scheduledAt
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="lesson-detail">

                                <span class="lesson-detail-label">
                                    Duration
                                </span>

                                <span class="lesson-detail-value">
                                    ${escapeHtml(
                                        lesson.duration
                                    )}
                                    minutes
                                </span>

                            </div>


                            <div class="lesson-detail">

                                <span class="lesson-detail-label">
                                    Meeting
                                </span>

                                <span class="lesson-detail-value">
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


                        <div class="lesson-actions">

                            ${renderLessonActions(
                                lesson
                            )}

                        </div>

                    </div>
                `;
            })
            .join("");
    }


    /* =====================================================
       LESSON ACTIONS
       ===================================================== */

    function renderLessonActions(lesson) {

        const lessonId =
            getLessonId(lesson);

        if (!lessonId) {
            return "";
        }

        if (lesson.status === "scheduled") {

            return `
                <button
                    type="button"
                    class="btn btn-primary"
                    data-action="start"
                    data-lesson-id="${escapeHtml(
                        lessonId
                    )}"
                >
                    <i class="fas fa-play"></i>
                    Start Lesson
                </button>

                <button
                    type="button"
                    class="btn btn-danger"
                    data-action="cancel"
                    data-lesson-id="${escapeHtml(
                        lessonId
                    )}"
                >
                    <i class="fas fa-times"></i>
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
                                class="btn btn-primary"
                            >
                                <i class="fas fa-video"></i>
                                Open Meeting
                            </a>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="btn btn-danger"
                    data-action="end"
                    data-lesson-id="${escapeHtml(
                        lessonId
                    )}"
                >
                    <i class="fas fa-stop"></i>
                    End Lesson
                </button>
            `;
        }


        if (lesson.status === "completed") {

            return `
                <span>
                    <i class="fas fa-check-circle"></i>
                    Lesson completed
                </span>
            `;
        }


        if (lesson.status === "cancelled") {

            return `
                <span>
                    <i class="fas fa-ban"></i>
                    Lesson cancelled
                </span>
            `;
        }


        return "";
    }


    /* =====================================================
       START LESSON
       ===================================================== */

    async function startLesson(lessonId) {

        if (!lessonId) {
            return;
        }

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


    /* =====================================================
       END LESSON
       ===================================================== */

    async function endLesson(lessonId) {

        if (!lessonId) {
            return;
        }

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


    /* =====================================================
       CANCEL LESSON
       ===================================================== */

    async function cancelLesson(lessonId) {

        if (!lessonId) {
            return;
        }

        const confirmed =
            window.confirm(
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


    /* =====================================================
       CREATE LESSON MODAL
       ===================================================== */

    function openCreateLessonModal() {

        const modal =
            document.getElementById(
                "onlineLessonModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.add("show");

        loadLessonOptions();
    }


    function closeCreateLessonModal() {

        const modal =
            document.getElementById(
                "onlineLessonModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove("show");
    }


    /* =====================================================
       CREATE LESSON
       ===================================================== */

    async function createLesson(event) {

        event.preventDefault();

        const title =
            document
                .getElementById("lessonTitle")
                .value
                .trim();

        /*
         * These are intentionally names, matching
         * the existing Quiz creation flow.
         */
        const className =
            document
                .getElementById("lessonClass")
                .value;

        const subjectName =
            document
                .getElementById("lessonSubject")
                .value;

        const scheduledAt =
            document
                .getElementById("lessonDateTime")
                .value;

        const duration =
            document
                .getElementById("lessonDuration")
                .value;

        const description =
            document
                .getElementById("lessonDescription")
                .value
                .trim();

        const meetingProvider =
            document
                .getElementById("meetingProvider")
                .value;

        const meetingUrl =
            document
                .getElementById("meetingUrl")
                .value
                .trim();


        if (!title) {
            alert("Please enter a lesson title.");
            return;
        }

        if (!className) {
            alert("Please select a class.");
            return;
        }

        if (!subjectName) {
            alert("Please select a subject.");
            return;
        }

        if (!scheduledAt) {
            alert("Please select the lesson date and time.");
            return;
        }

        if (!duration || Number(duration) < 1) {
            alert("Please enter a valid lesson duration.");
            return;
        }


        const payload = {

            class: className,

            subject: subjectName,

            title,

            scheduledAt,

            duration: Number(duration),

            description,

            meeting: {
                provider:
                    meetingProvider ||
                    "external"
            }
        };


        if (
            meetingProvider === "external"
        ) {

            if (!meetingUrl) {

                alert(
                    "Please enter the meeting URL for an external meeting."
                );

                return;
            }

            payload.meeting.meetingUrl =
                meetingUrl;
        }


        console.log(
            "Sending online lesson data:",
            payload
        );


        try {

            await apiRequest(
                API_BASE,
                {
                    method: "POST",

                    body: JSON.stringify(
                        payload
                    )
                }
            );

            alert(
                "Online lesson created successfully."
            );

            closeCreateLessonModal();

            event.target.reset();

            await loadTeacherLessons();

        } catch (error) {

            console.error(
                "Create online lesson error:",
                error
            );

            alert(error.message);
        }
    }


    /* =====================================================
       EVENT HANDLERS
       ===================================================== */

    function setupEventHandlers() {

        const createButton =
            document.getElementById(
                "createOnlineLessonBtn"
            );

        const closeButton =
            document.getElementById(
                "closeOnlineLessonModal"
            );

        const cancelButton =
            document.getElementById(
                "cancelOnlineLesson"
            );

        const form =
            document.getElementById(
                "createOnlineLessonForm"
            );


        if (createButton) {

            createButton.addEventListener(
                "click",
                openCreateLessonModal
            );
        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeCreateLessonModal
            );
        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeCreateLessonModal
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                createLesson
            );
        }


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

                    startLesson(
                        lessonId
                    );
                }


                if (action === "end") {

                    endLesson(
                        lessonId
                    );
                }


                if (action === "cancel") {

                    cancelLesson(
                        lessonId
                    );
                }

            }
        );


        /* Close modal when clicking outside */

        const modal =
            document.getElementById(
                "onlineLessonModal"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {
                        closeCreateLessonModal();
                    }

                }
            );
        }
    }


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        setupEventHandlers();

        const user = getUser();

        if (
            user &&
            String(user.role || "")
                .toLowerCase() === "teacher"
        ) {
            loadTeacherLessons();
        }
    }


    window.onlineLessons = {

        loadTeacherLessons,

        loadLessonOptions,

        startLesson,

        endLesson,

        cancelLesson,

        openCreateLessonModal,

        closeCreateLessonModal

    };


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();

