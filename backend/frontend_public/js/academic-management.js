/* =====================================================
   TIMIZA EDUANALYTICS
   ACADEMIC MANAGEMENT
===================================================== */

const API = "https://timiza-saas.onrender.com/api";

let subjectChart = null;
let classChart = null;
let gradeChart = null;
let trendChart = null;

let currentEditingSubjectId = null;
let allSubjects = [];


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeTabs();

    initializeAcademicModal();

    initializeSubjectControls();

    loadDashboard();

    loadSubjects();

    loadReportCards();

    loadCharts();

    document
        .getElementById("refreshAcademicBtn")
        ?.addEventListener(
            "click",
            refreshAcademic
        );

});


/* =====================================================
   TOKEN
===================================================== */

function getToken() {

    return localStorage.getItem("token");

}


/* =====================================================
   API HELPER
===================================================== */

async function api(url, options = {}) {

    const token = getToken();

    const headers = {

        "Content-Type": "application/json",

        ...(token
            ? {
                Authorization: `Bearer ${token}`
            }
            : {}),

        ...(options.headers || {})

    };

    const response = await fetch(
        `${API}${url}`,
        {
            ...options,
            headers
        }
    );

    let data = null;

    try {

        data = await response.json();

    } catch (error) {

        data = null;

    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );

    }

    return data;

}


/* =====================================================
   TABS
===================================================== */

function initializeTabs() {

    const tabs =
        document.querySelectorAll(
            ".academic-tab"
        );

    const sections =
        document.querySelectorAll(
            ".academic-section"
        );

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                tabs.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });

                sections.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });

                tab.classList.add("active");

                const target =
                    document.getElementById(
                        tab.dataset.tab
                    );

                if (target) {

                    target.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        const response =
            await api(
                "/academic/dashboard"
            );

        const dashboard =
            response?.data ||
            response ||
            {};

        setText(
            "totalSubjects",
            dashboard.totalSubjects || 0
        );

        setText(
            "totalClasses",
            dashboard.totalClasses || 0
        );

        setText(
            "subjectAllocations",
            dashboard.allocations ||
            dashboard.subjectAllocations ||
            0
        );

        setText(
            "activeExams",
            dashboard.exams ||
            dashboard.activeExams ||
            0
        );

        setText(
            "schoolAverage",
            `${dashboard.average || 0}%`
        );

        setText(
            "studentsAssessed",
            dashboard.students ||
            dashboard.studentsAssessed ||
            0
        );

        /*
         * This element is optional because it is not
         * present in the supplied HTML.
         */
        setText(
            "reportCardsCount",
            dashboard.reportCards || 0
        );

    } catch (error) {

        console.error(
            "[DASHBOARD]",
            error
        );

    }

}


/* =====================================================
   SUBJECT CONTROLS
===================================================== */

function initializeSubjectControls() {

    document
        .getElementById("subjectSearch")
        ?.addEventListener(
            "input",
            filterSubjects
        );

    document
        .getElementById("subjectCategoryFilter")
        ?.addEventListener(
            "change",
            filterSubjects
        );

    document
        .getElementById("subjectStatusFilter")
        ?.addEventListener(
            "change",
            filterSubjects
        );

    document
        .getElementById("addSubjectBtn")
        ?.addEventListener(
            "click",
            openAddSubjectModal
        );

}


/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

    try {

        showAcademicLoading(true);

        const response =
            await api("/subjects");

        /*
         * Supports:
         *
         * [...]
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         */

        if (Array.isArray(response)) {

            allSubjects = response;

        } else if (
            Array.isArray(response?.data)
        ) {

            allSubjects =
                response.data;

        } else if (
            Array.isArray(response?.subjects)
        ) {

            allSubjects =
                response.subjects;

        } else {

            allSubjects = [];

        }

        renderSubjects(allSubjects);

    } catch (error) {

        console.error(
            "[SUBJECTS]",
            error
        );

        const body =
            document.getElementById(
                "subjectsBody"
            );

        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            color:#dc2626;
                            padding:30px;
                        "
                    >

                        <i class="fas fa-exclamation-circle"></i>

                        Failed to load subjects.

                    </td>

                </tr>

            `;

        }

    } finally {

        showAcademicLoading(false);

    }

}


/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects(subjects) {

    const body =
        document.getElementById(
            "subjectsBody"
        );

    if (!body) return;

    body.innerHTML = "";

    if (
        !Array.isArray(subjects) ||
        !subjects.length
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    <i class="fas fa-book-open"></i>

                    <br>

                    No subjects found.

                </td>

            </tr>

        `;

        return;

    }

    subjects.forEach(subject => {

        const row =
            document.createElement("tr");

        const status =
            subject.status || "active";

        const subjectId =
            subject._id ||
            subject.id;

        const classesCount =
            Array.isArray(subject.classes)
                ? subject.classes.length
                : Number(subject.classesCount || 0);

        const teachersCount =
            Array.isArray(subject.teachers)
                ? subject.teachers.length
                : Number(subject.teachersCount || 0);

        row.innerHTML = `

            <td>

                <strong>
                    ${escapeHtml(
                        subject.name || "-"
                    )}
                </strong>

            </td>


            <td>

                ${escapeHtml(
                    subject.code || "-"
                )}

            </td>


            <td>

                ${escapeHtml(
                    subject.category || "-"
                )}

            </td>


            <td>

                ${classesCount}

            </td>


            <td>

                ${teachersCount}

            </td>


            <td>

                <span class="badge ${
                    status === "inactive"
                        ? "badge-danger"
                        : "badge-success"
                }">

                    ${
                        status === "inactive"
                            ? "Inactive"
                            : "Active"
                    }

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn edit-btn"
                    onclick="openEditSubjectModal('${escapeAttribute(subjectId)}')"
                >

                    <i class="fas fa-edit"></i>

                    Edit

                </button>


                <button
                    type="button"
                    class="action-btn delete-btn"
                    onclick="deleteSubject('${escapeAttribute(subjectId)}')"
                >

                    <i class="fas fa-trash"></i>

                    Delete

                </button>

            </td>

        `;

        body.appendChild(row);

    });

}


/* =====================================================
   FILTER SUBJECTS
===================================================== */

function filterSubjects() {

    const search =
        (
            document.getElementById(
                "subjectSearch"
            )?.value || ""
        )
            .toLowerCase()
            .trim();

    const category =
        document.getElementById(
            "subjectCategoryFilter"
        )?.value || "";

    const status =
        document.getElementById(
            "subjectStatusFilter"
        )?.value || "";

    const filtered =
        allSubjects.filter(subject => {

            const subjectName =
                String(
                    subject.name || ""
                ).toLowerCase();

            const subjectCode =
                String(
                    subject.code || ""
                ).toLowerCase();

            const subjectCategory =
                subject.category || "";

            const subjectStatus =
                subject.status || "active";

            const matchesSearch =
                !search ||
                subjectName.includes(search) ||
                subjectCode.includes(search);

            const matchesCategory =
                !category ||
                subjectCategory === category;

            const matchesStatus =
                !status ||
                subjectStatus === status;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });

    renderSubjects(filtered);

}


/* =====================================================
   ACADEMIC MODAL
===================================================== */

function initializeAcademicModal() {

    const modal =
        document.getElementById(
            "academicModal"
        );

    const closeButton =
        document.getElementById(
            "closeAcademicModal"
        );

    const overlay =
        modal?.querySelector(
            ".academic-modal-overlay"
        );

    closeButton?.addEventListener(
        "click",
        closeAcademicModal
    );

    overlay?.addEventListener(
        "click",
        closeAcademicModal
    );

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal &&
                modal.style.display !== "none"
            ) {

                closeAcademicModal();

            }

        }
    );

}


/* =====================================================
   OPEN ADD SUBJECT MODAL
===================================================== */

function openAddSubjectModal() {

    currentEditingSubjectId = null;

    const modal =
        document.getElementById(
            "academicModal"
        );

    const title =
        document.getElementById(
            "academicModalTitle"
        );

    const body =
        document.getElementById(
            "academicModalBody"
        );

    if (!modal || !title || !body) {

        console.error(
            "Academic modal elements not found."
        );

        return;

    }

    title.innerHTML = `

        <i class="fas fa-book"></i>

        Add Subject

    `;

    body.innerHTML =
        getSubjectFormHtml();

    modal.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

    setTimeout(() => {

        document
            .getElementById(
                "subjectName"
            )
            ?.focus();

    }, 100);

}


/* =====================================================
   OPEN EDIT SUBJECT MODAL
===================================================== */

function openEditSubjectModal(id) {

    const subject =
        allSubjects.find(
            item =>
                String(
                    item._id ||
                    item.id
                ) === String(id)
        );

    if (!subject) {

        showAcademicMessage(
            "Subject could not be found.",
            "error"
        );

        return;

    }

    currentEditingSubjectId =
        subject._id ||
        subject.id;

    const modal =
        document.getElementById(
            "academicModal"
        );

    const title =
        document.getElementById(
            "academicModalTitle"
        );

    const body =
        document.getElementById(
            "academicModalBody"
        );

    if (!modal || !title || !body) {

        return;

    }

    title.innerHTML = `

        <i class="fas fa-edit"></i>

        Edit Subject

    `;

    body.innerHTML =
        getSubjectFormHtml(subject);

    modal.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

    setTimeout(() => {

        document
            .getElementById(
                "subjectName"
            )
            ?.focus();

    }, 100);

}


/* =====================================================
   SUBJECT FORM
===================================================== */

function getSubjectFormHtml(
    subject = null
) {

    const isEditing =
        Boolean(subject);

    return `

        <form
            id="subjectForm"
            class="subject-form"
        >

            <div class="form-intro">

                <div class="form-icon">

                    <i class="fas fa-book"></i>

                </div>


                <div>

                    <h3>

                        ${
                            isEditing
                                ? "Update Subject"
                                : "Create New Subject"
                        }

                    </h3>


                    <p>

                        ${
                            isEditing
                                ? "Update the subject information below."
                                : "Add a subject to your school's academic curriculum."
                        }

                    </p>

                </div>

            </div>


            <div
                id="subjectFormMessage"
                class="form-message"
                style="display:none;"
            ></div>


            <div class="form-grid">


                <!-- SUBJECT NAME -->

                <div
                    class="form-group form-full"
                >

                    <label
                        for="subjectName"
                    >

                        Subject Name

                        <span class="required">
                            *
                        </span>

                    </label>


                    <div class="input-icon">

                        <i class="fas fa-book-open"></i>

                        <input
                            type="text"
                            id="subjectName"
                            name="name"
                            placeholder="e.g. Mathematics"
                            value="${escapeHtml(
                                subject?.name || ""
                            )}"
                            maxlength="100"
                            required
                        >

                    </div>

                </div>


                <!-- SUBJECT CODE -->

                <div class="form-group">

                    <label
                        for="subjectCode"
                    >

                        Subject Code

                        <span class="required">
                            *
                        </span>

                    </label>


                    <div class="input-icon">

                        <i class="fas fa-hashtag"></i>

                        <input
                            type="text"
                            id="subjectCode"
                            name="code"
                            placeholder="e.g. MAT"
                            value="${escapeHtml(
                                subject?.code || ""
                            )}"
                            maxlength="20"
                            required
                        >

                    </div>


                    <small>

                        The code must be unique
                        within your school.

                    </small>

                </div>


                <!-- CATEGORY -->

                <div class="form-group">

                    <label
                        for="subjectCategory"
                    >

                        Category

                        <span class="required">
                            *
                        </span>

                    </label>


                    <div class="input-icon">

                        <i class="fas fa-layer-group"></i>


                        <select
                            id="subjectCategory"
                            name="category"
                            required
                        >

                            <option value="">

                                Select category

                            </option>


                            <option
                                value="Core"
                                ${
                                    subject?.category === "Core"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Core

                            </option>


                            <option
                                value="Science"
                                ${
                                    subject?.category === "Science"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Science

                            </option>


                            <option
                                value="Humanities"
                                ${
                                    subject?.category === "Humanities"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Humanities

                            </option>


                            <option
                                value="Technical"
                                ${
                                    subject?.category === "Technical"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Technical

                            </option>


                            <option
                                value="Languages"
                                ${
                                    subject?.category === "Languages"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Languages

                            </option>


                            <option
                                value="Optional"
                                ${
                                    subject?.category === "Optional"
                                        ? "selected"
                                        : ""
                                }
                            >

                                Optional

                            </option>

                        </select>

                    </div>

                </div>

            </div>


            <!-- FORM ACTIONS -->

            <div class="subject-form-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="closeAcademicModal()"
                >

                    <i class="fas fa-times"></i>

                    Cancel

                </button>


                <button
                    type="submit"
                    class="primary-btn"
                    id="saveSubjectBtn"
                >

                    <i class="fas fa-save"></i>

                    ${
                        isEditing
                            ? "Update Subject"
                            : "Create Subject"
                    }

                </button>

            </div>

        </form>

    `;

}


/* =====================================================
   SUBJECT FORM SUBMIT
===================================================== */

document.addEventListener(
    "submit",
    async event => {

        if (
            event.target?.id !==
            "subjectForm"
        ) {

            return;

        }

        event.preventDefault();

        await saveSubject();

    }
);


/* =====================================================
   SAVE SUBJECT
===================================================== */

async function saveSubject() {

    const name =
        document
            .getElementById(
                "subjectName"
            )
            ?.value
            .trim();

    const code =
        document
            .getElementById(
                "subjectCode"
            )
            ?.value
            .trim()
            .toUpperCase();

    const category =
        document
            .getElementById(
                "subjectCategory"
            )
            ?.value;

    const button =
        document.getElementById(
            "saveSubjectBtn"
        );


    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!name) {

        showFormMessage(
            "Please enter the subject name.",
            "error"
        );

        return;

    }


    if (!code) {

        showFormMessage(
            "Please enter the subject code.",
            "error"
        );

        return;

    }


    if (!category) {

        showFormMessage(
            "Please select a subject category.",
            "error"
        );

        return;

    }


    /* ---------------------------------------------
       DISABLE BUTTON
    --------------------------------------------- */

    if (button) {

        button.disabled = true;

        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            ${
                currentEditingSubjectId
                    ? "Updating..."
                    : "Creating..."
            }

        `;

    }


    try {

        let response;

        const payload = {

            name,
            code,
            category

        };


        /* -----------------------------------------
           UPDATE
        ----------------------------------------- */

        if (currentEditingSubjectId) {

            response =
                await api(
                    `/subjects/${encodeURIComponent(
                        currentEditingSubjectId
                    )}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

        }


        /* -----------------------------------------
           CREATE
        ----------------------------------------- */

        else {

            response =
                await api(
                    "/subjects",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        const wasEditing =
            Boolean(
                currentEditingSubjectId
            );

        closeAcademicModal();

        showAcademicMessage(
            response?.message ||
            (
                wasEditing
                    ? "Subject updated successfully."
                    : "Subject created successfully."
            ),
            "success"
        );

        await loadSubjects();

        await loadDashboard();


    } catch (error) {

        console.error(
            "[SUBJECT SAVE]",
            error
        );

        showFormMessage(
            error.message ||
            "Unable to save subject.",
            "error"
        );


        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i class="fas fa-save"></i>

                ${
                    currentEditingSubjectId
                        ? "Update Subject"
                        : "Create Subject"
                }

            `;

        }

    }

}


/* =====================================================
   DELETE SUBJECT
===================================================== */

async function deleteSubject(id) {

    const subject =
        allSubjects.find(
            item =>
                String(
                    item._id ||
                    item.id
                ) === String(id)
        );

    const subjectName =
        subject?.name ||
        "this subject";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${subjectName}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    try {

        showAcademicLoading(true);

        const response =
            await api(
                `/subjects/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );


        showAcademicMessage(
            response?.message ||
            "Subject deleted successfully.",
            "success"
        );


        await loadSubjects();

        await loadDashboard();


    } catch (error) {

        console.error(
            "[SUBJECT DELETE]",
            error
        );

        showAcademicMessage(
            error.message ||
            "Unable to delete subject.",
            "error"
        );

    } finally {

        showAcademicLoading(false);

    }

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeAcademicModal() {

    const modal =
        document.getElementById(
            "academicModal"
        );

    if (!modal) return;

    modal.style.display = "none";

    document.body.classList.remove(
        "modal-open"
    );

    currentEditingSubjectId = null;

}


/* =====================================================
   FORM MESSAGE
===================================================== */

function showFormMessage(
    text,
    type = "error"
) {

    const element =
        document.getElementById(
            "subjectFormMessage"
        );

    if (!element) return;

    element.textContent =
        text || "An error occurred.";

    element.className =
        `form-message ${type}`;

    element.style.display =
        "block";

}


/* =====================================================
   GLOBAL ACADEMIC MESSAGE
===================================================== */

function showAcademicMessage(
    text,
    type = "success"
) {

    let container =
        document.getElementById(
            "academicToastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "academicToastContainer";

        container.className =
            "academic-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `academic-toast ${type}`;


    const icon =
        type === "success"
            ? "fas fa-check-circle"
            : "fas fa-exclamation-circle";


    toast.innerHTML = `

        <i class="${icon}"></i>

        <span>
            ${escapeHtml(text)}
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


    setTimeout(() => {

        toast.remove();

    }, 5000);

}


/* =====================================================
   LOADING
===================================================== */

function showAcademicLoading(
    show
) {

    const loading =
        document.getElementById(
            "academicLoading"
        );

    if (!loading) return;

    loading.style.display =
        show
            ? "flex"
            : "none";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

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

function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            "&quot;"
        );

}


/* =====================================================
   SET TEXT HELPER
===================================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) return;

    element.textContent =
        value;

}


/* =====================================================
   REPORT CARDS
===================================================== */

async function loadReportCards() {

    try {

        const response =
            await api(
                "/reportcards"
            );

        console.log(
            "[REPORT CARDS]",
            response
        );


        let reports = [];


        if (Array.isArray(response)) {

            reports =
                response;

        } else if (
            Array.isArray(response?.data)
        ) {

            reports =
                response.data;

        } else if (
            Array.isArray(response?.reportCards)
        ) {

            reports =
                response.reportCards;

        }


        const body =
            document.getElementById(
                "reportCardsBody"
            );

        if (!body) return;

        body.innerHTML = "";


        if (!reports.length) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            padding:30px;
                        "
                    >

                        <i class="fas fa-file-alt"></i>

                        <br>

                        No report cards found.

                    </td>

                </tr>

            `;

            return;

        }


        reports.forEach(
            report => {

                const reportId =
                    report._id ||
                    report.id ||
                    "";


                body.innerHTML += `

                    <tr>

                        <td>

                            ${escapeHtml(
                                report.studentName ||
                                report.student?.name ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                report.admissionNo ||
                                report.student?.admissionNo ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                report.className ||
                                report.class?.name ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${Number(
                                report.average || 0
                            )}%

                        </td>


                        <td>

                            ${escapeHtml(
                                report.grade ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                report.position ||
                                "-"
                            )}

                        </td>


                        <td>

                            <button
                                type="button"
                                class="action-btn view-btn"
                                onclick="viewReportCard('${escapeAttribute(reportId)}')"
                            >

                                <i class="fas fa-eye"></i>

                                View

                            </button>

                        </td>

                    </tr>

                `;

            }
        );


    } catch (error) {

        console.error(
            "[REPORT CARDS]",
            error
        );

    }

}


/* =====================================================
   CHARTS
===================================================== */

function loadCharts() {

    /*
     * Destroy existing charts first.
     * Prevents Chart.js canvas reuse errors.
     */

    destroyChart(subjectChart);
    destroyChart(classChart);
    destroyChart(gradeChart);
    destroyChart(trendChart);


    /* ---------------------------------------------
       SUBJECT PERFORMANCE
    --------------------------------------------- */

    const subjectCanvas =
        document.getElementById(
            "subjectPerformanceChart"
        );

    if (subjectCanvas) {

        subjectChart =
            new Chart(
                subjectCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [],

                        datasets: [

                            {

                                label:
                                    "Average",

                                data: []

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        scales: {

                            y: {

                                beginAtZero: true,

                                max: 100

                            }

                        }

                    }

                }
            );

    }


    /* ---------------------------------------------
       CLASS PERFORMANCE
    --------------------------------------------- */

    const classCanvas =
        document.getElementById(
            "classPerformanceChart"
        );

    if (classCanvas) {

        classChart =
            new Chart(
                classCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [],

                        datasets: [

                            {

                                label:
                                    "Class Average",

                                data: []

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        scales: {

                            y: {

                                beginAtZero: true,

                                max: 100

                            }

                        }

                    }

                }
            );

    }


    /* ---------------------------------------------
       GRADE DISTRIBUTION
    --------------------------------------------- */

    const gradeCanvas =
        document.getElementById(
            "gradeDistributionChart"
        );

    if (gradeCanvas) {

        gradeChart =
            new Chart(
                gradeCanvas,
                {

                    type: "pie",

                    data: {

                        labels: [],

                        datasets: [

                            {

                                data: []

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false

                    }

                }
            );

    }


    /* ---------------------------------------------
       EXAM TREND
    --------------------------------------------- */

    const trendCanvas =
        document.getElementById(
            "examTrendChart"
        );

    if (trendCanvas) {

        trendChart =
            new Chart(
                trendCanvas,
                {

                    type: "line",

                    data: {

                        labels: [],

                        datasets: [

                            {

                                label:
                                    "School Average",

                                data: [],

                                tension: 0.3

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        scales: {

                            y: {

                                beginAtZero: true,

                                max: 100

                            }

                        }

                    }

                }
            );

    }

}


/* =====================================================
   DESTROY CHART
===================================================== */

function destroyChart(chart) {

    if (
        chart &&
        typeof chart.destroy === "function"
    ) {

        chart.destroy();

    }

}


/* =====================================================
   REFRESH ACADEMIC DATA
===================================================== */

async function refreshAcademic() {

    try {

        showAcademicLoading(true);

        await Promise.all([
            loadDashboard(),
            loadSubjects(),
            loadReportCards()
        ]);

        showAcademicMessage(
            "Academic data refreshed successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "[REFRESH]",
            error
        );

        showAcademicMessage(
            "Some academic data could not be refreshed.",
            "error"
        );

    } finally {

        showAcademicLoading(false);

    }

}


/* =====================================================
   VIEW REPORT CARD
===================================================== */

function viewReportCard(id) {

    if (!id) {

        showAcademicMessage(
            "Report card ID is missing.",
            "error"
        );

        return;

    }

    console.log(
        "View report card:",
        id
    );

    /*
     * Add your report-card route here when available.
     *
     * Example:
     *
     * window.location.href =
     *     `report-card.html?id=${encodeURIComponent(id)}`;
     */

}


/* =====================================================
   OPTIONAL: LOAD ACADEMIC ANALYTICS
===================================================== */

async function loadAcademicAnalytics() {

    try {

        const response =
            await api(
                "/academic/analytics"
            );

        console.log(
            "[ACADEMIC ANALYTICS]",
            response
        );

        /*
         * Expected example:
         *
         * {
         *   subjectPerformance: {
         *      labels: [],
         *      data: []
         *   },
         *
         *   classPerformance: {
         *      labels: [],
         *      data: []
         *   },
         *
         *   gradeDistribution: {
         *      labels: [],
         *      data: []
         *   },
         *
         *   examinationTrend: {
         *      labels: [],
         *      data: []
         *   }
         * }
         */

        const analytics =
            response?.data ||
            response ||
            {};


        /* SUBJECT CHART */

        if (
            subjectChart &&
            analytics.subjectPerformance
        ) {

            subjectChart.data.labels =
                analytics
                    .subjectPerformance
                    .labels || [];

            subjectChart.data.datasets[0].data =
                analytics
                    .subjectPerformance
                    .data || [];

            subjectChart.update();

        }


        /* CLASS CHART */

        if (
            classChart &&
            analytics.classPerformance
        ) {

            classChart.data.labels =
                analytics
                    .classPerformance
                    .labels || [];

            classChart.data.datasets[0].data =
                analytics
                    .classPerformance
                    .data || [];

            classChart.update();

        }


        /* GRADE CHART */

        if (
            gradeChart &&
            analytics.gradeDistribution
        ) {

            gradeChart.data.labels =
                analytics
                    .gradeDistribution
                    .labels || [];

            gradeChart.data.datasets[0].data =
                analytics
                    .gradeDistribution
                    .data || [];

            gradeChart.update();

        }


        /* TREND CHART */

        if (
            trendChart &&
            analytics.examinationTrend
        ) {

            trendChart.data.labels =
                analytics
                    .examinationTrend
                    .labels || [];

            trendChart.data.datasets[0].data =
                analytics
                    .examinationTrend
                    .data || [];

            trendChart.update();

        }


        /* SUMMARY */

        setText(
            "topClass",
            analytics.topClass || "—"
        );

        setText(
            "topSubject",
            analytics.topSubject || "—"
        );

        setText(
            "topStudent",
            analytics.topStudent || "—"
        );

        setText(
            "analyticsAverage",
            `${analytics.average || 0}%`
        );


    } catch (error) {

        console.error(
            "[ACADEMIC ANALYTICS]",
            error
        );

    }

}


/* =====================================================
   OPTIONAL: INITIALIZE ANALYTICS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(() => {

            loadAcademicAnalytics();

        }, 300);

    }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "[UNHANDLED PROMISE]",
            event.reason
        );

    }
);


/* =====================================================
   EXPORT GLOBAL FUNCTIONS
   Required by inline onclick attributes in HTML.
===================================================== */

window.openAddSubjectModal =
    openAddSubjectModal;

window.openEditSubjectModal =
    openEditSubjectModal;

window.deleteSubject =
    deleteSubject;

window.closeAcademicModal =
    closeAcademicModal;

window.viewReportCard =
    viewReportCard;

window.refreshAcademic =
    refreshAcademic;
