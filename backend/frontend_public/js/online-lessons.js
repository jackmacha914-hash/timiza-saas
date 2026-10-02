// =====================================================
// SCHOOLSYNC - STUDENT ONLINE LESSONS
// =====================================================

(() => {
    "use strict";

    const API_BASE = "/api/online-lessons";

    let initialized = false;
    let currentLessons = {
        today: [],
        upcoming: [],
        completed: []
    };


    // =================================================
    // INITIALIZE
    // =================================================

    async function initializeOnlineLessons() {

        if (!initialized) {
            setupRefreshButton();
            initialized = true;
        }

        await fetchStudentLessons();
    }


    // =================================================
    // FETCH STUDENT LESSONS
    // =================================================

    async function fetchStudentLessons() {

        setLoadingState();

        try {

            const response = await fetch(
                `${API_BASE}/student`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load online lessons."
                );
            }

            currentLessons = {
                today: Array.isArray(data.today)
                    ? data.today
                    : [],

                upcoming: Array.isArray(data.upcoming)
                    ? data.upcoming
                    : [],

                completed: Array.isArray(data.completed)
                    ? data.completed
                    : []
            };

            renderLessons();

        } catch (error) {

            console.error(
                "[ONLINE LESSONS] Fetch error:",
                error
            );

            showGlobalError(
                error.message ||
                "Unable to load online lessons."
            );
        }
    }


    // =================================================
    // RENDER ALL LESSONS
    // =================================================

    function renderLessons() {

        updateStatistics();

        renderLessonGroup(
            "today-lessons-list",
            currentLessons.today,
            "today"
        );

        renderLessonGroup(
            "upcoming-lessons-list",
            currentLessons.upcoming,
            "upcoming"
        );

        renderLessonGroup(
            "completed-lessons-list",
            currentLessons.completed,
            "completed"
        );
    }


    // =================================================
    // STATISTICS
    // =================================================

    function updateStatistics() {

        const todayCount =
            document.getElementById(
                "today-lessons-count"
            );

        const upcomingCount =
            document.getElementById(
                "upcoming-lessons-count"
            );

        const completedCount =
            document.getElementById(
                "completed-lessons-count"
            );

        if (todayCount) {
            todayCount.textContent =
                currentLessons.today.length;
        }

        if (upcomingCount) {
            upcomingCount.textContent =
                currentLessons.upcoming.length;
        }

        if (completedCount) {
            completedCount.textContent =
                currentLessons.completed.length;
        }
    }


    // =================================================
    // RENDER LESSON GROUP
    // =================================================

    function renderLessonGroup(
        containerId,
        lessons,
        groupType
    ) {

        const container =
            document.getElementById(containerId);

        if (!container) {
            return;
        }

        if (!lessons.length) {

            container.innerHTML =
                createEmptyState(groupType);

            return;
        }

        container.innerHTML = lessons
            .map(lesson =>
                createLessonCard(
                    lesson,
                    groupType
                )
            )
            .join("");
    }


    // =================================================
    // LESSON CARD
    // =================================================

    function createLessonCard(
        lesson,
        groupType
    ) {

        const lessonId =
            escapeHtml(
                lesson._id || ""
            );

        const title =
            escapeHtml(
                lesson.title ||
                "Online Lesson"
            );

        const subject =
            escapeHtml(
                lesson.subject ||
                "Subject"
            );

        const className =
            escapeHtml(
                lesson.class ||
                ""
            );

        const teacher =
            escapeHtml(
                lesson.teacher?.name ||
                "Teacher"
            );

        const description =
            escapeHtml(
                lesson.description ||
                "No description provided."
            );

        const provider =
            formatMeetingProvider(
                lesson.meeting?.provider
            );

        const date =
            formatDate(
                lesson.scheduledAt
            );

        const time =
            formatTime(
                lesson.scheduledAt
            );

        const duration =
            Number(lesson.duration) || 0;

        const status =
            String(
                lesson.status || "scheduled"
            ).toLowerCase();

        const statusLabel =
            formatStatus(status);

        const isLive =
            status === "live";

        const isCompleted =
            status === "completed" ||
            Boolean(lesson.endedAt);

        let actionButtons = `
            <button
                type="button"
                class="lesson-btn lesson-details-btn"
                data-lesson-id="${lessonId}"
            >
                <i class="bi bi-info-circle"></i>
                Details
            </button>
        `;

        if (!isCompleted) {

            if (isLive) {

                actionButtons += `
                    <button
                        type="button"
                        class="lesson-btn lesson-join-btn primary"
                        data-lesson-id="${lessonId}"
                    >
                        <i class="bi bi-camera-video-fill"></i>
                        Join Now
                    </button>
                `;

            } else if (groupType === "today") {

                actionButtons += `
                    <button
                        type="button"
                        class="lesson-btn lesson-join-btn"
                        data-lesson-id="${lessonId}"
                    >
                        <i class="bi bi-box-arrow-in-right"></i>
                        Join Lesson
                    </button>
                `;
            }
        }

        if (
            isCompleted &&
            lesson.recordingUrl
        ) {

            const recordingUrl =
                escapeAttribute(
                    lesson.recordingUrl
                );

            actionButtons += `
                <a
                    href="${recordingUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="lesson-btn primary"
                >
                    <i class="bi bi-play-circle"></i>
                    Watch Recording
                </a>
            `;
        }

        return `
            <article
                class="online-lesson-card
                       ${isLive ? "lesson-is-live" : ""}
                       ${isCompleted ? "lesson-is-completed" : ""}"
            >

                <div class="lesson-card-top">

                    <span class="lesson-subject">
                        <i class="bi bi-book"></i>
                        ${subject}
                    </span>

                    <span class="lesson-status ${status}">
                        ${isLive
                            ? '<span class="live-dot"></span>'
                            : ''
                        }
                        ${statusLabel}
                    </span>

                </div>


                <div class="lesson-card-body">

                    <h3>
                        ${title}
                    </h3>

                    <p class="lesson-description">
                        ${description}
                    </p>


                    <div class="lesson-information">

                        <div class="lesson-info-item">

                            <i class="bi bi-person"></i>

                            <div>
                                <span>Teacher</span>
                                <strong>${teacher}</strong>
                            </div>

                        </div>


                        <div class="lesson-info-item">

                            <i class="bi bi-mortarboard"></i>

                            <div>
                                <span>Class</span>
                                <strong>${className}</strong>
                            </div>

                        </div>


                        <div class="lesson-info-item">

                            <i class="bi bi-calendar3"></i>

                            <div>
                                <span>Date</span>
                                <strong>${date}</strong>
                            </div>

                        </div>


                        <div class="lesson-info-item">

                            <i class="bi bi-clock"></i>

                            <div>
                                <span>Time</span>
                                <strong>${time}</strong>
                            </div>

                        </div>


                        <div class="lesson-info-item">

                            <i class="bi bi-hourglass-split"></i>

                            <div>
                                <span>Duration</span>
                                <strong>
                                    ${duration} minutes
                                </strong>
                            </div>

                        </div>

                    </div>


                    <div class="lesson-meeting">

                        <i class="bi bi-camera-video"></i>

                        <span>
                            ${provider}
                        </span>

                    </div>

                </div>


                <div class="lesson-card-footer">

                    ${actionButtons}

                </div>

            </article>
        `;
    }


    // =================================================
    // VIEW LESSON DETAILS
    // =================================================

    async function viewLessonDetails(
        lessonId
    ) {

        if (!lessonId) {
            return;
        }

        try {

            const response = await fetch(
                `${API_BASE}/${encodeURIComponent(lessonId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load lesson details."
                );
            }

            showLessonDetails(
                data.lesson
            );

        } catch (error) {

            console.error(
                "[ONLINE LESSONS] Details error:",
                error
            );

            showGlobalError(
                error.message
            );
        }
    }


    // =================================================
    // SHOW DETAILS
    // =================================================

    function showLessonDetails(
        lesson
    ) {

        if (!lesson) {
            return;
        }

        const existingModal =
            document.getElementById(
                "online-lesson-details-modal"
            );

        if (existingModal) {
            existingModal.remove();
        }

        const title =
            escapeHtml(
                lesson.title ||
                "Online Lesson"
            );

        const description =
            escapeHtml(
                lesson.description ||
                "No description provided."
            );

        const subject =
            escapeHtml(
                lesson.subject || "-"
            );

        const teacher =
            escapeHtml(
                lesson.teacher?.name || "-"
            );

        const className =
            escapeHtml(
                lesson.class || "-"
            );

        const date =
            formatDate(
                lesson.scheduledAt
            );

        const time =
            formatTime(
                lesson.scheduledAt
            );

        const duration =
            Number(lesson.duration) || 0;

        const materials =
            Array.isArray(lesson.materials)
                ? lesson.materials
                : [];

        const materialsHtml =
            materials.length
                ? materials.map(material => {

                    const materialTitle =
                        escapeHtml(
                            material.title ||
                            "Learning Material"
                        );

                    const materialUrl =
                        escapeAttribute(
                            material.url || "#"
                        );

                    const materialType =
                        escapeHtml(
                            material.type ||
                            "resource"
                        );

                    return `
                        <a
                            href="${materialUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="lesson-material"
                        >
                            <i class="bi bi-file-earmark-text"></i>

                            <span>
                                <strong>
                                    ${materialTitle}
                                </strong>

                                <small>
                                    ${materialType}
                                </small>
                            </span>

                            <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                    `;

                }).join("")
                : `
                    <p class="no-materials">
                        No learning materials attached.
                    </p>
                `;

        const modal =
            document.createElement("div");

        modal.id =
            "online-lesson-details-modal";

        modal.className =
            "lesson-modal-overlay";

        modal.innerHTML = `

            <div class="lesson-modal">

                <div class="lesson-modal-header">

                    <div>
                        <span class="modal-eyebrow">
                            Online Lesson
                        </span>

                        <h2>
                            ${title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="lesson-modal-close"
                        id="close-lesson-details"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>

                </div>


                <div class="lesson-modal-body">

                    <p class="modal-description">
                        ${description}
                    </p>


                    <div class="modal-details-grid">

                        <div>
                            <span>Subject</span>
                            <strong>${subject}</strong>
                        </div>

                        <div>
                            <span>Teacher</span>
                            <strong>${teacher}</strong>
                        </div>

                        <div>
                            <span>Class</span>
                            <strong>${className}</strong>
                        </div>

                        <div>
                            <span>Date</span>
                            <strong>${date}</strong>
                        </div>

                        <div>
                            <span>Time</span>
                            <strong>${time}</strong>
                        </div>

                        <div>
                            <span>Duration</span>
                            <strong>${duration} minutes</strong>
                        </div>

                    </div>


                    <div class="modal-materials">

                        <h3>
                            <i class="bi bi-folder2-open"></i>
                            Learning Materials
                        </h3>

                        <div class="materials-list">
                            ${materialsHtml}
                        </div>

                    </div>

                </div>


                <div class="lesson-modal-footer">

                    <button
                        type="button"
                        class="lesson-btn"
                        id="close-lesson-details-footer"
                    >
                        Close
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);


        const closeModal = () => {
            modal.remove();
        };


        document
            .getElementById(
                "close-lesson-details"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        document
            .getElementById(
                "close-lesson-details-footer"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {
                    closeModal();
                }

            }
        );
    }


    // =================================================
    // JOIN LESSON
    // =================================================

    async function joinLesson(
        lessonId
    ) {

        if (!lessonId) {
            return;
        }

        const lesson =
            findLessonById(
                lessonId
            );

        if (!lesson) {
            showGlobalError(
                "Lesson could not be found."
            );

            return;
        }

        const meetingUrl =
            lesson.meeting?.meetingUrl;

        if (!meetingUrl) {

            showGlobalError(
                "This lesson does not have a meeting link yet."
            );

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/${encodeURIComponent(lessonId)}/join`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to record lesson attendance."
                );
            }

            // Open the actual meeting after attendance
            // has been successfully recorded.
            window.open(
                meetingUrl,
                "_blank",
                "noopener,noreferrer"
            );

            // Refresh status/data.
            await fetchStudentLessons();

        } catch (error) {

            console.error(
                "[ONLINE LESSONS] Join error:",
                error
            );

            showGlobalError(
                error.message ||
                "Unable to join lesson."
            );
        }
    }


    // =================================================
    // FIND LESSON
    // =================================================

    function findLessonById(
        lessonId
    ) {

        const allLessons = [
            ...currentLessons.today,
            ...currentLessons.upcoming,
            ...currentLessons.completed
        ];

        return allLessons.find(
            lesson =>
                String(lesson._id) ===
                String(lessonId)
        );
    }


    // =================================================
    // REFRESH BUTTON
    // =================================================

    function setupRefreshButton() {

        const button =
            document.getElementById(
                "refresh-online-lessons"
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async () => {

                const originalHtml =
                    button.innerHTML;

                button.disabled = true;

                button.innerHTML = `
                    <i class="bi bi-arrow-clockwise spin"></i>
                    Refreshing...
                `;

                await fetchStudentLessons();

                button.disabled = false;

                button.innerHTML =
                    originalHtml;
            }
        );
    }


    // =================================================
    // EVENTS
    // =================================================

    document.addEventListener(
        "click",
        event => {

            const detailsButton =
                event.target.closest(
                    ".lesson-details-btn"
                );

            if (detailsButton) {

                viewLessonDetails(
                    detailsButton.dataset.lessonId
                );

                return;
            }


            const joinButton =
                event.target.closest(
                    ".lesson-join-btn"
                );

            if (joinButton) {

                joinLesson(
                    joinButton.dataset.lessonId
                );
            }

        }
    );


    // =================================================
    // LOADING STATE
    // =================================================

    function setLoadingState() {

        const containers = [
            "today-lessons-list",
            "upcoming-lessons-list",
            "completed-lessons-list"
        ];

        containers.forEach(id => {

            const container =
                document.getElementById(id);

            if (!container) {
                return;
            }

            container.innerHTML = `
                <div class="online-lessons-loading">

                    <div class="spinner-border"></div>

                    <p>
                        Loading online lessons...
                    </p>

                </div>
            `;
        });
    }


    // =================================================
    // EMPTY STATE
    // =================================================

    function createEmptyState(
        type
    ) {

        const messages = {

            today: {
                icon: "bi-calendar-check",
                title: "No lessons today",
                message:
                    "You do not have any online lessons scheduled for today."
            },

            upcoming: {
                icon: "bi-calendar-event",
                title: "No upcoming lessons",
                message:
                    "There are no upcoming online lessons at the moment."
            },

            completed: {
                icon: "bi-check-circle",
                title: "No completed lessons",
                message:
                    "Your completed online lessons will appear here."
            }

        };

        const content =
            messages[type] ||
            messages.today;

        return `
            <div class="online-lessons-empty">

                <div class="empty-icon">
                    <i class="bi ${content.icon}"></i>
                </div>

                <h3>
                    ${content.title}
                </h3>

                <p>
                    ${content.message}
                </p>

            </div>
        `;
    }


    // =================================================
    // ERROR
    // =================================================

    function showGlobalError(
        message
    ) {

        const containers = [
            "today-lessons-list",
            "upcoming-lessons-list",
            "completed-lessons-list"
        ];

        containers.forEach(id => {

            const container =
                document.getElementById(id);

            if (!container) {
                return;
            }

            container.innerHTML = `
                <div class="online-lessons-error">

                    <i class="bi bi-exclamation-triangle"></i>

                    <h3>
                        Unable to load lessons
                    </h3>

                    <p>
                        ${escapeHtml(
                            message ||
                            "Something went wrong."
                        )}
                    </p>

                    <button
                        type="button"
                        class="lesson-btn primary"
                        onclick="window.initializeOnlineLessons()"
                    >
                        <i class="bi bi-arrow-clockwise"></i>
                        Try Again
                    </button>

                </div>
            `;
        });
    }


    // =================================================
    // FORMATTING
    // =================================================

    function formatDate(
        value
    ) {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString(
            undefined,
            {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }


    function formatTime(
        value
    ) {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }


    function formatMeetingProvider(
        provider
    ) {

        const providers = {

            google_meet:
                "Google Meet",

            zoom:
                "Zoom",

            microsoft_teams:
                "Microsoft Teams",

            external:
                "External Meeting",

            internal:
                "School Meeting"

        };

        return providers[
            String(provider || "")
                .toLowerCase()
        ] || "Online Meeting";
    }


    function formatStatus(
        status
    ) {

        const labels = {

            scheduled:
                "Scheduled",

            live:
                "Live Now",

            completed:
                "Completed",

            cancelled:
                "Cancelled"

        };

        return labels[status] ||
            "Scheduled";
    }


    // =================================================
    // SECURITY HELPERS
    // =================================================

    function escapeHtml(
        value
    ) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttribute(
        value
    ) {

        return escapeHtml(value);
    }


    // =================================================
    // PUBLIC API
    // =================================================

    window.initializeOnlineLessons =
        initializeOnlineLessons;


    // =================================================
    // INITIAL LOAD
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initializeOnlineLessons();
        }
    );

})();
