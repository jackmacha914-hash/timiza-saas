const API = "https://timiza-saas.onrender.com/api";

let disciplineCases = [];
let students = [];
let classes = [];


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeDiscipline
);

function initializeDiscipline() {

    console.log(
        "[DISCIPLINE] Initializing page..."
    );

    // CREATE MODAL
    document
        .getElementById("openDisciplineBtn")
        ?.addEventListener(
            "click",
            openDisciplineModal
        );

    document
        .getElementById("closeDisciplineModal")
        ?.addEventListener(
            "click",
            closeDisciplineModal
        );

    document
        .getElementById("cancelDisciplineBtn")
        ?.addEventListener(
            "click",
            closeDisciplineModal
        );

    document
        .getElementById("disciplineForm")
        ?.addEventListener(
            "submit",
            createDiscipline
        );


    // EDIT MODAL
    document
        .getElementById("closeEditDisciplineModal")
        ?.addEventListener(
            "click",
            closeEditDisciplineModal
        );

    document
        .getElementById("cancelEditDisciplineBtn")
        ?.addEventListener(
            "click",
            closeEditDisciplineModal
        );

    document
        .getElementById("editDisciplineForm")
        ?.addEventListener(
            "submit",
            updateDisciplineCase
        );


    // REFRESH
    document
        .getElementById("refreshDisciplineBtn")
        ?.addEventListener(
            "click",
            loadDiscipline
        );


    // FILTERS
    document
        .getElementById("disciplineSearch")
        ?.addEventListener(
            "input",
            renderDiscipline
        );

    document
        .getElementById("severityFilter")
        ?.addEventListener(
            "change",
            renderDiscipline
        );

    document
        .getElementById("statusFilter")
        ?.addEventListener(
            "change",
            renderDiscipline
        );


    // CREATE FORM CLASS/STUDENT
    document
        .getElementById("classFilter")
        ?.addEventListener(
            "change",
            handleClassChange
        );

    document
        .getElementById("student")
        ?.addEventListener(
            "change",
            handleStudentChange
        );


    // OTHER MODALS
    document
        .getElementById("closeStudentHistoryModal")
        ?.addEventListener(
            "click",
            closeStudentHistory
        );

    document
        .getElementById("closeDisciplineDetailsModal")
        ?.addEventListener(
            "click",
            closeDisciplineDetails
        );


    // OVERLAYS
    document
        .getElementById("disciplineDetailsOverlay")
        ?.addEventListener(
            "click",
            closeDisciplineDetails
        );

    document
        .getElementById("editDisciplineOverlay")
        ?.addEventListener(
            "click",
            closeEditDisciplineModal
        );


    loadDiscipline();

    loadStudents();
}


// =====================================================
// TOKEN
// =====================================================

function getToken() {

    return localStorage.getItem(
        "token"
    );
}


// =====================================================
// API
// =====================================================

async function api(
    url,
    options = {}
) {

    const token =
        getToken();

    if (!token) {
        throw new Error(
            "Authentication required."
        );
    }

    const response =
        await fetch(
            `${API}${url}`,
            {
                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`,

                    ...(options.headers || {})
                }
            }
        );

    const data =
        await response
            .json()
            .catch(
                () => ({})
            );

    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

    const studentSelect =
        document.getElementById(
            "student"
        );

    const classSelect =
        document.getElementById(
            "classFilter"
        );

    if (!studentSelect) {
        return;
    }

    studentSelect.innerHTML = `
        <option value="">
            Loading students...
        </option>
    `;

    studentSelect.disabled =
        true;

    if (classSelect) {

        classSelect.innerHTML = `
            <option value="">
                Loading classes...
            </option>
        `;
    }

    try {

        const response =
            await api(
                "/students"
            );

        students =
            Array.isArray(response)
                ? response
                : response.students ||
                  response.users ||
                  response.data ||
                  [];


        const classMap =
            new Map();


        students.forEach(
            student => {

                const className =
                    getStudentClass(
                        student
                    );

                if (!className) {
                    return;
                }

                const normalized =
                    String(
                        className
                    ).trim();

                if (!normalized) {
                    return;
                }

                const key =
                    normalized.toLowerCase();

                if (
                    !classMap.has(key)
                ) {

                    classMap.set(
                        key,
                        normalized
                    );
                }
            }
        );


        classes =
            Array
                .from(
                    classMap.values()
                )
                .sort(
                    naturalClassSort
                );


        if (classSelect) {

            classSelect.innerHTML = `
                <option value="">
                    Select class
                </option>
            `;

            classes.forEach(
                className => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        className;

                    option.textContent =
                        className;

                    classSelect.appendChild(
                        option
                    );
                }
            );


            if (!classes.length) {

                classSelect.innerHTML = `
                    <option value="">
                        No classes found
                    </option>
                `;
            }
        }


        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;

        studentSelect.disabled =
            true;

    } catch (error) {

        console.error(
            "[DISCIPLINE STUDENTS LOAD]",
            error
        );

        studentSelect.innerHTML = `
            <option value="">
                Failed to load students
            </option>
        `;

        if (classSelect) {

            classSelect.innerHTML = `
                <option value="">
                    Failed to load classes
                </option>
            `;
        }
    }
}


// =====================================================
// GET STUDENT CLASS
// =====================================================

function getStudentClass(
    student
) {

    if (!student) {
        return "";
    }

    return (
        student.class ||
        student.classAssigned ||
        student.className ||
        student.profile?.class ||
        student.profile?.className ||
        student.classId?.name ||
        student.classId?.className ||
        student.form ||
        ""
    );
}


// =====================================================
// SORT CLASSES
// =====================================================

function naturalClassSort(
    a,
    b
) {

    return String(a).localeCompare(
        String(b),
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );
}


// =====================================================
// CLASS CHANGED
// =====================================================

function handleClassChange(
    event
) {

    const selectedClass =
        event.target.value;

    const studentSelect =
        document.getElementById(
            "student"
        );

    if (!studentSelect) {
        return;
    }

    studentSelect.innerHTML = `
        <option value="">
            Select student
        </option>
    `;

    studentSelect.disabled =
        true;


    setInputValue(
        "admissionNumber",
        ""
    );

    setInputValue(
        "className",
        selectedClass || ""
    );


    if (!selectedClass) {

        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;

        return;
    }


    const filteredStudents =
        students.filter(
            student => {

                const studentClass =
                    getStudentClass(
                        student
                    );

                return (
                    String(
                        studentClass
                    )
                    .trim()
                    .toLowerCase() ===
                    String(
                        selectedClass
                    )
                    .trim()
                    .toLowerCase()
                );
            }
        );


    if (!filteredStudents.length) {

        studentSelect.innerHTML = `
            <option value="">
                No students in this class
            </option>
        `;

        return;
    }


    filteredStudents.forEach(
        student => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                student._id ||
                student.id;


            const name =
                student.name ||
                student.fullName ||
                student.username ||
                "Unnamed Student";


            const admission =
                student.admissionNumber ||
                "";


            option.textContent =
                admission
                    ? `${name} — ${admission}`
                    : name;


            studentSelect.appendChild(
                option
            );
        }
    );


    studentSelect.disabled =
        false;
}


// =====================================================
// STUDENT SELECTED
// =====================================================

function handleStudentChange(
    event
) {

    const studentId =
        event.target.value;

    const student =
        students.find(
            item =>
                String(
                    item._id ||
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (!student) {
        return;
    }


    setInputValue(
        "admissionNumber",
        student.admissionNumber ||
        ""
    );


    setInputValue(
        "className",
        getStudentClass(
            student
        )
    );
}


// =====================================================
// LOAD DISCIPLINE
// =====================================================

async function loadDiscipline() {

    const list =
        document.getElementById(
            "disciplineList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            Loading discipline records...
        </div>
    `;


    try {

        const response =
            await api(
                "/discipline"
            );


        disciplineCases =
            Array.isArray(response)
                ? response
                : response.discipline ||
                  response.data ||
                  [];


        renderDiscipline();

        updateStatistics();

    } catch (error) {

        console.error(
            "[DISCIPLINE LOAD]",
            error
        );

        list.innerHTML = `
            <div class="error-state">

                <i class="fas fa-exclamation-circle"></i>

                <h3>
                    Unable to load records
                </h3>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}

// =====================================================
// GET REPORTER NAME
// =====================================================

function getReporterName(reportedBy) {

    // -----------------------------------------------
    // Populated User object
    // -----------------------------------------------
    if (
        reportedBy &&
        typeof reportedBy === "object"
    ) {

        return (
            String(reportedBy.name || "").trim() ||
            String(reportedBy.fullName || "").trim() ||
            String(reportedBy.username || "").trim() ||
            String(reportedBy.email || "").trim() ||
            "Administrator"
        );
    }


    // -----------------------------------------------
    // Old records may contain a plain string
    // -----------------------------------------------
    if (typeof reportedBy === "string") {

        const value = reportedBy.trim();

        if (value) {

            // If this is a MongoDB ID,
            // return it for now rather than crashing.
            if (
                /^[a-f\d]{24}$/i.test(value)
            ) {

                return value;
            }

            return value;
        }
    }


    // -----------------------------------------------
    // Missing reporter
    // -----------------------------------------------
    return "Administrator";
}


// =====================================================
// RENDER DISCIPLINE
// =====================================================

function renderDiscipline() {

    const list =
        document.getElementById(
            "disciplineList"
        );

    if (!list) {
        return;
    }


    const search =
        (
            document.getElementById(
                "disciplineSearch"
            )?.value || ""
        )
        .toLowerCase()
        .trim();


    const severity =
        document.getElementById(
            "severityFilter"
        )?.value || "";


    const status =
        document.getElementById(
            "statusFilter"
        )?.value || "";


    const filtered =
        disciplineCases.filter(
            item => {

                const student =
                    item.student?.name ||
                    item.student?.fullName ||
                    item.studentName ||
                    "";


                const matchesSearch =
                    !search ||
                    student
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        item.category || ""
                    )
                    .toLowerCase()
                    .includes(search) ||
                    String(
                        item.description || ""
                    )
                    .toLowerCase()
                    .includes(search);


                const matchesSeverity =
                    !severity ||
                    item.severity ===
                    severity;


                const matchesStatus =
                    !status ||
                    item.status ===
                    status;


                return (
                    matchesSearch &&
                    matchesSeverity &&
                    matchesStatus
                );
            }
        );


    list.innerHTML = "";


    if (!filtered.length) {

        list.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-gavel"></i>

                <h3>
                    No discipline records found
                </h3>

                <p>
                    No records match your current filters.
                </p>

            </div>
        `;

        return;
    }


    filtered.forEach(
        item => {

            list.appendChild(
                createDisciplineCard(
                    item
                )
            );
        }
    );
}


// =====================================================
// DISCIPLINE CARD
// =====================================================

function createDisciplineCard(
    item
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "discipline-record";


    const student =
        item.student?.name ||
        item.student?.fullName ||
        item.studentName ||
        "Unknown Student";


    const studentId =
        item.student?._id ||
        item.student?.id ||
        item.studentId ||
        "";


    const severity =
        item.severity ||
        "low";


    const status =
        formatStatus(
            item.status
        );


    card.innerHTML = `

        <div class="record-severity ${escapeHtml(severity)}">
            ${escapeHtml(
                severity.toUpperCase()
            )}
        </div>


        <div class="record-main">


            <div class="record-header">

                <div>

                    <h3>
                        ${escapeHtml(student)}
                    </h3>

                    <span>
                        ${escapeHtml(
                            item.admissionNumber ||
                            item.student?.admissionNumber ||
                            "No admission number"
                        )}
                    </span>

                </div>


                <span class="status-badge">
                    ${escapeHtml(status)}
                </span>

            </div>


            <div class="record-details">

                <div>

                    <i class="fas fa-gavel"></i>

                    <strong>
                        ${escapeHtml(
                            item.category || ""
                        )}
                    </strong>

                </div>


                <div>

                    <i class="fas fa-calendar"></i>

                    ${formatDate(
                        item.incidentDate
                    )}

                </div>

            </div>


            <p class="record-description">

                ${escapeHtml(
                    item.description || ""
                )}

            </p>


            ${
                item.actionTaken
                    ? `
                        <div class="action-taken">

                            <strong>
                                Action Taken:
                            </strong>

                            ${escapeHtml(
                                item.actionTaken
                            )}

                        </div>
                    `
                    : ""
            }


            <div class="record-footer">

                <span>

                    Reported by
${escapeHtml(
    getReporterName(item.reportedBy)
)}

                </span>


                <div class="record-actions">

                    <button
                        type="button"
                        class="view-details-btn"
                    >

                        <i class="fas fa-eye"></i>

                        View Details

                    </button>


                    ${
                        studentId
                            ? `
                                <button
                                    type="button"
                                    class="view-history-btn"
                                >

                                    <i class="fas fa-clock-rotate-left"></i>

                                    View History

                                </button>
                            `
                            : ""
                    }

                </div>

            </div>

        </div>
    `;


    card
        .querySelector(
            ".view-details-btn"
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                openDisciplineDetails(
                    item
                );
            }
        );


    card
        .querySelector(
            ".view-history-btn"
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                openStudentHistory(
                    studentId,
                    student
                );
            }
        );


    return card;
}


// =====================================================
// OPEN DISCIPLINE DETAILS
// =====================================================

function openDisciplineDetails(
    item
) {

    const modal =
        document.getElementById(
            "disciplineDetailsModal"
        );

    const content =
        document.getElementById(
            "disciplineDetailsContent"
        );


    if (!modal || !content) {
        return;
    }


    const student =
        item.student?.name ||
        item.student?.fullName ||
        item.studentName ||
        "Unknown Student";


    const admissionNumber =
        item.admissionNumber ||
        item.student?.admissionNumber ||
        "Not available";


    const className =
        item.className ||
        item.student?.className ||
        item.student?.class ||
        "Not available";


    const severity =
        item.severity ||
        "low";


    const status =
        item.status ||
        "reported";


    content.innerHTML = `

        <div class="case-details-header">


            <div class="case-student">

                <div class="case-avatar">
                    <i class="fas fa-user"></i>
                </div>


                <div>

                    <h3>
                        ${escapeHtml(student)}
                    </h3>

                    <p>
                        Admission:
                        ${escapeHtml(
                            admissionNumber
                        )}
                    </p>

                    <p>
                        Class:
                        ${escapeHtml(
                            className
                        )}
                    </p>

                </div>

            </div>


            <div class="case-badges">

                <span
                    class="history-severity ${escapeHtml(
                        severity
                    )}"
                >

                    ${escapeHtml(
                        severity.toUpperCase()
                    )}

                </span>


                <span
                    class="history-status ${escapeHtml(
                        status.replaceAll(
                            "_",
                            "-"
                        )
                    )}"
                >

                    ${escapeHtml(
                        formatStatus(
                            status
                        )
                    )}

                </span>

            </div>

        </div>


        <div class="case-details-grid">


            <div class="case-detail-card">

                <span>
                    Incident Category
                </span>

                <strong>
                    ${escapeHtml(
                        item.category ||
                        "Not specified"
                    )}
                </strong>

            </div>


            <div class="case-detail-card">

                <span>
                    Incident Date
                </span>

                <strong>
                    ${formatDate(
                        item.incidentDate
                    )}
                </strong>

            </div>


            <div class="case-detail-card">

                <span>
                    Reported By
                </span>
                <strong>
    ${escapeHtml(
        getReporterName(item.reportedBy)
    )}
</strong>


            </div>


            <div class="case-detail-card">

                <span>
                    Case Status
                </span>

                <strong>
                    ${escapeHtml(
                        formatStatus(
                            status
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="case-detail-section">

            <h4>

                <i class="fas fa-file-lines"></i>

                Incident Description

            </h4>

            <p>
                ${escapeHtml(
                    item.description ||
                    "No description provided."
                )}
            </p>

        </div>


        <div class="case-detail-section">

            <h4>

                <i class="fas fa-gavel"></i>

                Action Taken

            </h4>

            <p>
                ${escapeHtml(
                    item.actionTaken ||
                    "No action recorded."
                )}
            </p>

        </div>


        ${
            item.investigationNotes
                ? `
                    <div class="case-detail-section">

                        <h4>

                            <i class="fas fa-magnifying-glass"></i>

                            Investigation Notes

                        </h4>

                        <p>

                            ${escapeHtml(
                                item.investigationNotes
                            )}

                        </p>

                    </div>
                `
                : ""
        }


        ${
            item.resolution
                ? `
                    <div class="case-detail-section">

                        <h4>

                            <i class="fas fa-circle-check"></i>

                            Resolution

                        </h4>

                        <p>

                            ${escapeHtml(
                                item.resolution
                            )}

                        </p>

                    </div>
                `
                : ""
        }


        ${
            item.followUpDate
                ? `
                    <div class="case-detail-section">

                        <h4>

                            <i class="fas fa-calendar-check"></i>

                            Follow-up Date

                        </h4>

                        <p>

                            ${formatDate(
                                item.followUpDate
                            )}

                        </p>

                    </div>
                `
                : ""
        }


        <div class="case-detail-section">

            <h4>

                <i class="fas fa-user-shield"></i>

                Parent Notification

            </h4>

            <p>

                ${
                    item.parentNotified
                        ? "Parent/Guardian has been notified."
                        : "Parent/Guardian has not been notified."
                }

            </p>

        </div>


        <div class="case-details-actions">


            <button
                type="button"
                class="secondary-btn"
                id="closeDisciplineDetailsBtn"
            >
                Close
            </button>


            <button
                type="button"
                class="primary-btn"
                id="editDisciplineCaseBtn"
            >

                <i class="fas fa-pen"></i>

                Edit Case

            </button>

        </div>
    `;


    modal.classList.add(
        "is-open"
    );

    modal.style.display =
        "flex";

    modal.style.visibility =
        "visible";

    modal.style.opacity =
        "1";

    document.body.classList.add(
        "modal-open"
    );


    document
        .getElementById(
            "closeDisciplineDetailsBtn"
        )
        ?.addEventListener(
            "click",
            closeDisciplineDetails
        );


    document
        .getElementById(
            "editDisciplineCaseBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                editDisciplineCase(
                    item
                );
            }
        );
}


// =====================================================
// CLOSE DETAILS
// =====================================================

function closeDisciplineDetails() {

    const modal =
        document.getElementById(
            "disciplineDetailsModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "is-open"
    );

    modal.style.display =
        "none";

    modal.style.visibility =
        "hidden";

    modal.style.opacity =
        "0";

    document.body.classList.remove(
        "modal-open"
    );
}


// =====================================================
// OPEN EDIT DISCIPLINE CASE
// =====================================================

function editDisciplineCase(
    item
) {

    if (!item) {

        showToast(
            "Discipline case could not be found.",
            "error"
        );

        return;
    }


    const caseId =
        item._id ||
        item.id;


    if (!caseId) {

        showToast(
            "This discipline case has no ID.",
            "error"
        );

        return;
    }


    const modal =
        document.getElementById(
            "editDisciplineModal"
        );

    const form =
        document.getElementById(
            "editDisciplineForm"
        );


    if (!modal || !form) {

        showToast(
            "Edit discipline form could not be found.",
            "error"
        );

        return;
    }


    console.log(
        "[DISCIPLINE EDIT] Opening case:",
        caseId
    );


    // -------------------------------------------------
    // STORE CASE ID
    // -------------------------------------------------

    setInputValue(
        "editDisciplineId",
        caseId
    );


    // -------------------------------------------------
    // STUDENT
    // -------------------------------------------------

    const studentName =
        item.student?.name ||
        item.student?.fullName ||
        item.studentName ||
        "Unknown Student";


    const admissionNumber =
        item.admissionNumber ||
        item.student?.admissionNumber ||
        "";


    setInputValue(
        "editStudentName",
        studentName
    );


    setInputValue(
        "editAdmissionNumber",
        admissionNumber
    );


    // -------------------------------------------------
    // CATEGORY
    // -------------------------------------------------

    setInputValue(
        "editCategory",
        item.category ||
        ""
    );


    // -------------------------------------------------
    // SEVERITY
    // -------------------------------------------------

    setInputValue(
        "editSeverity",
        item.severity ||
        "low"
    );


    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    setInputValue(
        "editStatus",
        item.status ||
        "reported"
    );


    // -------------------------------------------------
    // INCIDENT DATE
    // -------------------------------------------------

    setInputValue(
        "editIncidentDate",
        formatDateForInput(
            item.incidentDate
        )
    );


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    setInputValue(
        "editDescription",
        item.description ||
        ""
    );


    // -------------------------------------------------
    // INVESTIGATION NOTES
    // -------------------------------------------------

    setInputValue(
        "editInvestigationNotes",
        item.investigationNotes ||
        ""
    );


    // -------------------------------------------------
    // ACTION TAKEN
    // -------------------------------------------------

    setInputValue(
        "editActionTaken",
        item.actionTaken ||
        ""
    );


    // -------------------------------------------------
    // RESOLUTION
    // -------------------------------------------------

    setInputValue(
        "editResolution",
        item.resolution ||
        ""
    );


    // -------------------------------------------------
    // FOLLOW-UP DATE
    // -------------------------------------------------

    setInputValue(
        "editFollowUpDate",
        formatDateForInput(
            item.followUpDate
        )
    );


    // -------------------------------------------------
    // PARENT NOTIFIED
    // -------------------------------------------------

    const parentNotified =
        item.parentNotified === true ||
        item.parentNotified === "true";


    setInputValue(
        "editParentNotified",
        parentNotified
            ? "true"
            : "false"
    );


    // -------------------------------------------------
    // CLOSE DETAILS MODAL
    // -------------------------------------------------

    closeDisciplineDetails();


    // -------------------------------------------------
    // OPEN EDIT MODAL
    // -------------------------------------------------

    modal.classList.add(
        "is-open"
    );

    modal.style.display =
        "flex";

    modal.style.visibility =
        "visible";

    modal.style.opacity =
        "1";


    document.body.classList.add(
        "modal-open"
    );


    // -------------------------------------------------
    // FOCUS
    // -------------------------------------------------

    setTimeout(
        () => {

            document
                .getElementById(
                    "editCategory"
                )
                ?.focus();

        },
        100
    );
}


// =====================================================
// UPDATE DISCIPLINE CASE
// =====================================================

async function updateDisciplineCase(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveEditDisciplineBtn"
        );


    const caseId =
        document.getElementById(
            "editDisciplineId"
        )?.value;


    if (!caseId) {

        showToast(
            "Discipline case ID is missing.",
            "error"
        );

        return;
    }


    const payload = {

        category:
            document.getElementById(
                "editCategory"
            )?.value || "",


        severity:
            document.getElementById(
                "editSeverity"
            )?.value || "low",


        status:
            document.getElementById(
                "editStatus"
            )?.value || "reported",


        incidentDate:
            document.getElementById(
                "editIncidentDate"
            )?.value || "",


        description:
            document.getElementById(
                "editDescription"
            )?.value.trim() || "",


        investigationNotes:
            document.getElementById(
                "editInvestigationNotes"
            )?.value.trim() || "",


        actionTaken:
            document.getElementById(
                "editActionTaken"
            )?.value.trim() || "",


        resolution:
            document.getElementById(
                "editResolution"
            )?.value.trim() || "",


        followUpDate:
            document.getElementById(
                "editFollowUpDate"
            )?.value || "",


        parentNotified:
            document.getElementById(
                "editParentNotified"
            )?.value === "true"
    };


    console.log(
        "[DISCIPLINE EDIT] Updating:",
        caseId,
        payload
    );


    try {

        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Saving Changes...
            `;
        }


        /*
         * Expected backend route:
         *
         * PUT /api/discipline/:id
         *
         */

        const response =
            await api(
                `/discipline/${encodeURIComponent(
                    caseId
                )}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        console.log(
            "[DISCIPLINE EDIT] Response:",
            response
        );


        showToast(
            response.message ||
            "Discipline case updated successfully.",
            "success"
        );


        closeEditDisciplineModal();


        await loadDiscipline();


    } catch (error) {

        console.error(
            "[DISCIPLINE UPDATE]",
            error
        );


        showToast(
            error.message ||
            "Failed to update discipline case.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML = `
                <i class="fas fa-save"></i>
                Save Changes
            `;
        }
    }
}


// =====================================================
// CLOSE EDIT MODAL
// =====================================================

function closeEditDisciplineModal() {

    const modal =
        document.getElementById(
            "editDisciplineModal"
        );


    const form =
        document.getElementById(
            "editDisciplineForm"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "is-open"
    );


    modal.style.display =
        "none";

    modal.style.visibility =
        "hidden";

    modal.style.opacity =
        "0";


    document.body.classList.remove(
        "modal-open"
    );


    form?.reset();


    setInputValue(
        "editDisciplineId",
        ""
    );
}


// =====================================================
// OPEN CREATE MODAL
// =====================================================

function openDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    const form =
        document.getElementById(
            "disciplineForm"
        );


    if (!modal || !form) {

        showToast(
            "Discipline modal could not be found.",
            "error"
        );

        return;
    }


    // Make sure this is CREATE mode.
    delete form.dataset.editingId;


    modal.classList.add(
        "is-open"
    );

    modal.style.display =
        "flex";

    modal.style.visibility =
        "visible";

    modal.style.opacity =
        "1";


    document.body.classList.add(
        "modal-open"
    );


    const incidentDate =
        document.getElementById(
            "incidentDate"
        );


    if (
        incidentDate &&
        !incidentDate.value
    ) {

        incidentDate.value =
            new Date()
                .toISOString()
                .split("T")[0];
    }
}


// =====================================================
// CLOSE CREATE MODAL
// =====================================================

function closeDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    const form =
        document.getElementById(
            "disciplineForm"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "is-open"
    );


    modal.style.display =
        "none";

    modal.style.visibility =
        "hidden";

    modal.style.opacity =
        "0";


    document.body.classList.remove(
        "modal-open"
    );


    form?.reset();


    delete form?.dataset.editingId;


    const studentSelect =
        document.getElementById(
            "student"
        );


    if (studentSelect) {

        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;

        studentSelect.disabled =
            true;
    }
}


// =====================================================
// CREATE DISCIPLINE
// =====================================================

async function createDiscipline(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveDisciplineBtn"
        );


    const payload = {

        student:
            document.getElementById(
                "student"
            )?.value || "",


        admissionNumber:
            document.getElementById(
                "admissionNumber"
            )?.value.trim() || "",


        className:
            document.getElementById(
                "className"
            )?.value.trim() || "",


        category:
            document.getElementById(
                "category"
            )?.value || "",


        severity:
            document.getElementById(
                "severity"
            )?.value || "low",


        incidentDate:
            document.getElementById(
                "incidentDate"
            )?.value || "",


        description:
            document.getElementById(
                "description"
            )?.value.trim() || "",


        actionTaken:
            document.getElementById(
                "actionTaken"
            )?.value.trim() || ""
    };


    if (!payload.student) {

        showToast(
            "Please select a student.",
            "error"
        );

        return;
    }


    try {

        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Saving...
            `;
        }


        const response =
            await api(
                "/discipline",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        showToast(
            response.message ||
            "Discipline case recorded.",
            "success"
        );


        closeDisciplineModal();


        await loadDiscipline();


    } catch (error) {

        console.error(
            "[DISCIPLINE CREATE]",
            error
        );


        showToast(
            error.message ||
            "Failed to record incident.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML = `
                <i class="fas fa-save"></i>
                Save Incident
            `;
        }
    }
}


// =====================================================
// STUDENT HISTORY
// =====================================================

async function openStudentHistory(
    studentId,
    studentName = "Student"
) {

    const modal =
        document.getElementById(
            "studentHistoryModal"
        );


    const timeline =
        document.getElementById(
            "studentHistoryTimeline"
        );


    if (!modal || !timeline) {
        return;
    }


    modal.classList.add(
        "is-open"
    );


    modal.style.display =
        "flex";

    modal.style.visibility =
        "visible";

    modal.style.opacity =
        "1";


    document.body.classList.add(
        "modal-open"
    );


    const info =
        document.getElementById(
            "historyStudentInfo"
        );


    if (info) {
        info.textContent =
            studentName;
    }


    timeline.innerHTML = `
        <div class="loading-state">

            <i class="fas fa-spinner fa-spin"></i>

            Loading discipline history...

        </div>
    `;


    const history =
        disciplineCases.filter(
            item => {

                const id =
                    item.student?._id ||
                    item.student?.id ||
                    item.studentId ||
                    item.student;


                return (
                    id &&
                    String(id) ===
                    String(studentId)
                );
            }
        );


    const sortedHistory =
        history
            .slice()
            .sort(
                (a, b) =>
                    new Date(
                        b.incidentDate || 0
                    ) -
                    new Date(
                        a.incidentDate || 0
                    )
            );


    timeline.innerHTML =
        sortedHistory.length
            ? sortedHistory
                .map(
                    buildHistoryItem
                )
                .join("")
            : `
                <div class="history-empty">

                    <i class="fas fa-circle-check"></i>

                    <h3>
                        No discipline incidents
                    </h3>

                    <p>
                        This student has no recorded
                        discipline cases.
                    </p>

                </div>
            `;


    const total =
        history.length;


    const minor =
        history.filter(
            item =>
                item.severity === "low" ||
                item.severity === "medium"
        ).length;


    const serious =
        history.filter(
            item =>
                item.severity === "high" ||
                item.severity === "critical"
        ).length;


    const resolved =
        history.filter(
            item =>
                item.status === "resolved"
        ).length;


    const open =
        history.filter(
            item =>
                item.status !== "resolved" &&
                item.status !== "dismissed"
        ).length;


    setText(
        "historyTotalCases",
        total
    );

    setText(
        "historyMinorCases",
        minor
    );

    setText(
        "historySeriousCases",
        serious
    );

    setText(
        "historyResolvedCases",
        resolved
    );

    setText(
        "historyOpenCases",
        open
    );
}


// =====================================================
// HISTORY ITEM
// =====================================================

function buildHistoryItem(
    item
) {

    const severity =
        item.severity ||
        "low";


    const status =
        item.status ||
        "reported";


    return `

        <div
            class="discipline-history-item"
            data-case-id="${escapeHtml(
                item._id ||
                item.id ||
                ""
            )}"
        >

            <span class="history-date">

                ${formatDate(
                    item.incidentDate
                )}

            </span>


            <div class="history-incident">


                <div class="history-incident-header">

                    <div>

                        <h4>

                            ${escapeHtml(
                                item.category ||
                                "Discipline Incident"
                            )}

                        </h4>

                    </div>


                    <div class="history-badges">

                        <span
                            class="history-status ${escapeHtml(
                                status.replaceAll(
                                    "_",
                                    "-"
                                )
                            )}"
                        >

                            ${escapeHtml(
                                formatStatus(
                                    status
                                )
                            )}

                        </span>


                        <span
                            class="history-severity ${escapeHtml(
                                severity
                            )}"
                        >

                            ${escapeHtml(
                                severity.toUpperCase()
                            )}

                        </span>

                    </div>

                </div>


                <p class="history-incident-description">

                    ${escapeHtml(
                        item.description ||
                        "No description provided."
                    )}

                </p>


                <div class="history-details">


                    ${
                        item.resolution
                            ? `
                                <div class="history-detail">

                                    <strong>
                                        Resolution
                                    </strong>

                                    ${escapeHtml(
                                        item.resolution
                                    )}

                                </div>
                            `
                            : ""
                    }


                    ${
                        item.followUpDate
                            ? `
                                <div class="history-detail">

                                    <strong>
                                        Follow-up Date
                                    </strong>

                                    ${formatDate(
                                        item.followUpDate
                                    )}

                                </div>
                            `
                            : ""
                    }


                    ${
                        item.investigationNotes
                            ? `
                                <div class="history-detail">

                                    <strong>
                                        Investigation Notes
                                    </strong>

                                    ${escapeHtml(
                                        item.investigationNotes
                                    )}

                                </div>
                            `
                            : ""
                    }


                    ${
                        item.parentNotified !==
                        undefined
                            ? `
                                <div class="history-detail">

                                    <strong>
                                        Parent Notification
                                    </strong>

                                    ${
                                        item.parentNotified
                                            ? "Parent notified"
                                            : "Not notified"
                                    }

                                </div>
                            `
                            : ""
                    }

                </div>


                ${
                    item.actionTaken
                        ? `
                            <div class="history-action">

                                <strong>
                                    Action Taken:
                                </strong>

                                ${escapeHtml(
                                    item.actionTaken
                                )}

                            </div>
                        `
                        : ""
                }


                <div class="history-handler">

                    <strong>
                        Handled by:
                    </strong>

                    ${escapeHtml(
    item.handledBy ||
    getReporterName(item.reportedBy)
)}

                </div>

            </div>

        </div>
    `;
}


// =====================================================
// CLOSE HISTORY
// =====================================================

function closeStudentHistory() {

    const modal =
        document.getElementById(
            "studentHistoryModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "is-open"
    );


    modal.style.display =
        "none";

    modal.style.visibility =
        "hidden";

    modal.style.opacity =
        "0";


    document.body.classList.remove(
        "modal-open"
    );
}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    setText(
        "totalCases",
        disciplineCases.length
    );


    setText(
        "investigationCases",
        disciplineCases.filter(
            item =>
                item.status ===
                "under_investigation"
        ).length
    );


    setText(
        "seriousCases",
        disciplineCases.filter(
            item =>
                item.severity === "high" ||
                item.severity === "critical"
        ).length
    );


    setText(
        "resolvedCases",
        disciplineCases.filter(
            item =>
                item.status === "resolved"
        ).length
    );
}


// =====================================================
// SET INPUT VALUE
// =====================================================

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";
}


// =====================================================
// DATE FOR INPUT
// =====================================================

function formatDateForInput(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return date
        .toISOString()
        .split("T")[0];
}


// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
    status
) {

    return String(
        status || ""
    )
    .replaceAll(
        "_",
        " "
    )
    .replace(
        /\b\w/g,
        char =>
            char.toUpperCase()
    );
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    value
) {

    if (!value) {
        return "Unknown date";
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {
        return "Unknown date";
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        String(value);
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );
}


// =====================================================
// TOAST
// =====================================================

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "disciplineToastContainer"
        );


    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.innerHTML = `

        <i class="fas ${
            type === "success"
                ? "fa-check-circle"
                : "fa-exclamation-circle"
        }"></i>

        <span>
            ${escapeHtml(message)}
        </span>
    `;


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
