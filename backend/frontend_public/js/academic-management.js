const API = "https://timiza-saas.onrender.com/api";

let subjectChart;
let classChart;
let gradeChart;
let trendChart;

document.addEventListener("DOMContentLoaded", () => {

    initializeTabs();

    loadDashboard();

    loadSubjects();

    loadReportCards();

    loadCharts();

    document
        .getElementById("refreshAcademicBtn")
        ?.addEventListener("click", refreshAcademic);

});

/* =====================================
   TOKEN
===================================== */

function getToken() {
    return localStorage.getItem("token");
}

async function api(url) {

    const response = await fetch(`${API}${url}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok)
        throw new Error("API Error");

    return response.json();
}

/* =====================================
   TABS
===================================== */

function initializeTabs() {

    const tabs = document.querySelectorAll(".academic-tab");

    const sections = document.querySelectorAll(".academic-section");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));

            sections.forEach(s => s.classList.remove("active"));

            tab.classList.add("active");

            document
                .getElementById(tab.dataset.tab)
                .classList.add("active");

        });

    });

}

/* =====================================
   DASHBOARD
===================================== */

async function loadDashboard() {

    try {

        const dashboard = await api("/academic/dashboard");

        document.getElementById("totalSubjects").textContent =
            dashboard.totalSubjects || 0;

        document.getElementById("subjectAllocations").textContent =
            dashboard.allocations || 0;

        document.getElementById("activeExams").textContent =
            dashboard.exams || 0;

        document.getElementById("schoolAverage").textContent =
            (dashboard.average || 0) + "%";

        document.getElementById("reportCardsCount").textContent =
            dashboard.reportCards || 0;

        document.getElementById("studentsAssessed").textContent =
            dashboard.students || 0;

    } catch (err) {

        console.error(err);

    }

}

/* =====================================
   SUBJECTS
===================================== */

async function loadSubjects() {

    try {

        const subjects = await api("/subjects");

        const body =
            document.getElementById("subjectsBody");

        body.innerHTML = "";

        subjects.forEach(subject => {

            body.innerHTML += `

            <tr>

                <td>${subject.name}</td>

                <td>${subject.code}</td>

                <td>${subject.category}</td>

                <td>

                    <span class="badge badge-success">

                        Active

                    </span>

                </td>

                <td>

                    <button class="action-btn edit-btn">

                        Edit

                    </button>

                    <button class="action-btn delete-btn">

                        Delete

                    </button>

                </td>

            </tr>

            `;

        });

    } catch (err) {

        console.error(err);

    }

}

/* =====================================
   REPORT CARDS
===================================== */

async function loadReportCards() {

    try {

        const reports = await api("/report-cards");

        const body =
            document.getElementById("reportCardsBody");

        body.innerHTML = "";

        reports.forEach(report => {

            body.innerHTML += `

            <tr>

                <td>${report.student}</td>

                <td>${report.class}</td>

                <td>${report.term}</td>

                <td>${report.average}%</td>

                <td>${report.grade}</td>

                <td>${report.position}</td>

                <td>

                    <button
                        class="action-btn view-btn">

                        View

                    </button>

                </td>

            </tr>

            `;

        });

    } catch (err) {

        console.error(err);

    }

}

/* =====================================
   CHARTS
===================================== */

function loadCharts() {

    subjectChart = new Chart(
        document.getElementById("subjectPerformanceChart"),
        {

            type: "bar",

            data: {

                labels: [],

                datasets: [{

                    label: "Average",

                    data: []

                }]

            }

        });

    classChart = new Chart(
        document.getElementById("classPerformanceChart"),
        {

            type: "bar",

            data: {

                labels: [],

                datasets: [{

                    label: "Classes",

                    data: []

                }]

            }

        });

    gradeChart = new Chart(
        document.getElementById("gradeDistributionChart"),
        {

            type: "pie",

            data: {

                labels: [],

                datasets: [{

                    data: []

                }]

            }

        });

    trendChart = new Chart(
        document.getElementById("examTrendChart"),
        {

            type: "line",

            data: {

                labels: [],

                datasets: [{

                    label: "School Average",

                    data: []

                }]

            }

        });

}

/* =====================================
   REFRESH
===================================== */

function refreshAcademic() {

    loadDashboard();

    loadSubjects();

    loadReportCards();

}
