const API =
    "https://timiza-saas.onrender.com/api";

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


    // CLASS CHANGE

    document
        .getElementById("classFilter")
        ?.addEventListener(
            "change",
            handleClassChange
        );


    // STUDENT CHANGE

    document
        .getElementById("student")
        ?.addEventListener(
            "change",
            handleStudentChange
        );

    // close student history modal
    document
    .getElementById(
        "closeStudentHistoryModal"
    )
    ?.addEventListener(
        "click",
        closeStudentHistory
    );


    // LOAD DATA

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

        console.warn(
            "[DISCIPLINE] Student select not found"
        );

        return;

    }


    studentSelect.innerHTML = `
        <option value="">
            Loading students...
        </option>
    `;


    studentSelect.disabled = true;


    if (classSelect) {

        classSelect.innerHTML = `
            <option value="">
                Loading classes...
            </option>
        `;

    }


    try {

        console.log(
            "[DISCIPLINE] Loading students..."
        );


        const response =
            await api(
                "/students"
            );


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


        console.log(
            `[DISCIPLINE] Loaded ${students.length} students`
        );


        if (!students.length) {

            studentSelect.innerHTML = `
                <option value="">
                    No students found
                </option>
            `;

            studentSelect.disabled = true;


            if (classSelect) {

                classSelect.innerHTML = `
                    <option value="">
                        No classes found
                    </option>
                `;

            }


            return;

        }


        // =================================================
        // BUILD UNIQUE CLASSES
        // =================================================

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
                    String(className)
                        .trim();


                if (!normalized) {
                    return;
                }


                const key =
                    normalized.toLowerCase();


                if (!classMap.has(key)) {

                    classMap.set(
                        key,
                        normalized
                    );

                }

            }
        );


        classes =
            Array.from(
                classMap.values()
            )
            .sort(
                naturalClassSort
            );


        // =================================================
        // RENDER CLASSES
        // =================================================

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


        // =================================================
        // STUDENT INITIAL STATE
        // =================================================

        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;


        studentSelect.disabled = true;


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


        studentSelect.disabled = true;


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

function getStudentClass(student) {

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

function handleClassChange(event) {

    const selectedClass =
        event.target.value;


    const studentSelect =
        document.getElementById(
            "student"
        );


    if (!studentSelect) {
        return;
    }


    // Reset student

    studentSelect.innerHTML = `
        <option value="">
            Select student
        </option>
    `;


    studentSelect.disabled = true;


    // Clear automatic fields

    const admissionInput =
        document.getElementById(
            "admissionNumber"
        );


    const classInput =
        document.getElementById(
            "className"
        );


    if (admissionInput) {

        admissionInput.value = "";

    }


    if (classInput) {

        classInput.value =
            selectedClass || "";

    }


    if (!selectedClass) {

        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;

        return;

    }


    // =================================================
    // FILTER STUDENTS
    // =================================================

    const filteredStudents =
        students.filter(
            student => {

                const studentClass =
                    getStudentClass(
                        student
                    );


                return (
                    String(studentClass)
                        .trim()
                        .toLowerCase()
                    ===
                    String(selectedClass)
                        .trim()
                        .toLowerCase()
                );

            }
        );


    console.log(
        `[DISCIPLINE] ${filteredStudents.length} students found in ${selectedClass}`
    );


    if (!filteredStudents.length) {

        studentSelect.innerHTML = `
            <option value="">
                No students in this class
            </option>
        `;

        return;

    }


    // =================================================
    // RENDER STUDENTS
    // =================================================

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

function handleStudentChange(event) {

    const studentId =
        event.target.value;


    const student =
        students.find(
            item =>
                String(
                    item._id ||
                    item.id
                ) ===
                String(studentId)
        );


    if (!student) {
        return;
    }


    const studentClass =
        getStudentClass(
            student
        );


    const admissionInput =
        document.getElementById(
            "admissionNumber"
        );


    const classInput =
        document.getElementById(
            "className"
        );


    if (admissionInput) {

        admissionInput.value =
            student.admissionNumber ||
            "";

    }


    if (classInput) {

        classInput.value =
            studentClass ||
            "";

    }

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
// RENDER
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
                    student
                        .toLowerCase()
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


    // =================================================
    // CREATE CARDS
    // =================================================

    filtered.forEach(
        item => {

            list.appendChild(
                createDisciplineCard(item)
            );

        }
    );


    // =================================================
    // HISTORY BUTTONS
    // =================================================

    document
        .querySelectorAll(
            ".view-history-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const studentId =
                            button.dataset.studentId;


                        if (!studentId) {

                            showToast(
                                "Unable to identify this student.",
                                "error"
                            );

                            return;

                        }


                        openStudentHistory(
                            studentId
                        );

                    }
                );

            }
        );

}


const detailsButton =
    card.querySelector(".view-details-btn");

if (detailsButton) {

    detailsButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            openDisciplineDetails(item);

        }
    );

}
// =====================================================
// DISCIPLINE CARD
// =====================================================

function createDisciplineCard(item) {

    const card =
        document.createElement("article");


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

                <span>

                    Reported by

                    ${escapeHtml(
                        item.reportedBy ||
                        "Administrator"
                    )}

                </span>


                ${
                    studentId
                        ? `
                            <button
                                type="button"
                                class="view-history-btn"
                                data-student-id="${escapeHtml(studentId)}"
                            >

                                <i class="fas fa-clock-rotate-left"></i>

                                View History

                            </button>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    const historyButton =
        card.querySelector(
            ".view-history-btn"
        );


    if (historyButton) {

        historyButton.addEventListener(
            "click",
            () => {

                openStudentHistory(
                    studentId,
                    student
                );

            }
        );

    }


    return card;

}
//details function

function openDisciplineDetails(item) {

    const modal =
        document.getElementById(
            "disciplineDetailsModal"
        );

    const content =
        document.getElementById(
            "disciplineDetailsContent"
        );

    if (!modal || !content) {

        console.error(
            "[DISCIPLINE DETAILS] Modal not found"
        );

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
                        ${escapeHtml(admissionNumber)}
                    </p>

                    <p>
                        Class:
                        ${escapeHtml(className)}
                    </p>

                </div>

            </div>

            <div class="case-badges">

                <span
                    class="history-severity ${escapeHtml(severity)}"
                >
                    ${escapeHtml(
                        severity.toUpperCase()
                    )}
                </span>

                <span
                    class="history-status ${escapeHtml(
                        status.replaceAll("_", "-")
                    )}"
                >
                    ${escapeHtml(
                        formatStatus(status)
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
                        item.reportedBy ||
                        "Administrator"
                    )}
                </strong>

            </div>


            <div class="case-detail-card">

                <span>
                    Case Status
                </span>

                <strong>
                    ${escapeHtml(
                        formatStatus(status)
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


    modal.classList.add("is-open");

    modal.style.display = "flex";

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

                editDisciplineCase(item);

            }
        );

}

//close details modal
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

    modal.style.display = "none";

    document.body.classList.remove(
        "modal-open"
    );

}


// =====================================================
// OPEN STUDENT HISTORY
// =====================================================

async function openStudentHistory(
    studentId,
    studentName = "Student"
) {
    console.log(
        "[DISCIPLINE HISTORY] Opening...",
        studentId,
        studentName
    );

    const modal =
        document.getElementById("studentHistoryModal");

    const timeline =
        document.getElementById("studentHistoryTimeline");

    if (!modal) {
        console.error(
            "[DISCIPLINE HISTORY] Modal not found"
        );
        return;
    }

    if (!timeline) {
        console.error(
            "[DISCIPLINE HISTORY] Timeline not found"
        );
        return;
    }

    /*
     * OPEN MODAL
     */
    modal.classList.add("is-open");

    modal.style.display = "flex";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    document.body.classList.add("modal-open");

    /*
     * UPDATE STUDENT NAME
     */
    const info =
        document.getElementById(
            "historyStudentInfo"
        );

    if (info) {
        info.textContent = studentName;
    }

    /*
     * LOADING STATE
     */
    timeline.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            Loading discipline history...
        </div>
    `;

    /*
     * FIND HISTORY
     */
    const history =
        disciplineCases.filter(item => {

            const id =
                item.student?._id ||
                item.student?.id ||
                item.studentId;

            return String(id) ===
                String(studentId);
        });

    console.log(
        "[DISCIPLINE HISTORY] Records:",
        history
    );

    /*
     * BUILD HISTORY
     */
    timeline.innerHTML =
        history.length
            ? history
                .slice()
                .sort(
                    (a, b) =>
                        new Date(b.incidentDate) -
                        new Date(a.incidentDate)
                )
                .map(
                    item =>
                        buildHistoryItem(item)
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

    /*
     * UPDATE SUMMARY
     */
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

    document.getElementById(
        "historyTotalCases"
    )?.replaceChildren(
        document.createTextNode(total)
    );

    document.getElementById(
        "historyMinorCases"
    )?.replaceChildren(
        document.createTextNode(minor)
    );

    document.getElementById(
        "historySeriousCases"
    )?.replaceChildren(
        document.createTextNode(serious)
    );

    document.getElementById(
        "historyResolvedCases"
    )?.replaceChildren(
        document.createTextNode(resolved)
    );

    document.getElementById(
        "historyOpenCases"
    )?.replaceChildren(
        document.createTextNode(open)
    );
}

// =====================================================
// BUILD STUDENT HISTORY
// =====================================================

function buildStudentHistory(
    history,
    studentName
) {

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


    const firstRecord =
        history[0];


    const studentClass =
        firstRecord?.className ||
        firstRecord?.student?.className ||
        firstRecord?.student?.class ||
        "Class not available";


    return `

        <!-- STUDENT -->

        <div class="history-student">

            <div class="history-student-avatar">

                <i class="fas fa-user"></i>

            </div>


            <div class="history-student-info">

                <h3>
                    ${escapeHtml(
                        studentName
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        studentClass
                    )}
                </p>

            </div>

        </div>


        <!-- SUMMARY -->

        <div class="discipline-history-summary">

            <div class="history-summary-card">

                <span>
                    Total Cases
                </span>

                <strong>
                    ${total}
                </strong>

            </div>


            <div class="history-summary-card minor">

                <span>
                    Minor
                </span>

                <strong>
                    ${minor}
                </strong>

            </div>


            <div class="history-summary-card serious">

                <span>
                    Serious
                </span>

                <strong>
                    ${serious}
                </strong>

            </div>


            <div class="history-summary-card resolved">

                <span>
                    Resolved
                </span>

                <strong>
                    ${resolved}
                </strong>

            </div>


            <div class="history-summary-card open">

                <span>
                    Open
                </span>

                <strong>
                    ${open}
                </strong>

            </div>

        </div>


        <!-- HISTORY -->

        <div class="history-header">

            <div>

                <h2>
                    Discipline History
                </h2>

                <p>
                    Complete history of disciplinary incidents.
                </p>

            </div>

        </div>


        ${
            !history.length

                ? `

                    <div class="history-empty">

                        <i class="fas fa-circle-check"></i>

                        <h3>
                            No discipline incidents
                        </h3>

                        <p>
                            This student has no recorded discipline cases.
                        </p>

                    </div>

                `

                : `

                    <div class="discipline-timeline">

                        ${history
                            .slice()
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    new Date(
                                        b.incidentDate
                                    ) -
                                    new Date(
                                        a.incidentDate
                                    )
                            )
                            .map(
                                item =>
                                    buildHistoryItem(
                                        item
                                    )
                            )
                            .join("")
                        }

                    </div>

                `
        }

    `;

}

// =====================================================
// HISTORY TIMELINE ITEM
// =====================================================

function buildHistoryItem(item) {

    const severity =
        item.severity ||
        "low";


    const status =
        item.status ||
        "reported";


    const statusClass =
        status
            .replaceAll(
                "_",
                "-"
            );


    return `

        <div class="discipline-history-item">

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
                            class="history-status ${escapeHtml(statusClass)}"
                        >

                            ${escapeHtml(
                                formatStatus(status)
                            )}

                        </span>


                        <span
                            class="history-severity ${escapeHtml(severity)}"
                        >

                            ${escapeHtml(
                                severity
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
                        item.parentNotified !== undefined
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
                        item.reportedBy ||
                        "Administrator"
                    )}

                </div>


            </div>

        </div>

    `;

}


// =====================================================
// CLOSE STUDENT HISTORY
// =====================================================
function closeStudentHistory() {

    console.log(
        "[DISCIPLINE HISTORY] Closing..."
    );

    const modal =
        document.getElementById(
            "studentHistoryModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("is-open");

    modal.style.display = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";

    document.body.classList.remove(
        "modal-open"
    );
}

// =====================================================
// CREATE DISCIPLINE
// =====================================================

async function createDiscipline(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveDisciplineBtn"
        );


    const studentInput =
        document.getElementById(
            "student"
        );


    const payload = {

        student:
            studentInput?.value || "",

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

            button.disabled = true;

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

            button.disabled = false;

            button.innerHTML = `

                <i class="fas fa-save"></i>

                Save Incident

            `;

        }

    }

}

// =====================================================
// OPEN DISCIPLINE MODAL
// =====================================================

function openDisciplineModal() {

    const modal =
        document.getElementById("disciplineModal");

    if (!modal) {
        console.error(
            "[DISCIPLINE MODAL] #disciplineModal was not found in HTML"
        );

        showToast(
            "Discipline modal could not be found.",
            "error"
        );

        return;
    }

    console.log(
        "[DISCIPLINE MODAL] Opening..."
    );

    // Make modal visible
    modal.classList.add("is-open");

    modal.style.display = "flex";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    document.body.classList.add("modal-open");

    // Set today's date
    const incidentDate =
        document.getElementById("incidentDate");

    if (incidentDate && !incidentDate.value) {

        incidentDate.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }
}

// =====================================================
// CLOSE DISCIPLINE MODAL
// =====================================================

function closeDisciplineModal() {

    const modal =
        document.getElementById("disciplineModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("is-open");

    modal.style.display = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";

    document.body.classList.remove(
        "modal-open"
    );

    document
        .getElementById("disciplineForm")
        ?.reset();

    // Reset class
    const classSelect =
        document.getElementById("classFilter");

    if (classSelect) {
        classSelect.value = "";
    }

    // Reset student
    const studentSelect =
        document.getElementById("student");

    if (studentSelect) {

        studentSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;

        studentSelect.disabled = true;
    }
}
// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    const total =
        document.getElementById(
            "totalCases"
        );


    const investigation =
        document.getElementById(
            "investigationCases"
        );


    const serious =
        document.getElementById(
            "seriousCases"
        );


    const resolved =
        document.getElementById(
            "resolvedCases"
        );


    if (total) {

        total.textContent =
            disciplineCases.length;

    }


    if (investigation) {

        investigation.textContent =
            disciplineCases.filter(
                item =>
                    item.status ===
                    "under_investigation"
            ).length;

    }


    if (serious) {

        serious.textContent =
            disciplineCases.filter(
                item =>
                    item.severity === "high" ||
                    item.severity === "critical"
            ).length;

    }


    if (resolved) {

        resolved.textContent =
            disciplineCases.filter(
                item =>
                    item.status ===
                    "resolved"
            ).length;

    }

}


// =====================================================
// HELPERS
// =====================================================

function formatStatus(status) {

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


function formatDate(value) {

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


function escapeHtml(value) {

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

            ${escapeHtml(
                message
            )}

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
