/* =====================================================
   TIMIZA EDUANALYTICS
   ANNOUNCEMENTS MANAGEMENT
===================================================== */

const API = "https://timiza-saas.onrender.com/api";

let announcements = [];


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeAnnouncementPage();

});


/* =====================================================
   INITIALIZE PAGE
===================================================== */

function initializeAnnouncementPage() {

    const form =
        document.getElementById("announcementForm");

    if (form) {

        form.addEventListener(
            "submit",
            handleAnnouncementSubmit
        );

    }

    const refreshButton =
        document.getElementById(
            "refreshAnnouncementsBtn"
        );

    refreshButton?.addEventListener(
        "click",
        loadAnnouncements
    );

    loadAnnouncements();

}


/* =====================================================
   TOKEN
===================================================== */

function getToken() {

    return localStorage.getItem("token");

}


/* =====================================================
   API HELPER
===================================================== */

async function api(
    url,
    options = {}
) {

    const token = getToken();

    if (!token) {

        throw new Error(
            "Authentication required. Please log in again."
        );

    }

    const headers = {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`,

        ...(options.headers || {})

    };

    const response =
        await fetch(
            `${API}${url}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {

        data =
            await response.json();

    } catch {

        data = null;

    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            `Request failed (${response.status})`
        );

    }

    return data;

}


/* =====================================================
   LOAD ANNOUNCEMENTS
===================================================== */

async function loadAnnouncements() {

    const list =
        document.getElementById(
            "announcementsList"
        );

    if (!list) return;

    showLoading();

    try {

        const response =
            await api(
                "/announcements"
            );

        /*
         * Supports:
         *
         * [...]
         *
         * {
         *   announcements: [...]
         * }
         *
         * {
         *   data: [...]
         * }
         */

        if (Array.isArray(response)) {

            announcements =
                response;

        } else if (
            Array.isArray(
                response?.announcements
            )
        ) {

            announcements =
                response.announcements;

        } else if (
            Array.isArray(
                response?.data
            )
        ) {

            announcements =
                response.data;

        } else {

            announcements = [];

        }

        /*
         * Newest first
         */

        announcements.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.createdAt ||
                        a.date ||
                        0
                    );

                const dateB =
                    new Date(
                        b.createdAt ||
                        b.date ||
                        0
                    );

                return dateB - dateA;

            }
        );

        renderAnnouncements();

        updateAnnouncementCount();

    } catch (error) {

        console.error(
            "[ANNOUNCEMENTS LOAD]",
            error
        );

        showError(
            error.message ||
            "Failed to load announcements."
        );

    }

}


/* =====================================================
   RENDER ANNOUNCEMENTS
===================================================== */

function renderAnnouncements() {

    const list =
        document.getElementById(
            "announcementsList"
        );

    if (!list) return;

    list.innerHTML = "";

    if (!announcements.length) {

        list.innerHTML = `

            <div class="announcement-empty">

                <div class="empty-icon">

                    <i class="fas fa-bullhorn"></i>

                </div>

                <h3>
                    No announcements yet
                </h3>

                <p>
                    Create your first school announcement
                    using the form above.
                </p>

            </div>

        `;

        return;

    }

    announcements.forEach(
        announcement => {

            const item =
                createAnnouncementElement(
                    announcement
                );

            list.appendChild(item);

        }
    );

}


/* =====================================================
   CREATE ANNOUNCEMENT ELEMENT
===================================================== */

function createAnnouncementElement(
    announcement
) {

    const item =
        document.createElement("article");

    item.className =
        "announcement-card";

    const id =
        announcement._id ||
        announcement.id ||
        "";

    const text =
        announcement.text ||
        announcement.message ||
        announcement.content ||
        "No content";

    const date =
        formatDate(
            announcement.createdAt ||
            announcement.date
        );

    const author =
        announcement.author?.name ||
        announcement.createdBy?.name ||
        announcement.authorName ||
        "Administrator";

    item.dataset.id = id;

    item.innerHTML = `

        <div class="announcement-card-icon">

            <i class="fas fa-bullhorn"></i>

        </div>


        <div class="announcement-card-content">

            <div class="announcement-card-header">

                <span class="announcement-label">

                    School Announcement

                </span>

                <span class="announcement-date">

                    <i class="far fa-clock"></i>

                    ${escapeHtml(date)}

                </span>

            </div>


            <div class="announcement-text">

                ${escapeHtml(text)}

            </div>


            <div class="announcement-footer">

                <span>

                    <i class="fas fa-user-shield"></i>

                    Posted by
                    ${escapeHtml(author)}

                </span>

            </div>

        </div>


        <div class="announcement-actions">

            <button
                type="button"
                class="delete-announcement-btn"
                title="Delete announcement"
                data-id="${escapeAttribute(id)}"
            >

                <i class="fas fa-trash"></i>

            </button>

        </div>

    `;

    const deleteButton =
        item.querySelector(
            ".delete-announcement-btn"
        );

    deleteButton?.addEventListener(
        "click",
        () => {

            deleteAnnouncement(
                id,
                item
            );

        }
    );

    return item;

}


/* =====================================================
   SUBMIT ANNOUNCEMENT
===================================================== */

async function handleAnnouncementSubmit(
    event
) {

    event.preventDefault();

    const form =
        event.target;

    const textarea =
        document.getElementById(
            "announcementText"
        );

    const button =
        document.getElementById(
            "publishAnnouncementBtn"
        );

    if (!textarea) return;

    const text =
        textarea.value.trim();

    if (!text) {

        showMessage(
            "Please enter an announcement.",
            "error"
        );

        textarea.focus();

        return;

    }

    if (text.length > 1000) {

        showMessage(
            "Announcement cannot exceed 1000 characters.",
            "error"
        );

        return;

    }

    try {

        setButtonLoading(
            button,
            true
        );

        const response =
            await api(
                "/announcements",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            text
                        })
                }
            );

        const announcement =
            response?.announcement ||
            response?.data ||
            response;

        if (announcement) {

            /*
             * Add immediately to the top.
             */

            announcements.unshift(
                announcement
            );

            renderAnnouncements();

            updateAnnouncementCount();

        } else {

            await loadAnnouncements();

        }

        form.reset();

        showMessage(
            response?.message ||
            "Announcement published successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "[ANNOUNCEMENT CREATE]",
            error
        );

        showMessage(
            error.message ||
            "Failed to publish announcement.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =====================================================
   DELETE ANNOUNCEMENT
===================================================== */

async function deleteAnnouncement(
    id,
    element
) {

    if (!id) {

        showMessage(
            "Announcement ID is missing.",
            "error"
        );

        return;

    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this announcement?\n\nThis action cannot be undone."
        );

    if (!confirmed) return;

    const button =
        element.querySelector(
            ".delete-announcement-btn"
        );

    try {

        if (button) {

            button.disabled = true;

            button.innerHTML = `

                <i class="fas fa-spinner fa-spin"></i>

            `;

        }

        await api(
            `/announcements/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        /*
         * Remove from local array.
         */

        announcements =
            announcements.filter(
                announcement =>
                    String(
                        announcement._id ||
                        announcement.id
                    ) !== String(id)
            );

        /*
         * Animate removal.
         */

        element.classList.add(
            "removing"
        );

        setTimeout(
            () => {

                renderAnnouncements();

                updateAnnouncementCount();

            },
            300
        );

        showMessage(
            "Announcement deleted successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "[ANNOUNCEMENT DELETE]",
            error
        );

        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i class="fas fa-trash"></i>

            `;

        }

        showMessage(
            error.message ||
            "Failed to delete announcement.",
            "error"
        );

    }

}


/* =====================================================
   LOADING
===================================================== */

function showLoading() {

    const list =
        document.getElementById(
            "announcementsList"
        );

    if (!list) return;

    list.innerHTML = `

        <div class="announcement-loading">

            <i class="fas fa-spinner fa-spin"></i>

            <p>
                Loading announcements...
            </p>

        </div>

    `;

}


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    const list =
        document.getElementById(
            "announcementsList"
        );

    if (!list) return;

    list.innerHTML = `

        <div class="announcement-error">

            <i class="fas fa-exclamation-circle"></i>

            <h3>
                Unable to load announcements
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                onclick="loadAnnouncements()"
                class="retry-btn"
            >

                <i class="fas fa-sync-alt"></i>

                Try Again

            </button>

        </div>

    `;

}


/* =====================================================
   MESSAGE / TOAST
===================================================== */

function showMessage(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "announcementToastContainer"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "announcementToastContainer";

        container.className =
            "announcement-toast-container";

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.className =
        `announcement-toast ${type}`;

    const icon =
        type === "success"
            ? "fas fa-check-circle"
            : "fas fa-exclamation-circle";

    toast.innerHTML = `

        <i class="${icon}"></i>

        <span>
            ${escapeHtml(message)}
        </span>

        <button
            type="button"
            aria-label="Close notification"
        >

            <i class="fas fa-times"></i>

        </button>

    `;

    toast
        .querySelector("button")
        ?.addEventListener(
            "click",
            () => toast.remove()
        );

    container.appendChild(
        toast
    );

    setTimeout(
        () => {

            toast.remove();

        },
        5000
    );

}


/* =====================================================
   BUTTON LOADING
===================================================== */

function setButtonLoading(
    button,
    loading
) {

    if (!button) return;

    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.innerHTML;

        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Publishing...

        `;

    } else {

        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText ||
            `

                <i class="fas fa-paper-plane"></i>

                Publish Announcement

            `;

    }

}


/* =====================================================
   UPDATE COUNT
===================================================== */

function updateAnnouncementCount() {

    const element =
        document.getElementById(
            "announcementCount"
        );

    if (!element) return;

    element.textContent =
        announcements.length;

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return "Date unavailable";

    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   ESCAPE ATTRIBUTE
===================================================== */

function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.loadAnnouncements =
    loadAnnouncements;

window.deleteAnnouncement =
    deleteAnnouncement;
