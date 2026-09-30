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

    console.log("[ANNOUNCEMENTS] Initializing page...");


    /* =================================================
       OPEN MODAL BUTTON
    ================================================= */

    const openButton =
        document.getElementById("openAnnouncementBtn");

    if (openButton) {

        openButton.addEventListener(
            "click",
            openAnnouncementForm
        );

    }


    /* =================================================
       EMPTY STATE CREATE BUTTON
    ================================================= */

    const emptyCreateButton =
        document.getElementById("emptyCreateBtn");

    if (emptyCreateButton) {

        emptyCreateButton.addEventListener(
            "click",
            openAnnouncementForm
        );

    }


    /* =================================================
       CLOSE BUTTON
    ================================================= */

    const closeButton =
        document.getElementById(
            "closeAnnouncementModal"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAnnouncementForm
        );

    }


    /* =================================================
       CANCEL BUTTON
    ================================================= */

    const cancelButton =
        document.getElementById(
            "cancelAnnouncementBtn"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeAnnouncementForm
        );

    }


    /* =================================================
       MODAL OVERLAY
    ================================================= */

    const overlay =
        document.querySelector(
            "#announcementModal .modal-overlay"
        );

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeAnnouncementForm
        );

    }


    /* =================================================
       FORM
    ================================================= */

    const form =
        document.getElementById(
            "announcementForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleAnnouncementSubmit
        );

    }


    /* =================================================
       CHARACTER COUNT
    ================================================= */

    const textarea =
        document.getElementById(
            "announcementText"
        );

    if (textarea) {

        textarea.addEventListener(
            "input",
            updateCharacterCount
        );

    }


    /* =================================================
       LIVE PREVIEW
    ================================================= */

    const titleInput =
        document.getElementById(
            "announcementTitle"
        );

    const previewText =
        document.getElementById(
            "announcementPreview"
        );

    if (titleInput) {

        titleInput.addEventListener(
            "input",
            updateAnnouncementPreview
        );

    }

    if (textarea) {

        textarea.addEventListener(
            "input",
            updateAnnouncementPreview
        );

    }


    /* =================================================
       REFRESH
    ================================================= */

    const refreshButton =
        document.getElementById(
            "refreshAnnouncementsBtn"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAnnouncements
        );

    }


    /* =================================================
       SEARCH
    ================================================= */

    const search =
        document.getElementById(
            "announcementSearch"
        );

    if (search) {

        search.addEventListener(
            "input",
            applyAnnouncementFilters
        );

    }


    /* =================================================
       FILTERS
    ================================================= */

    [
        "announcementPriorityFilter",
        "announcementAudienceFilter",
        "announcementStatusFilter"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.addEventListener(
                "change",
                applyAnnouncementFilters
            );

        }

    });


    /* =================================================
       ESC KEY
    ================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeAnnouncementForm();

            }

        }
    );


    /* =================================================
       LOAD DATA
    ================================================= */

    loadAnnouncements();

}


/* =====================================================
   OPEN MODAL
===================================================== */

function openAnnouncementForm() {

    const modal =
        document.getElementById(
            "announcementModal"
        );

    if (!modal) {

        console.error(
            "[ANNOUNCEMENTS] Modal not found."
        );

        return;

    }

    modal.style.display = "flex";

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );


    const form =
        document.getElementById(
            "announcementForm"
        );

    form?.reset();


    updateCharacterCount();

    updateAnnouncementPreview();


    const textarea =
        document.getElementById(
            "announcementText"
        );

    setTimeout(() => {

        textarea?.focus();

    }, 100);

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeAnnouncementForm() {

    const modal =
        document.getElementById(
            "announcementModal"
        );

    if (!modal) return;

    modal.style.display = "none";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );


    const form =
        document.getElementById(
            "announcementForm"
        );

    form?.reset();


    updateCharacterCount();

    updateAnnouncementPreview();

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


        announcements.sort(
            (a, b) => {

                return new Date(
                    b.createdAt ||
                    b.publishDate ||
                    0
                ) -
                new Date(
                    a.createdAt ||
                    a.publishDate ||
                    0
                );

            }
        );


        updateStatistics();

        applyAnnouncementFilters();


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
   RENDER
===================================================== */

function renderAnnouncements(
    items = announcements
) {

    const list =
        document.getElementById(
            "announcementsList"
        );

    const empty =
        document.getElementById(
            "announcementEmpty"
        );

    if (!list) return;


    list.innerHTML = "";


    if (!items.length) {

        if (empty) {

            empty.style.display =
                "block";

        }

        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    items.forEach(
        announcement => {

            list.appendChild(
                createAnnouncementElement(
                    announcement
                )
            );

        }
    );

}


/* =====================================================
   CREATE CARD
===================================================== */

function createAnnouncementElement(
    announcement
) {

    const item =
        document.createElement(
            "article"
        );

    item.className =
        "announcement-item";


    const id =
        announcement._id ||
        announcement.id ||
        "";


    const title =
        announcement.title ||
        "School Announcement";


    const text =
        announcement.text ||
        announcement.message ||
        announcement.content ||
        "No content";


    const priority =
        announcement.priority ||
        "normal";


    const audience =
        announcement.audience ||
        "all";


    const date =
        formatDate(
            announcement.createdAt ||
            announcement.publishDate
        );


    const author =
        announcement.createdBy ||
        announcement.authorName ||
        "Administrator";


    item.dataset.id = id;


    item.innerHTML = `

        <div class="announcement-card-icon">

            <i class="fas fa-bullhorn"></i>

        </div>


        <div class="announcement-card-content">

            <div class="announcement-card-header">

                <div>

                    <span class="announcement-label">

                        ${escapeHtml(title)}

                    </span>

                    <span class="
                        priority-badge
                        priority-${escapeAttribute(priority)}
                    ">

                        ${escapeHtml(
                            formatPriority(priority)
                        )}

                    </span>

                </div>


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

                    <i class="fas fa-users"></i>

                    ${escapeHtml(
                        formatAudience(audience)
                    )}

                </span>


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
   SUBMIT
===================================================== */

async function handleAnnouncementSubmit(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const title =
        document.getElementById(
            "announcementTitle"
        )?.value.trim();


    const text =
        document.getElementById(
            "announcementText"
        )?.value.trim();


    const priority =
        document.getElementById(
            "announcementPriority"
        )?.value ||
        "normal";


    const audience =
        document.getElementById(
            "announcementAudience"
        )?.value ||
        "all";


    const publishDate =
        document.getElementById(
            "announcementPublishDate"
        )?.value;


    const expiryDate =
        document.getElementById(
            "announcementExpiryDate"
        )?.value;


    const button =
        document.getElementById(
            "saveAnnouncementBtn"
        );


    if (!title) {

        showMessage(
            "Please enter an announcement title.",
            "error"
        );

        return;

    }


    if (!text) {

        showMessage(
            "Please enter an announcement message.",
            "error"
        );

        return;

    }


    if (text.length > 2000) {

        showMessage(
            "Announcement message cannot exceed 2000 characters.",
            "error"
        );

        return;

    }


    if (
        publishDate &&
        expiryDate &&
        new Date(expiryDate) <=
        new Date(publishDate)
    ) {

        showMessage(
            "Expiry date must be after the publish date.",
            "error"
        );

        return;

    }


    try {

        setButtonLoading(
            button,
            true
        );


        const payload = {

            title,

            text,

            priority,

            audience,

            publishDate:
                publishDate ||
                new Date().toISOString(),

            expiryDate:
                expiryDate ||
                null

        };


        console.log(
            "[ANNOUNCEMENTS] Creating:",
            payload
        );


        const response =
            await api(
                "/announcements",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const announcement =
            response?.announcement ||
            response?.data ||
            response;


        if (announcement) {

            announcements.unshift(
                announcement
            );

        }


        updateStatistics();

        applyAnnouncementFilters();


        closeAnnouncementForm();


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
   DELETE
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


    if (
        !window.confirm(
            "Are you sure you want to delete this announcement?"
        )
    ) {

        return;

    }


    try {

        await api(
            `/announcements/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );


        announcements =
            announcements.filter(
                announcement =>
                    String(
                        announcement._id ||
                        announcement.id
                    ) !== String(id)
            );


        element.classList.add(
            "removing"
        );


        setTimeout(
            () => {

                updateStatistics();

                applyAnnouncementFilters();

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


        showMessage(
            error.message ||
            "Failed to delete announcement.",
            "error"
        );

    }

}


/* =====================================================
   FILTERS
===================================================== */

function applyAnnouncementFilters() {

    const search =
        document.getElementById(
            "announcementSearch"
        )?.value
        .trim()
        .toLowerCase() || "";


    const priority =
        document.getElementById(
            "announcementPriorityFilter"
        )?.value || "";


    const audience =
        document.getElementById(
            "announcementAudienceFilter"
        )?.value || "";


    const status =
        document.getElementById(
            "announcementStatusFilter"
        )?.value || "";


    const filtered =
        announcements.filter(
            announcement => {

                const title =
                    (
                        announcement.title ||
                        ""
                    ).toLowerCase();


                const text =
                    (
                        announcement.text ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    text.includes(search);


                const matchesPriority =
                    !priority ||
                    (
                        announcement.priority ||
                        "normal"
                    ) === priority;


                const matchesAudience =
                    !audience ||
                    (
                        announcement.audience ||
                        "all"
                    ) === audience;


                const matchesStatus =
                    !status ||
                    getAnnouncementStatus(
                        announcement
                    ) === status;


                return (
                    matchesSearch &&
                    matchesPriority &&
                    matchesAudience &&
                    matchesStatus
                );

            }
        );


    renderAnnouncements(
        filtered
    );

}


/* =====================================================
   STATUS
===================================================== */

function getAnnouncementStatus(
    announcement
) {

    const now =
        new Date();


    const publish =
        announcement.publishDate
            ? new Date(
                announcement.publishDate
            )
            : new Date(
                announcement.createdAt
            );


    const expiry =
        announcement.expiryDate
            ? new Date(
                announcement.expiryDate
            )
            : null;


    if (
        publish &&
        publish > now
    ) {

        return "scheduled";

    }


    if (
        expiry &&
        expiry < now
    ) {

        return "expired";

    }


    return "active";

}


/* =====================================================
   STATISTICS
===================================================== */

function updateStatistics() {

    const total =
        announcements.length;


    const active =
        announcements.filter(
            a =>
                getAnnouncementStatus(a) ===
                "active"
        ).length;


    const scheduled =
        announcements.filter(
            a =>
                getAnnouncementStatus(a) ===
                "scheduled"
        ).length;


    const high =
        announcements.filter(
            a =>
                a.priority ===
                "high"
        ).length;


    setText(
        "totalAnnouncements",
        total
    );


    setText(
        "activeAnnouncements",
        active
    );


    setText(
        "scheduledAnnouncements",
        scheduled
    );


    setText(
        "priorityAnnouncements",
        high
    );

}


/* =====================================================
   CHARACTER COUNT
===================================================== */

function updateCharacterCount() {

    const textarea =
        document.getElementById(
            "announcementText"
        );

    const counter =
        document.getElementById(
            "announcementCharacterCount"
        );


    if (!textarea || !counter) return;


    counter.textContent =
        textarea.value.length;

}


/* =====================================================
   PREVIEW
===================================================== */

function updateAnnouncementPreview() {

    const title =
        document.getElementById(
            "announcementTitle"
        )?.value.trim();


    const text =
        document.getElementById(
            "announcementText"
        )?.value.trim();


    const preview =
        document.getElementById(
            "announcementPreview"
        );


    if (!preview) return;


    preview.innerHTML = `

        <strong>

            ${escapeHtml(
                title ||
                "Your announcement title"
            )}

        </strong>

        <p>

            ${escapeHtml(
                text ||
                "Your announcement message will appear here."
            )}

        </p>

    `;

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
   LOADING
===================================================== */

function showLoading() {

    const loading =
        document.getElementById(
            "announcementLoading"
        );


    const list =
        document.getElementById(
            "announcementsList"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    if (list) {

        list.innerHTML = "";

    }

}


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    const loading =
        document.getElementById(
            "announcementLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


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
                class="retry-btn"
                onclick="loadAnnouncements()"
            >

                <i class="fas fa-sync-alt"></i>

                Try Again

            </button>

        </div>

    `;

}


/* =====================================================
   TOAST
===================================================== */

function showMessage(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "announcementToastContainer"
        );


    if (!container) {

        console.warn(
            "[ANNOUNCEMENTS]",
            message
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `announcement-toast ${type}`;


    toast.innerHTML = `

        <i class="${
            type === "success"
                ? "fas fa-check-circle"
                : "fas fa-exclamation-circle"
        }"></i>

        <span>
            ${escapeHtml(message)}
        </span>

        <button
            type="button"
            aria-label="Close"
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
        () => toast.remove(),
        5000
    );

}


/* =====================================================
   HELPERS
===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatPriority(
    priority
) {

    const values = {

        normal: "Normal",

        important: "Important",

        high: "High Priority"

    };


    return (
        values[priority] ||
        "Normal"
    );

}


function formatAudience(
    audience
) {

    const values = {

        all: "Everyone",

        students: "Students",

        teachers: "Teachers",

        parents: "Parents",

        staff: "Staff"

    };


    return (
        values[audience] ||
        "Everyone"
    );

}


function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";

    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

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


function escapeAttribute(
    value
) {

    return escapeHtml(value);

}


/* =====================================================
   GLOBAL
===================================================== */

window.loadAnnouncements =
    loadAnnouncements;

window.deleteAnnouncement =
    deleteAnnouncement;

window.openAnnouncementForm =
    openAnnouncementForm;

window.closeAnnouncementForm =
    closeAnnouncementForm;
