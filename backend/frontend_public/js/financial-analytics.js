// ======================================
// TIMIZA ANALYTICS
// Financial Analytics
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadFinancialAnalytics();

    document
        .getElementById("refreshAnalyticsBtn")
        ?.addEventListener("click", loadFinancialAnalytics);

});

// ======================================
// CHART INSTANCES
// ======================================

let revenueTrendChart = null;
let collectionByClassChart = null;
let paymentMethodChart = null;
let collectionTermChart = null;

// ======================================
// MAIN LOADER
// ======================================

async function loadFinancialAnalytics() {

    try {

        showLoading();

        // Replace with your existing function
        const fees = await getFinanceRecords();

console.log("All records:");
console.table(fees);

console.log("First record JSON:");
console.log(JSON.stringify(fees[0], null, 2));

        updateSummaryCards(fees);

        loadRecentPayments(fees);

        loadDefaulters(fees);

        loadClassPerformance(fees);
        
        loadRevenueTrendChart(fees);

loadCollectionByClassChart(fees);

loadPaymentMethodChart(fees);

loadCollectionTermChart(fees);

        console.log("Financial analytics loaded.");

    }

    catch(error){

        console.error(error);

    }

}


// ======================================
// COLLECTION BY CLASS
// ======================================

function loadCollectionByClassChart(records) {

    const classes = {};

    records.forEach(record => {

        const cls = record.className || "Unknown";

        if (!classes[cls]) {

            classes[cls] = {
                expected: 0,
                collected: 0
            };

        }

        classes[cls].expected += Number(record.totalPayable || 0);
        classes[cls].collected += Number(record.paidAmount || 0);

    });

    if (collectionByClassChart) collectionByClassChart.destroy();

    collectionByClassChart = new Chart(

        document.getElementById("collectionByClassChart"),

        {

            type: "bar",

            data: {

                labels: Object.keys(classes),

                datasets: [

                    {

                        label: "Expected",

                        data: Object.values(classes).map(c => c.expected)

                    },

                    {

                        label: "Collected",

                        data: Object.values(classes).map(c => c.collected)

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

// ======================================
// PAYMENT METHODS
// ======================================

function loadPaymentMethodChart(records) {

    const methods = {};

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const method = payment.paymentMethod || "Unknown";

            methods[method] = (methods[method] || 0) + Number(payment.amount || 0);

        });

    });

    if (paymentMethodChart) paymentMethodChart.destroy();

    paymentMethodChart = new Chart(

        document.getElementById("paymentMethodChart"),

        {

            type: "pie",

            data: {

                labels: Object.keys(methods),

                datasets: [

                    {

                        data: Object.values(methods)

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

// ======================================
// COLLECTION BY TERM
// ======================================

function loadCollectionTermChart(records) {

    const terms = {};

    records.forEach(record => {

        const term = record.academicTerm || "Unknown";

        if (!terms[term]) {

            terms[term] = 0;

        }

        terms[term] += Number(record.paidAmount || 0);

    });

    if (collectionTermChart) collectionTermChart.destroy();

    collectionTermChart = new Chart(

        document.getElementById("collectionTermChart"),

        {

            type: "doughnut",

            data: {

                labels: Object.keys(terms),

                datasets: [

                    {

                        data: Object.values(terms)

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

// ======================================
//  DATA SOURCE
// ======================================
//
async function getFinanceRecords() {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        "https://timiza-saas.onrender.com/api/fees",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to load finance records.");
    }

    const data = await response.json();

    if (Array.isArray(data)) return data;

    if (Array.isArray(data.fees)) return data.fees;

    if (Array.isArray(data.data)) return data.data;

    return [];

}

// ======================================
// SUMMARY CARDS
// ======================================

function updateSummaryCards(records) {

    let expected = 0;
    let collected = 0;
    let outstanding = 0;
    let defaulters = 0;

    let todayCollection = 0;
    let monthCollection = 0;

    const today = new Date();

    records.forEach(record => {

        expected += Number(record.totalPayable || 0);

        collected += Number(record.paidAmount || 0);

        outstanding += Number(
            record.balance ??
            (Number(record.totalPayable || 0) - Number(record.paidAmount || 0))
        );

        if (Number(record.balance || 0) > 0) {
            defaulters++;
        }

        // Calculate today's and this month's collections
        (record.payments || []).forEach(payment => {

            const paymentDate = new Date(payment.paymentDate);

            // Today's collection
            if (
                paymentDate.getFullYear() === today.getFullYear() &&
                paymentDate.getMonth() === today.getMonth() &&
                paymentDate.getDate() === today.getDate()
            ) {
                todayCollection += Number(payment.amount || 0);
            }

            // This month's collection
            if (
                paymentDate.getFullYear() === today.getFullYear() &&
                paymentDate.getMonth() === today.getMonth()
            ) {
                monthCollection += Number(payment.amount || 0);
            }

        });

    });

    const collectionRate =
        expected === 0
            ? 0
            : (collected / expected) * 100;

    setText("expectedRevenue", money(expected));
    setText("collectedRevenue", money(collected));
    setText("outstandingRevenue", money(outstanding));
    setText("collectionRate", collectionRate.toFixed(1) + "%");
    setText("todayCollection", money(todayCollection));
    setText("monthCollection", money(monthCollection));
    setText("defaultersCount", defaulters);
    setText("transactionsCount", records.length);

}

// ======================================
// RECENT PAYMENTS
// ======================================

function loadRecentPayments(records) {

    const body = document.getElementById("recentPaymentsBody");

    if (!body) return;

    body.innerHTML = "";

    records
        .filter(record => Number(record.paidAmount || 0) > 0)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 10)
        .forEach(record => {

            const latestPayment = record.payments?.[record.payments.length - 1];

            body.innerHTML += `
                <tr>
                    <td>${record.student?.name || "Unknown Student"}</td>
                    <td>${money(record.paidAmount || 0)}</td>
                    <td>${latestPayment?.paymentMethod || "-"}</td>
                    <td>${new Date(
                        latestPayment?.paymentDate ||
                        record.updatedAt ||
                        record.createdAt
                    ).toLocaleDateString()}</td>
                </tr>
            `;

        });

}
// ======================================
// DEFAULTERS
// ======================================

function loadDefaulters(records) {

    const body = document.getElementById("defaultersTableBody");

    if (!body) return;

    body.innerHTML = "";

    records
        .filter(r => Number(r.balance || 0) > 0)
        .sort((a, b) => Number(b.balance) - Number(a.balance))
        .slice(0, 10)
        .forEach(record => {

            body.innerHTML += `
                <tr>
                    <td>${record.student?.name || "Unknown Student"}</td>
                    <td>${record.className || "-"}</td>
                    <td>${money(record.balance || 0)}</td>
                    <td>
                        <span style="color:red;font-weight:bold">
                            ${record.status || "Pending"}
                        </span>
                    </td>
                </tr>
            `;

        });

}

// ======================================
// CLASS PERFORMANCE
// ======================================

function loadClassPerformance(records) {

    const body = document.getElementById("classPerformanceBody");

    if (!body) return;

    body.innerHTML = "";

    const classes = {};

    records.forEach(record => {

        const cls = record.className || "Unknown";

        if (!classes[cls]) {

            classes[cls] = {
                expected: 0,
                collected: 0,
                balance: 0
            };

        }

        classes[cls].expected += Number(record.totalPayable || 0);
        classes[cls].collected += Number(record.paidAmount || 0);
        classes[cls].balance += Number(record.balance || 0);

    });

    Object.keys(classes).forEach(cls => {

        const c = classes[cls];

        const rate =
            c.expected === 0
                ? 0
                : (c.collected / c.expected) * 100;

        body.innerHTML += `
            <tr>
                <td>${cls}</td>
                <td>${money(c.expected)}</td>
                <td>${money(c.collected)}</td>
                <td>${money(c.balance)}</td>
                <td>${rate.toFixed(1)}%</td>
            </tr>
        `;

    });

}
// ======================================
// REVENUE TREND
// ======================================

function loadRevenueTrendChart(records) {

    const monthly = {};

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const date = new Date(payment.paymentDate);

            const month =
                date.toLocaleString("default", {
                    month: "short",
                    year: "numeric"
                });

            monthly[month] =
                (monthly[month] || 0) +
                Number(payment.amount || 0);

        });

    });

    const labels = Object.keys(monthly);

    const values = Object.values(monthly);

    if (revenueTrendChart) revenueTrendChart.destroy();

    revenueTrendChart = new Chart(

        document.getElementById("revenueTrendChart"),

        {
            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Revenue",

                    data: values,

                    tension: .3,

                    fill: true

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        display: false

                    }

                }

            }

        }

    );

}

// ======================================
// REPORT GENERATOR
// ======================================
async function generateReport(reportType, period = "today") {

    const records = await getFinanceRecords();

    let html = "";

    switch(reportType){

        case "daily":
            html = buildDailyReport(records, period);
            break;

        case "monthly":
            html = buildMonthlyReport(records, period);
            break;

        case "term":
            html = buildTermReport(records);
            break;

        case "income":
            html = buildIncomeReport(records, period);
            break;

        case "defaulters":
            html = buildDefaultersReport(records);
            break;

        case "audit":
            html = buildAuditReport(records, period);
            break;

    }

   openReportModal(getReportTitle(reportType), html);
}

// ======================================
// REPORT TITLES
// ======================================

function getReportTitle(type){

    switch(type){

        case "daily":
            return "Daily Collection Report";

        case "monthly":
            return "Monthly Collection Report";

        case "term":
            return "Term Financial Report";

        case "income":
            return "Income Report";

        case "defaulters":
            return "Defaulters Report";

        case "audit":
            return "Audit Report";

        default:
            return "Financial Report";
    }

}

// ======================================
// REPORT BUTTON ACTIONS
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    setupReportButtons();

});

function setupReportButtons() {

    document.getElementById("dailyCollectionReport")
        ?.addEventListener("click", () => showReportPeriodSelector("daily"));

    document.getElementById("monthlyCollectionReport")
        ?.addEventListener("click", () => showReportPeriodSelector("monthly"));

    document.getElementById("termCollectionReport")
        ?.addEventListener("click", () => generateReport("term"));

    document.getElementById("incomeReport")
        ?.addEventListener("click", () => showReportPeriodSelector("income"));

    document.getElementById("defaultersReport")
        ?.addEventListener("click", () => generateReport("defaulters"));

    document.getElementById("auditReport")
        ?.addEventListener("click", () => showReportPeriodSelector("audit"));

}



// ======================================
// DAILY COLLECTION
// ======================================

// ======================================
// DAILY REPORT BUILDER
// ======================================

function buildDailyReport(records, period) {

    let total = 0;
    let rows = "";

    const today = new Date().toLocaleDateString();

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const paymentDate = new Date(payment.paymentDate).toLocaleDateString();

            if (paymentDate === today) {

                total += Number(payment.amount || 0);

                rows += `
                    <tr>
                        <td>${record.student?.name || "Unknown"}</td>
                        <td>${money(payment.amount)}</td>
                        <td>${payment.paymentMethod || "-"}</td>
                    </tr>
                `;

            }

        });

    });

    return `
        <h3>Total Collected: ${money(total)}</h3>

        <table class="report-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                </tr>
            </thead>

            <tbody>
                ${
                    rows ||
                    `
                    <tr>
                        <td colspan="3">No collections today.</td>
                    </tr>
                `
                }
            </tbody>
        </table>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// MONTHLY REPORT BUILDER
// ======================================

function buildMonthlyReport(records, period){

    let total = 0;

    const now = new Date();

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const date = new Date(payment.paymentDate);

            if (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            ) {

                total += Number(payment.amount || 0);

            }

        });

    });

    return `
        <h3>Month: ${now.toLocaleString("default",{month:"long"})}</h3>

        <h3>Total Collected: ${money(total)}</h3>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// TERM REPORT BUILDER
// ======================================

function buildTermReport(records){

    let expected = 0;
    let paid = 0;
    let balance = 0;

    records.forEach(record => {

        expected += Number(record.totalPayable || 0);
        paid += Number(record.paidAmount || 0);
        balance += Number(record.balance || 0);

    });

    return `
        <h3>Expected Revenue: ${money(expected)}</h3>
        <h3>Collected Revenue: ${money(paid)}</h3>
        <h3>Outstanding Balance: ${money(balance)}</h3>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// DEFAULTERS REPORT BUILDER
// ======================================

function buildDefaultersReport(records){

    let output = "";

    records
        .filter(r => Number(r.balance) > 0)
        .forEach(record => {

            output += `
${record.student?.name || "Unknown"}
Class: ${record.className}
Balance: ${money(record.balance)}

------------------------
`;

        });

    return `
        <pre>${output || "No defaulters."}</pre>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// INCOME REPORT BUILDER
// ======================================

function buildIncomeReport(records){

    let total = 0;
    const methods = {};

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const amount = Number(payment.amount || 0);

            total += amount;

            const method = payment.paymentMethod || "Unknown";

            methods[method] = (methods[method] || 0) + amount;

        });

    });

    let breakdown = "";

    Object.keys(methods).forEach(method => {

        breakdown += `
${method}: ${money(methods[method])}
`;

    });

    return `
        <h3>Total Income: ${money(total)}</h3>

        <pre>${breakdown}</pre>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// AUDIT REPORT BUILDER
// ======================================

function buildAuditReport(records){

    let count = 0;

    records.forEach(record => {

        count += (record.payments || []).length;

    });

    return `
        <h3>Total Payment Transactions: ${count}</h3>

        <p>Generated: ${new Date().toLocaleString()}</p>

        <div class="report-actions">
            <button onclick="downloadPDF()">Download PDF</button>
            <button onclick="downloadExcel()">Download Excel</button>
        </div>
    `;

}

// ======================================
// REPORT MODAL
// ======================================

function openReportModal(title, content) {

    document.getElementById("reportModalTitle").textContent = title;

    document.getElementById("reportModalBody").innerHTML = content;

    document.getElementById("reportModal").style.display = "flex";

}

function closeReportModal() {

    document.getElementById("reportModal").style.display = "none";

}
// ======================================
// HELPERS
// ======================================

function money(value){

    return new Intl.NumberFormat(

        "en-KE",

        {

            style:"currency",

            currency:"KES"

        }

    ).format(Number(value));

}

function setText(id,value){

    const el=document.getElementById(id);

    if(el){

        el.textContent=value;

    }

}

function showLoading(){

    console.log("Loading financial analytics...");

}
//helper for moth midal//
function showReportPeriodSelector(type){

    const html = `

        <h3>Select Report Period</h3>

        <select id="reportPeriod">

            <option value="today">Today</option>

            <option value="yesterday">Yesterday</option>

            <option value="last7">Last 7 Days</option>

            <option value="month">This Month</option>

            <option value="custom">Custom Range</option>

        </select>

        <br><br>

        <button onclick="startSelectedReport('${type}')">

            Generate Report

        </button>

    `;

    openReportModal("Generate Report", html);

}

function startSelectedReport(type){

    const period = document.getElementById("reportPeriod").value;

    generateReport(type, period);

}

function downloadPDF() {
    alert("PDF download will be added next.");
}

function downloadExcel() {
    alert("Excel download will be added next.");
}
