// ===============================
// RECEIPT MANAGEMENT
// js/finance/receipt.js
// ===============================

// -------------------------------
// Generate Receipt
// -------------------------------
function generateReceipt(paymentData) {

    const receiptWindow =
        window.open('', '_blank');

    if (!receiptWindow) {

        alert(
            'Pop-up blocked. Please allow pop-ups.'
        );

        return;
    }

    const receiptDate =
        new Date().toLocaleDateString();

    const receiptTime =
        new Date().toLocaleTimeString();

    // Total Paid
    const totalPaid =
        (paymentData.firstInstallment || 0) +
        (paymentData.secondInstallment || 0) +
        (paymentData.thirdInstallment || 0);

    // Balance
    const balance =
        (paymentData.totalFees || paymentData.amount || 0)
        - totalPaid;

    // Receipt Number
    const receiptNumber =
        'REC' + Date.now().toString().slice(-6);

    // -------------------------------
    // Receipt HTML
    // -------------------------------
    const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Receipt</title>

        <style>

            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                text-align: center;
                margin-bottom: 20px;
            }

            .receipt-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .receipt-details {
                margin: 20px 0;
            }

            .receipt-details p {
                margin: 5px 0;
            }

            .receipt-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }

            .receipt-table th,
            .receipt-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }

            .receipt-table th {
                background-color: #f2f2f2;
            }

            .total-row {
                font-weight: bold;
            }

            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
            }

            .paid-stamp {
                color: #4CAF50;
                border: 2px solid #4CAF50;
                padding: 5px 15px;
                border-radius: 5px;
                font-weight: bold;
                transform: rotate(-15deg);
                display: inline-block;
                margin: 20px 0;
            }

        </style>
    </head>

    <body>

        <div class="header">

            <div class="receipt-title">
                PAYMENT RECEIPT
            </div>

            <div>
                Receipt #${receiptNumber}
            </div>

            <div>
                ${receiptDate} at ${receiptTime}
            </div>

        </div>

        <div class="receipt-details">

            <p>
                <strong>Student:</strong>
                ${paymentData.studentName || 'N/A'}
            </p>

            <p>
                <strong>Class:</strong>
                ${paymentData.className || 'N/A'}
            </p>

            <p>
                <strong>Payment Date:</strong>
                ${receiptDate}
            </p>

        </div>

        <table class="receipt-table">

            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (Ksh)</th>
                    <th>Date Paid</th>
                </tr>
            </thead>

            <tbody>

                ${paymentData.firstInstallment ? `
                <tr>
                    <td>First Installment</td>
                    <td>
                        ${formatCurrency(paymentData.firstInstallment)}
                    </td>
                    <td>
                        ${formatDate(paymentData.firstInstallmentDate)}
                    </td>
                </tr>
                ` : ''}

                ${paymentData.secondInstallment ? `
                <tr>
                    <td>Second Installment</td>
                    <td>
                        ${formatCurrency(paymentData.secondInstallment)}
                    </td>
                    <td>
                        ${formatDate(paymentData.secondInstallmentDate)}
                    </td>
                </tr>
                ` : ''}

                ${paymentData.thirdInstallment ? `
                <tr>
                    <td>Third Installment</td>
                    <td>
                        ${formatCurrency(paymentData.thirdInstallment)}
                    </td>
                    <td>
                        ${formatDate(paymentData.thirdInstallmentDate)}
                    </td>
                </tr>
                ` : ''}

                <tr class="total-row">

                    <td>
                        TOTAL PAID
                    </td>

                    <td colspan="2">
                        KES ${formatCurrency(totalPaid)}
                    </td>

                </tr>

                <tr class="total-row">

                    <td>
                        BALANCE
                    </td>

                    <td colspan="2">
                        KES ${formatCurrency(balance)}
                    </td>

                </tr>

            </tbody>

        </table>

        <div style="text-align:center;">

            <div class="paid-stamp">
                PAID
            </div>

        </div>

        <div class="footer">

            <p>
                ${RECEIPT_CONFIG.footerMessage}
            </p>

            <p>
                ${RECEIPT_CONFIG.supportMessage}
            </p>

            <p>
                Generated on ${receiptDate}
                at ${receiptTime}
            </p>

        </div>

        <script>

            window.onload = function () {

                setTimeout(function () {

                    window.print();

                }, 500);
            };

        </script>

    </body>
    </html>
    `;

    // Write receipt
    receiptWindow.document.open();
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
}

// -------------------------------
// Print Receipt
// -------------------------------
function printReceipt(feeId, event) {

    console.log(
        'PrintReceipt called with feeId:',
        feeId
    );

    // Prevent default
    if (event) {

        event.preventDefault();
        event.stopPropagation();
    }

    // Validation
    if (!feeId) {

        console.error(
            'No feeId provided'
        );

        alert(
            'Missing fee information'
        );

        return;
    }

    // Token
    const token =
        getAuthToken();

    if (!token) {

        alert(
            'Please log in first'
        );

        return;
    }

    // Button loading state
    const printButton =
        event
            ? (
                event.target.tagName === 'BUTTON'
                    ? event.target
                    : event.target.closest('button')
              )
            : null;

    let originalButtonContent = '';

    if (printButton) {

        originalButtonContent =
            printButton.innerHTML;

        printButton.disabled = true;

        printButton.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Preparing...';
    }

    // Fetch fee details
    fetch(
        `${API_BASE_URL}/fees/${feeId}`,
        {
            method: 'GET',

            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },

            credentials: 'same-origin'
        }
    )

    .then(response => {

        if (!response.ok) {

            return response.text().then(text => {

                throw new Error(
                    `HTTP error! status: ${response.status}, details: ${text}`
                );
            });
        }

        return response.json();
    })

    .then(fee => {

        if (!fee) {

            throw new Error(
                'No fee data received'
            );
        }

        console.log(
            'Fee details:',
            fee
        );

        // Generate receipt
        generateReceipt(fee);
    })

    .catch(error => {

        console.error(
            'Error printing receipt:',
            error
        );

        alert(
            'Error generating receipt: '
            + error.message
        );
    })

    .finally(() => {

        // Restore button
        if (printButton) {

            printButton.disabled = false;

            printButton.innerHTML =
                originalButtonContent;
        }
    });
}

// -------------------------------
// Global Functions
// -------------------------------
window.generateReceipt = generateReceipt;
window.printReceipt = printReceipt;

// -------------------------------
// Receipt Module Loaded
// -------------------------------
console.log(
    'Finance Receipt Module Loaded Successfully'
);

