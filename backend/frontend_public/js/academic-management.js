const API = "https://timiza-saas.onrender.com/api";

let subjectChart;
let classChart;
let gradeChart;
let trendChart;

let subjectsCache = [];


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeTabs();

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

    if (!token) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }

    const response = await fetch(
        `${API}${url}`,
        {
            ...options,

            headers: {

                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`,

                ...(options.headers || {})
            }
        }
    );


    let data;

    try {

        data = await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong."
        );

    }


    return data;

}


/* =====================================================
   HTML SECURITY
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

                tabs.forEach(t =>
                    t.classList.remove("active")
                );


                sections.forEach(section =>
                    section.classList.remove("active")
                );


                tab.classList.add("active");


                const section =
                    document.getElementById(
                        tab.dataset.tab
                    );


                if (section) {

                    section.classList.add(
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
            response.data ||
            response;


        setText(
            "totalSubjects",
            dashboard.totalSubjects || 0
        );


        setText(
            "subjectAllocations",
            dashboard.allocations || 0
        );


        setText(
            "activeExams",
            dashboard.exams || 0
        );


        setText(
            "schoolAverage",
            `${dashboard.average || 0}%`
        );


        setText(
            "reportCardsCount",
            dashboard.reportCards || 0
        );


        setText(
            "studentsAssessed",
            dashboard.students || 0
        );


    } catch (err) {

        console.error(
            "[ACADEMIC DASHBOARD]",
            err
        );

    }

}


/* =====================================================
   SET TEXT
===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


/* =====================================================
   SUBJECTS
===================================================== */

async function loadSubjects() {

    const body =
        document.getElementById(
            "subjectsBody"
        );


    if (!body) return;


    body.innerHTML = `

        <tr>

            <td colspan="5"
                style="text-align:center;">

                <i class="fas fa-spinner fa-spin"></i>
                Loading subjects...

            </td>

        </tr>

    `;


    try {

        const response =
            await api("/subjects");


        /*
         * New backend response:
         *
         * {
         *   success: true,
         *   count: 5,
         *   data: [...]
         * }
         */

        const subjects =
            response.data || [];


        subjectsCache =
            subjects;


        body.innerHTML = "";


        if (!subjects.length) {

            body.innerHTML = `

                <tr>

                    <td colspan="5"
                        style="text-align:center;">

                        <div class="empty-state">

                            <i class="fas fa-book"
                               style="font-size:32px;">
                            </i>

                            <p>
                                No subjects have been added yet.
                            </p>

                            <button
                                class="primary-btn"
                                onclick="openAddSubjectModal()">

                                <i class="fas fa-plus"></i>

                                Add First Subject

                            </button>

                        </div>

                    </td>

                </tr>

            `;

            return;

        }


        subjects.forEach(subject => {

            body.innerHTML += `

                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                subject.name
                            )}
                        </strong>

                    </td>


                    <td>

                        <span class="subject-code">

                            ${escapeHtml(
                                subject.code
                            )}

                        </span>

                    </td>


                    <td>

                        ${escapeHtml(
                            subject.category ||
                            "Core"
                        )}

                    </td>


                    <td>

                        <span class="badge ${
                            subject.active
                                ? "badge-success"
                                : "badge-danger"
                        }">

                            ${
                                subject.active
                                    ? "Active"
                                    : "Inactive"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            class="action-btn edit-btn"
                            onclick="editSubject(
                                '${subject._id}'
                            )">

                            <i class="fas fa-edit"></i>

                            Edit

                        </button>


                        ${
                            subject.active

                            ?

                            `

                            <button
                                class="action-btn delete-btn"
                                onclick="deactivateSubject(
                                    '${subject._id}'
                                )">

                                <i class="fas fa-ban"></i>

                                Deactivate

                            </button>

                            `

                            :

                            `

                            <button
                                class="action-btn edit-btn"
                                onclick="activateSubject(
                                    '${subject._id}'
                                )">

                                <i class="fas fa-check"></i>

                                Activate

                            </button>

                            `
                        }

                    </td>

                </tr>

            `;

        });


    } catch (err) {

        console.error(
            "[SUBJECTS]",
            err
        );


        body.innerHTML = `

            <tr>

                <td colspan="5"
                    style="text-align:center;">

                    <div class="error-state">

                        <i class="fas fa-exclamation-triangle"></i>

                        <p>
                            ${escapeHtml(
                                err.message
                            )}
                        </p>

                        <button
                            class="primary-btn"
                            onclick="loadSubjects()">

                            <i class="fas fa-sync"></i>

                            Try Again

                        </button>

                    </div>

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   ADD SUBJECT
===================================================== */

async function addSubject() {

    const name =
        document
            .getElementById("subjectName")
            ?.value
            .trim();


    const code =
        document
            .getElementById("subjectCode")
            ?.value
            .trim();


    const category =
        document
            .getElementById("subjectCategory")
            ?.value;


    if (!name) {

        alert(
            "Please enter the subject name."
        );

        return;

    }


    if (!code) {

        alert(
            "Please enter the subject code."
        );

        return;

    }


    try {

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


        closeSubjectModal();

        await loadSubjects();

        await loadDashboard();


        alert(
            "Subject created successfully."
        );


    } catch (err) {

        console.error(
            "[ADD SUBJECT]",
            err
        );


        alert(
            err.message
        );

    }

}


/* =====================================================
   EDIT SUBJECT
===================================================== */

function editSubject(id) {

    const subject =
        subjectsCache.find(
            item => item._id === id
        );


    if (!subject) {

        alert(
            "Subject could not be found."
        );

        return;

    }


    document.getElementById(
        "subjectModalTitle"
    ).textContent =
        "Edit Subject";


    document.getElementById(
        "subjectId"
    ).value =
        subject._id;


    document.getElementById(
        "subjectName"
    ).value =
        subject.name || "";


    document.getElementById(
        "subjectCode"
    ).value =
        subject.code || "";


    document.getElementById(
        "subjectCategory"
    ).value =
        subject.category || "Core";


    const form =
        document.getElementById(
            "subjectForm"
        );


    if (form) {

        form.onsubmit =
            async function(event) {

                event.preventDefault();

                await updateSubject();

            };

    }


    openSubjectModal();

}


/* =====================================================
   UPDATE SUBJECT
===================================================== */

async function updateSubject() {

    const id =
        document.getElementById(
            "subjectId"
        ).value;


    const name =
        document.getElementById(
            "subjectName"
        ).value.trim();


    const code =
        document.getElementById(
            "subjectCode"
        ).value.trim();


    const category =
        document.getElementById(
            "subjectCategory"
        ).value;


    if (!id) {

        alert(
            "Invalid subject."
        );

        return;

    }


    try {

        await api(
            `/subjects/${id}`,
            {

                method: "PUT",

                body: JSON.stringify({

                    name,
                    code,
                    category

                })

            }
        );


        closeSubjectModal();

        await loadSubjects();

        await loadDashboard();


        alert(
            "Subject updated successfully."
        );


    } catch (err) {

        console.error(
            "[UPDATE SUBJECT]",
            err
        );


        alert(
            err.message
        );

    }

}


/* =====================================================
   DEACTIVATE SUBJECT
===================================================== */

async function deactivateSubject(id) {

    const subject =
        subjectsCache.find(
            item => item._id === id
        );


    if (!subject) return;


    const confirmed =
        confirm(
            `Deactivate "${subject.name}"?\n\n` +
            `The subject will remain in historical ` +
            `academic records but will no longer be active.`
        );


    if (!confirmed) return;


    try {

        await api(
            `/subjects/${id}`,
            {
                method: "DELETE"
            }
        );


        await loadSubjects();

        await loadDashboard();


        alert(
            "Subject deactivated successfully."
        );


    } catch (err) {

        console.error(
            "[DEACTIVATE SUBJECT]",
            err
        );


        alert(
            err.message
        );

    }

}


/* =====================================================
   ACTIVATE SUBJECT
===================================================== */

async function activateSubject(id) {

    try {

        await api(
            `/subjects/${id}`,
            {

                method: "PUT",

                body: JSON.stringify({
                    active: true
                })

            }
        );


        await loadSubjects();

        await loadDashboard();


    } catch (err) {

        console.error(
            "[ACTIVATE SUBJECT]",
            err
        );


        alert(
            err.message
        );

    }

}


/* =====================================================
   SUBJECT MODAL
===================================================== */

function openAddSubjectModal() {

    const form =
        document.getElementById(
            "subjectForm"
        );


    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "subjectId"
        );


    if (id) {

        id.value = "";

    }


    const title =
        document.getElementById(
            "subjectModalTitle"
        );


    if (title) {

        title.textContent =
            "Add Subject";

    }


    if (form) {

        form.onsubmit =
            async function(event) {

                event.preventDefault();

                await addSubject();

            };

    }


    openSubjectModal();

}


function openSubjectModal() {

    const modal =
        document.getElementById(
            "subjectModal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );

    }

}


function closeSubjectModal() {

    const modal =
        document.getElementById(
            "subjectModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

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

                    <td colspan="7"
                        style="text-align:center;">

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
                            report.studentName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.className ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.term ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${report.average || 0}%
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
                            class="action-btn view-btn"
                            onclick="viewReportCard(
                                '${report._id}'
                            )">

                            <i class="fas fa-eye"></i>

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
   VIEW REPORT CARD
===================================================== */

function viewReportCard(id) {

    if (!id) return;


    /*
     * We will connect this to a dedicated
     * report-card page/modal next.
     */

    console.log(
        "View report card:",
        id
    );

}


/* =====================================================
   CHARTS
===================================================== */

function loadCharts() {

    const subjectCanvas =
        document.getElementById(
            "subjectPerformanceChart"
        );


    const classCanvas =
        document.getElementById(
            "classPerformanceChart"
        );


    const gradeCanvas =
        document.getElementById(
            "gradeDistributionChart"
        );


    const trendCanvas =
        document.getElementById(
            "examTrendChart"
        );


    if (!subjectCanvas ||
        !classCanvas ||
        !gradeCanvas ||
        !trendCanvas) {

        return;

    }


    subjectChart = new Chart(
        subjectCanvas,
        {

            type: "bar",

            data: {

                labels: [],

                datasets: [{

                    label:
                        "Average Score",

                    data: []

                }]

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


    classChart = new Chart(
        classCanvas,
        {

            type: "bar",

            data: {

                labels: [],

                datasets: [{

                    label:
                        "Average Score",

                    data: []

                }]

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


    gradeChart = new Chart(
        gradeCanvas,
        {

            type: "pie",

            data: {

                labels: [],

                datasets: [{

                    data: []

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }
    );


    trendChart = new Chart(
        trendCanvas,
        {

            type: "line",

            data: {

                labels: [],

                datasets: [{

                    label:
                        "School Average",

                    data: [],

                    tension: 0.3

                }]

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


/* =====================================================
   REFRESH
===================================================== */

async function refreshAcademic() {

    const button =
        document.getElementById(
            "refreshAcademicBtn"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Refreshing...

        `;

    }


    try {

        await Promise.all([

            loadDashboard(),

            loadSubjects(),

            loadReportCards()

        ]);

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i class="fas fa-sync-alt"></i>

                Refresh

            `;

        }

    }

}


/* =====================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "subjectModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeSubjectModal();

        }

    }
);
