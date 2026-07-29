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

let revenueTrendChart;
let collectionByClassChart;
let paymentMethodChart;
let collectionTermChart;

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
