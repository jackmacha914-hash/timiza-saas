const API = "https://timiza-saas.onrender.com/api";

let subjectChart;
let classChart;
let gradeChart;
let trendChart;

let currentEditingSubjectId = null;


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
        ?.addEventListener("click", refreshAcademic);

});


/* =====================================================
   TOKEN
===================================================== */

function getToken() {

    return localStorage.getItem("token");

}


/* =====================================================
   API
===================================================== */

async function api(url, options = {}) {

    const token = getToken();

    const response = await fetch(`${API}${url}`, {

        ...options,

        headers: {

            "Content-Type": "application/json",

            ...(token
                ? {
                    Authorization: `Bearer ${token}`
                }
                : {}),

            ...(options.headers || {})

        }

    });

    let data = null;

    try {

        data = await response.json();

    } catch (err) {

        data = null;

    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
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
        document.querySelectorAll(".academic-tab");

    const sections =
        document.querySelectorAll(".academic-section");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t =>
                t.classList.remove("active")
            );

            sections.forEach(section =>
                section.classList.remove("active")
            );

            tab.classList.add("active");

            const target =
                document.getElementById(tab.dataset.tab);

            if (target) {

                target.classList.add("active");

            }

        });

    });

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        const dashboard =
            await api("/academic/dashboard");

        document.getElementById("totalSubjects").textContent =
            dashboard.totalSubjects || 0;

        document.getElementById("totalClasses").textContent =
            dashboard.totalClasses || 0;

        document.getElementById("subjectAllocations").textContent =
            dashboard.allocations || 0;

        document.getElementById("activeExams").textContent =
            dashboard.exams || 0;

        document.getElementById("schoolAverage").textContent =
            (dashboard.average || 0) + "%";

        document.getElementById("reportCardsCount")?.textContent =
            dashboard.reportCards || 0;

        document.getElementById("studentsAssessed").textContent =
            dashboard.students || 0;

    } catch (err) {

        console.error(
            "[DASHBOARD]",
            err
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
   SUBJECTS
===================================================== */

let allSubjects = [];


async function loadSubjects() {

    try {

        const response =
            await api("/subjects");

        /*
         * Supports both:
         *
         * [...]
         *
         * and:
         *
         * { success: true, data: [...] }
         */

        if (Array.isArray(response)) {

            allSubjects = response;

        } else {

            allSubjects =
                response.data || [];

        }

        renderSubjects(allSubjects);

    } catch (err) {

        console.error(
            "[SUBJECTS]",
            err
        );

        const body =
            document.getElementById("subjectsBody");

        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="text-align:center;color:#dc2626;"
                    >

                        Failed to load subjects.

                    </td>

                </tr>

            `;

        }

    }

}


/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects(subjects) {

    const body =
        document.getElementById("subjectsBody");

    if (!body) return;

    body.innerHTML = "";

    if (!subjects.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >

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

        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(subject.name)}
                </strong>
            </td>

            <td>
                ${escapeHtml(subject.code)}
            </td>

            <td>
                ${escapeHtml(subject.category)}
            </td>

            <td>
                ${subject.classes?.length || 0}
            </td>

            <td>
                ${subject.teachers?.length || 0}
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
                    onclick="openEditSubjectModal('${subject._id}')"
                >
                    <i class="fas fa-edit"></i>
                    Edit
                </button>

                <button
                    type="button"
                    class="action-btn delete-btn"
                    onclick="deleteSubject('${subject._id}')"
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
   SUBJECT FILTER
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

            const matchesSearch =

                !search ||

                String(subject.name || "")
                    .toLowerCase()
                    .includes(search) ||

                String(subject.code || "")
                    .toLowerCase()
                    .includes(search);

            const matchesCategory =

                !category ||

                subject.category === category;

            const subjectStatus =
                subject.status || "active";

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
   MODAL INITIALIZATION
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
            .getElementById("subjectName")
            ?.focus();

    }, 100);

}


/* =====================================================
   OPEN EDIT SUBJECT MODAL
===================================================== */

function openEditSubjectModal(id) {

    const subject =
        allSubjects.find(
            item => item._id === id
        );

    if (!subject) {

        showAcademicMessage(
            "Subject could not be found.",
            "error"
        );

        return;

    }

    currentEditingSubjectId = id;

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

}


/* =====================================================
   SUBJECT FORM HTML
===================================================== */

function getSubjectFormHtml(subject = null) {

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

                <div class="form-group form-full">

                    <label for="subjectName">

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
                            value="${escapeHtml(subject?.name || "")}"
                            maxlength="100"
                            required
                        >

                    </div>

                </div>


                <!-- SUBJECT CODE -->

                <div class="form-group">

                    <label for="subjectCode">

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
                            value="${escapeHtml(subject?.code || "")}"
                            maxlength="20"
                            required
                        >

                    </div>

                    <small>
                        The code must be unique within your school.
                    </small>

                </div>


                <!-- CATEGORY -->

                <div class="form-group">

                    <label for="subjectCategory">

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


            <!-- ACTIONS -->

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
   SUBMIT SUBJECT FORM
===================================================== */

document.addEventListener(
    "submit",
    async event => {

        if (
            event.target.id !==
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
            .getElementById("subjectName")
            ?.value
            .trim();

    const code =
        document
            .getElementById("subjectCode")
            ?.value
            .trim()
            .toUpperCase();

    const category =
        document
            .getElementById("subjectCategory")
            ?.value;

    const message =
        document.getElementById(
            "subjectFormMessage"
        );

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

        if (currentEditingSubjectId) {

            response =
                await api(
                    `/subjects/${currentEditingSubjectId}`,
                    {
                        method: "PUT",

                        body: JSON.stringify({

                            name,
                            code,
                            category

                        })
                    }
                );

        } else {

            response =
                await api(
                    "/subjects",
                    {
                        method: "POST",

                        body: JSON.stringify({

                            name,
                            code,
                            category

                        })
                    }
                );

        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        closeAcademicModal();

        showAcademicMessage(
            response.message ||
            (
                currentEditingSubjectId
                    ? "Subject updated successfully."
                    : "Subject created successfully."
            ),
            "success"
        );


        await loadSubjects();

        await loadDashboard();


    } catch (err) {

        console.error(
            "[SUBJECT SAVE]",
            err
        );

        showFormMessage(
            err.message ||
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
            item => item._id === id
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
                `/subjects/${id}`,
                {
                    method: "DELETE"
                }
            );

        showAcademicMessage(
            response.message ||
            "Subject deleted successfully.",
            "success"
        );

        await loadSubjects();

        await loadDashboard();

    } catch (err) {

        console.error(
            "[SUBJECT DELETE]",
            err
        );

        showAcademicMessage(
            err.message ||
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

    element.textContent = text;

    element.className =
        `form-message ${type}`;

    element.style.display = "block";

}


/* =====================================================
   GLOBAL MESSAGE
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
            document.createElement("div");

        container.id =
            "academicToastContainer";

        container.className =
            "academic-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");

    toast.className =
        `academic-toast ${type}`;

    toast.innerHTML = `

        <i class="${
            type === "success"
                ? "fas fa-check-circle"
                : "fas fa-exclamation-circle"
        }"></i>

        <span>
            ${escapeHtml(text)}
        </span>

        <button
            type="button"
            onclick="this.parentElement.remove()"
        >
            <i class="fas fa-times"></i>
        </button>

    `;

    container.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 5000);

}


/* =====================================================
   LOADING
===================================================== */

function showAcademicLoading(show) {

    const loading =
        document.getElementById(
            "academicLoading"
        );

    if (!loading) return;

    loading.style.display =
        show ? "flex" : "none";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   REPORT CARDS
===================================================== */

async function loadReportCards() {

    try {

        const response =
            await api("/reportcards");

        console.log(
            "REPORTS:",
            response
        );

        const reports =
            response.data || [];

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
                        style="text-align:center;"
                    >
                        No report cards found
                    </td>

                </tr>

            `;

            return;

        }

        reports.forEach(report => {

            body.innerHTML += `

                <tr>

                    <td>
                        ${escapeHtml(
                            report.studentName || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.admissionNo || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.className || "-"
                        )}
                    </td>

                    <td>
                        ${report.average || 0}%
                    </td>

                    <td>
                        ${escapeHtml(
                            report.grade || "-"
                        )}
                    </td>

                    <td>
                        ${report.position || "-"}
                    </td>

                    <td>

                        <button
                            class="action-btn view-btn"
                            onclick="viewReportCard('${report._id}')"
                        >
                            View
                        </button>

                    </td>

                </tr>

            `;

        });

    } catch (err) {

        console.error(
            "[REPORT CARDS]",
            err
        );

    }

}


/* =====================================================
   CHARTS
===================================================== */

function loadCharts() {

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

                        datasets: [{

                            label: "Average",

                            data: []

                        }]

                    }

                }
            );

    }


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

                        datasets: [{

                            label: "Classes",

                            data: []

                        }]

                    }

                }
            );

    }


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

                        datasets: [{

                            data: []

                        }]

                    }

                }
            );

    }


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

                        datasets: [{

                            label: "School Average",

                            data: []

                        }]

                    }

                }
            );

    }

}


/* =====================================================
   REFRESH
===================================================== */

function refreshAcademic() {

    loadDashboard();

    loadSubjects();

    loadReportCards();

}


/* =====================================================
   OPTIONAL REPORT FUNCTION
===================================================== */

function viewReportCard(id) {

    console.log(
        "View report card:",
        id
    );

}
