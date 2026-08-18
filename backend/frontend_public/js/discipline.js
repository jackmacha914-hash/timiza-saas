const API =
    "https://timiza-saas.onrender.com/api";

let disciplineCases = [];
let students = [];


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


    document
        .getElementById("refreshDisciplineBtn")
        ?.addEventListener(
            "click",
            loadDiscipline
        );


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

    document
    .getElementById("student")
    ?.addEventListener(
        "change",
        handleStudentChange
    );


    loadDiscipline();
    loadStudents();

}

// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

    const select =
        document.getElementById("student");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Loading students...
        </option>
    `;

    try {

        console.log("[DISCIPLINE] Loading students...");

        const response =
            await api("/students");

        console.log(
            "[DISCIPLINE] Students response:",
            response
        );

        students =
            Array.isArray(response)
                ? response
                : response.students ||
                  response.users ||
                  response.data ||
                  [];

        if (!students.length) {

            select.innerHTML = `
                <option value="">
                    No students found
                </option>
            `;

            console.warn(
                "[DISCIPLINE] No students returned"
            );

            return;
        }

        select.innerHTML = `
            <option value="">
                Select student
            </option>
        `;

        students.forEach(student => {

            const option =
                document.createElement("option");

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

            select.appendChild(option);

        });

        console.log(
            `[DISCIPLINE] Loaded ${students.length} students`
        );

    } catch (error) {

        console.error(
            "[DISCIPLINE STUDENTS LOAD]",
            error
        );

        select.innerHTML = `
            <option value="">
                Failed to load students
            </option>
        `;

    }

}

// =====================================================
// STUDENT SELECTED
// =====================================================

function handleStudentChange(event) {

    const studentId =
        event.target.value;

    const student =
        students.find(
            item =>
                String(item._id || item.id) ===
                String(studentId)
        );

    if (!student) {
        return;
    }

    document.getElementById(
        "admissionNumber"
    ).value =
        student.admissionNumber || "";

    document.getElementById(
        "className"
    ).value =
        student.className ||
        student.class ||
        student.className?.name ||
        "";

}


// =====================================================
// TOKEN
// =====================================================

function getToken() {

    return localStorage.getItem("token");

}


// =====================================================
// API
// =====================================================

async function api(
    url,
    options = {}
) {

    const token = getToken();

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
        await response.json()
            .catch(() => ({}));


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
// LOAD
// =====================================================

async function loadDiscipline() {

    const list =
        document.getElementById(
            "disciplineList"
        );


    if (!list) return;


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
                : response.discipline || [];


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
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    }

}


// =====================================================
// RENDER
// =====================================================

function renderDiscipline() {

    const list =
        document.getElementById(
            "disciplineList"
        );


    if (!list) return;


    const search =
        (
            document.getElementById(
                "disciplineSearch"
            )?.value || ""
        )
        .toLowerCase();


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
                    "";


                const matchesSearch =
                    !search ||
                    student.toLowerCase()
                        .includes(search) ||
                    item.category
                        ?.toLowerCase()
                        .includes(search) ||
                    item.description
                        ?.toLowerCase()
                        .includes(search);


                const matchesSeverity =
                    !severity ||
                    item.severity === severity;


                const matchesStatus =
                    !status ||
                    item.status === status;


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
                createDisciplineCard(item)
            );

        }
    );

}


// =====================================================
// CARD
// =====================================================

function createDisciplineCard(item) {

    const card =
        document.createElement("article");


    card.className =
        "discipline-record";


    const student =
        item.student?.name ||
        item.student?.fullName ||
        "Unknown Student";


    const severity =
        item.severity ||
        "low";


    const status =
        formatStatus(
            item.status
        );


    card.innerHTML = `

        <div class="record-severity ${severity}">
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
                            item.category
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
                    item.description
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

                Reported by
                ${escapeHtml(
                    item.reportedBy ||
                    "Administrator"
                )}

            </div>

        </div>

    `;


    return card;

}


// =====================================================
// CREATE
// =====================================================

async function createDiscipline(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveDisciplineBtn"
        );


    const payload = {

        student:
            document.getElementById(
                "student"
            ).value,

        admissionNumber:
            document.getElementById(
                "admissionNumber"
            ).value.trim(),

        className:
            document.getElementById(
                "className"
            ).value.trim(),

        category:
            document.getElementById(
                "category"
            ).value,

        severity:
            document.getElementById(
                "severity"
            ).value,

        incidentDate:
            document.getElementById(
                "incidentDate"
            ).value,

        description:
            document.getElementById(
                "description"
            ).value.trim(),

        actionTaken:
            document.getElementById(
                "actionTaken"
            ).value.trim()

    };


    try {

        button.disabled = true;

        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Saving...

        `;


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

        button.disabled = false;

        button.innerHTML = `

            <i class="fas fa-save"></i>

            Save Incident

        `;

    }

}


// =====================================================
// MODAL
// =====================================================

function openDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    if (!modal) return;


    modal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );


    document.getElementById(
        "incidentDate"
    ).value =
        new Date()
            .toISOString()
            .split("T")[0];

}


function closeDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    if (!modal) return;


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    document.getElementById(
        "disciplineForm"
    )?.reset();

}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    document.getElementById(
        "totalCases"
    ).textContent =
        disciplineCases.length;


    document.getElementById(
        "investigationCases"
    ).textContent =
        disciplineCases.filter(
            item =>
                item.status ===
                "under_investigation"
        ).length;


    document.getElementById(
        "seriousCases"
    ).textContent =
        disciplineCases.filter(
            item =>
                item.severity === "high" ||
                item.severity === "critical"
        ).length;


    document.getElementById(
        "resolvedCases"
    ).textContent =
        disciplineCases.filter(
            item =>
                item.status === "resolved"
        ).length;

}


// =====================================================
// HELPERS
// =====================================================

function formatStatus(status) {

    return String(
        status || ""
    )
    .replaceAll("_", " ")
    .replace(
        /\b\w/g,
        char =>
            char.toUpperCase()
    );

}


function formatDate(value) {

    if (!value) return "Unknown date";


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {

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


function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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


    const toast =
        document.createElement("div");


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
        () => toast.remove(),
        5000
    );

}
