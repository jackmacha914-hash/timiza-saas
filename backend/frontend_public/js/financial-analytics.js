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

function updateSummaryCards(records){

    let expected = 0;
    let collected = 0;
    let outstanding = 0;

    let defaulters = 0;

    records.forEach(record=>{

        expected += Number(record.totalFees || record.amount || 0);

collected += Number(record.amountPaid || 0);

outstanding += Number(
    record.balance ||
    ((record.totalFees || 0) - (record.amountPaid || 0))
);

        if(Number(record.balance)>0){

            defaulters++;

        }

    });

    const collectionRate =
        expected===0
        ?0
        :((collected/expected)*100);

    setText(
        "expectedRevenue",
        money(expected)
    );

    setText(
        "collectedRevenue",
        money(collected)
    );

    setText(
        "outstandingRevenue",
        money(outstanding)
    );

    setText(
        "collectionRate",
        collectionRate.toFixed(1)+"%"
    );

    setText(
        "todayCollection",
        "KSh 0"
    );

    setText(
        "monthCollection",
        "KSh 0"
    );

    setText(
        "defaultersCount",
        defaulters
    );

    setText(
        "transactionsCount",
        records.length
    );

}

// ======================================
// RECENT PAYMENTS
// ======================================

function loadRecentPayments(records){

    const body =
        document.getElementById("recentPaymentsBody");

    if(!body)return;

    body.innerHTML="";

    records
        .slice(0,10)
        .forEach(record=>{

            body.innerHTML+=`

            <tr>

                <td>${record.student?.name || "Unknown Student" || "-"}</td>

                <td>${money(record.amountPaid || 0)}</td>

                <td>${record.paymentMethod || "Cash"}</td>

                <td>${new Date(     record.updatedAt ||     record.createdAt ||     Date.now() ).toLocaleDateString() || "-"}</td>

            </tr>

            `;

        });

}

// ======================================
// DEFAULTERS
// ======================================

function loadDefaulters(records){

    const body =
        document.getElementById("defaultersTableBody");

    if(!body)return;

    body.innerHTML="";

    records
        .filter(r=>Number(r.balance)>0)
        .sort((a,b)=>b.balance-a.balance)
        .slice(0,10)
        .forEach(record=>{

            body.innerHTML+=`

            <tr>

                <td>${record.student?.name || "Unknown Student"}</td>

                <td>${record.className || "-"}</td>

                <td>${money(record.balance)}</td>

                <td>

                    <span style="color:red;font-weight:bold">

                    Pending

                    </span>

                </td>

            </tr>

            `;

        });

}

// ======================================
// CLASS PERFORMANCE
// ======================================

function loadClassPerformance(records){

    const body =
        document.getElementById("classPerformanceBody");

    if(!body)return;

    body.innerHTML="";

    const classes={};

    records.forEach(record=>{

        const cls =
            record.className || "-" || "Unknown";

        if(!classes[cls]){

            classes[cls]={

                expected:0,

                collected:0,

                balance:0

            };

        }

        classes[cls].expected+=
            Number(record.totalFees||0);

        classes[cls].collected+=
            Number(record.amountPaid||0);

        classes[cls].balance+=
            Number(record.balance||0);

    });

    Object.keys(classes).forEach(cls=>{

        const c=classes[cls];

        const rate=
            c.expected===0
            ?0
            :((c.collected/c.expected)*100);

        body.innerHTML+=`

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
