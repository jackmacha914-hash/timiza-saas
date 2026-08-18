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

function createDisciplineCard(item) {

    const card =
        document.createElement(
            "article"
        );


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

        <div class="record-severity ${escapeHtml(severity)}">

            ${escapeHtml(
                severity.toUpperCase()
            )}

        </div>


        <div class="record-main">

            <div class="record-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            student
                        )}
                    </h3>

                    <span>

                        ${escapeHtml(
                            item.admissionNumber ||
                            "No admission number"
                        )}

                    </span>

                </div>


                <span class="status-badge">

                    ${escapeHtml(
                        status
                    )}

                </span>

            </div>


            <div class="record-details">

                <div>

                    <i class="fas fa-gavel"></i>

                    <strong>

                        ${escapeHtml(
                            item.category ||
                            ""
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
// MODAL
// =====================================================

function openDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );


    const incidentDate =
        document.getElementById(
            "incidentDate"
        );


    if (incidentDate) {

        incidentDate.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }

}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeDisciplineModal() {

    const modal =
        document.getElementById(
            "disciplineModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    document.getElementById(
        "disciplineForm"
    )?.reset();


    // Reset student/class selectors

    const classSelect =
        document.getElementById(
            "classFilter"
        );


    const studentSelect =
        document.getElementById(
            "student"
        );


    if (classSelect) {

        classSelect.value = "";

    }


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
