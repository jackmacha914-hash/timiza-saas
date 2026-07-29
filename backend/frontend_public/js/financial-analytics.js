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
// REVENUE TREND
// ======================================

function loadRevenueTrendChart(records) {

    const monthly = {};

    records.forEach(record => {

        (record.payments || []).forEach(payment => {

            const date = new Date(payment.paymentDate);

            const key = date.toLocaleString("default", {
                month: "short",
                year: "2-digit"
            });

            monthly[key] = (monthly[key] || 0) + Number(payment.amount || 0);

        });

    });

    if (revenueTrendChart) revenueTrendChart.destroy();

    revenueTrendChart = new Chart(
        document.getElementById("revenueTrendChart"),
        {
            type: "line",
            data: {
                labels: Object.keys(monthly),
                datasets: [{
                    label: "Revenue",
                    data: Object.values(monthly),
                    borderWidth: 3,
                    fill: true,
                    tension: .35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );

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
// REPORT BUTTONS
// ======================================
// ======================================
// REPORT BUTTON ACTIONS
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    setupReportButtons();

});


function setupReportButtons(){


    document
    .getElementById("dailyCollectionReport")
    ?.addEventListener("click", createDailyCollectionReport);



    document
    .getElementById("monthlyCollectionReport")
    ?.addEventListener("click", createMonthlyCollectionReport);



    document
    .getElementById("termCollectionReport")
    ?.addEventListener("click", createTermReport);



    document
    .getElementById("defaultersReport")
    ?.addEventListener("click", createDefaultersReport);



    document
    .getElementById("incomeReport")
    ?.addEventListener("click", createIncomeReport);



    document
    .getElementById("auditReport")
    ?.addEventListener("click", createAuditReport);



    console.log("Report buttons connected");

}


// ======================================
// DAILY COLLECTION
// ======================================

async function createDailyCollectionReport(){

    const records = await getFinanceRecords();

    let total = 0;
    let rows = "";


    records.forEach(record=>{

        (record.payments || []).forEach(payment=>{


            const date =
            new Date(payment.paymentDate)
            .toLocaleDateString();


            const today =
            new Date()
            .toLocaleDateString();


            if(date === today){

                total += Number(payment.amount || 0);


                rows += `
                ${record.student?.name || "Unknown"}
                - ${money(payment.amount)}
                - ${payment.paymentMethod}
                \n`;

            }


        });


    });


    alert(
`
DAILY COLLECTION REPORT

Total:
${money(total)}

${rows || "No collections today"}
`
    );

}



// ======================================
// MONTHLY COLLECTION
// ======================================

async function createMonthlyCollectionReport(){

    const records = await getFinanceRecords();


    let total = 0;


    const now = new Date();


    records.forEach(record=>{


        (record.payments || []).forEach(payment=>{


            const date =
            new Date(payment.paymentDate);


            if(
                date.getMonth() === now.getMonth()
                &&
                date.getFullYear() === now.getFullYear()
            ){

                total += Number(payment.amount || 0);

            }


        });


    });


    alert(
`
MONTHLY COLLECTION REPORT

Month:
${now.toLocaleString("default",{month:"long"})}

Collected:
${money(total)}
`
    );

}



// ======================================
// TERM REPORT
// ======================================

async function createTermReport(){

    const records = await getFinanceRecords();


    let expected = 0;
    let paid = 0;
    let balance = 0;


    records.forEach(record=>{

        expected += Number(record.totalPayable || 0);

        paid += Number(record.paidAmount || 0);

        balance += Number(record.balance || 0);

    });



    alert(
`
TERM FINANCIAL REPORT

Expected:
${money(expected)}

Collected:
${money(paid)}

Outstanding:
${money(balance)}
`
    );

}



// ======================================
// DEFAULTERS REPORT
// ======================================

async function createDefaultersReport(){

    const records = await getFinanceRecords();


    let output="";


    records
    .filter(r=>Number(r.balance)>0)
    .forEach(record=>{


        output +=
`
${record.student?.name || "Unknown"}

Class:
${record.className}

Balance:
${money(record.balance)}

----------------
`;

    });



    alert(
`
DEFAULTERS REPORT

${output || "No defaulters"}
`
    );

}



// ======================================
// INCOME REPORT
// ======================================

async function createIncomeReport(){

    const records = await getFinanceRecords();


    let total=0;

    let methods={};



    records.forEach(record=>{


        (record.payments || [])
        .forEach(payment=>{


            const amount =
            Number(payment.amount || 0);


            total += amount;


            const method =
            payment.paymentMethod || "Unknown";


            methods[method] =
            (methods[method] || 0) + amount;


        });


    });



    let breakdown="";


    Object.keys(methods)
    .forEach(method=>{


        breakdown +=
`
${method}:
${money(methods[method])}
`;

    });



    alert(
`
INCOME REPORT

Total Income:

${money(total)}


PAYMENT BREAKDOWN

${breakdown}
`
    );

}



// ======================================
// AUDIT REPORT
// ======================================

async function createAuditReport(){

    const records = await getFinanceRecords();


    let count=0;


    records.forEach(record=>{

        count += (record.payments || []).length;

    });



    alert(
`
AUDIT REPORT

Total Payment Transactions:

${count}

Generated:
${new Date().toLocaleString()}
`
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
