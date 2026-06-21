```javascript
// ===============================
// UTILITY FUNCTIONS
// js/finance/utils.js
// ===============================

// -------------------------------
// Format Currency
// -------------------------------
function formatCurrency(amount) {
    const num = parseFloat(amount);

    if (isNaN(num)) {
        return '0.00';
    }

    return num.toLocaleString(LOCALE || 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// -------------------------------
// Parse Currency
// -------------------------------
function parseCurrency(value) {

    if (!value) {
        return 0;
    }

    // Already a number
    if (typeof value === 'number') {
        return value;
    }

    // Remove commas, currency signs, spaces etc
    const numericValue = String(value)
        .replace(/[^0-9.-]/g, '');

    const parsed = parseFloat(numericValue);

    return isNaN(parsed) ? 0 : parsed;
}

// -------------------------------
// Format Date
// -------------------------------
function formatDate(dateString) {

    if (!dateString) {
        return 'N/A';
    }

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return new Date(dateString)
        .toLocaleDateString(LOCALE || 'en-US', options);
}

// -------------------------------
// Calculate Balance
// Preserves your original logic
// -------------------------------
function calculateBalance() {

    const totalFeesInput = document.getElementById('fee-fees-per-term');

    const firstInstallmentInput =
        document.getElementById('fee-first-installment');

    const secondInstallmentInput =
        document.getElementById('fee-second-installment');

    const thirdInstallmentInput =
        document.getElementById('fee-third-installment');

    const balanceInput =
        document.getElementById('fee-bal');

    if (!totalFeesInput || !balanceInput) {
        return 0;
    }

    // Total Fees
    const totalFees =
        parseCurrency(totalFeesInput.value);

    // Installments
    const firstInstallment =
        firstInstallmentInput
            ? parseCurrency(firstInstallmentInput.value)
            : 0;

    const secondInstallment =
        secondInstallmentInput
            ? parseCurrency(secondInstallmentInput.value)
            : 0;

    const thirdInstallment =
        thirdInstallmentInput
            ? parseCurrency(thirdInstallmentInput.value)
            : 0;

    // Total Paid
    let totalPaid =
        firstInstallment +
        secondInstallment +
        thirdInstallment;

    // Remaining Balance
    let balance =
        Math.max(0, totalFees - totalPaid);

    // -------------------------------
    // Prevent Overpayment
    // -------------------------------
    if (totalPaid > totalFees && totalFees > 0) {

        let excess = totalPaid - totalFees;

        const installments = [
            {
                input: thirdInstallmentInput,
                value: thirdInstallment
            },
            {
                input: secondInstallmentInput,
                value: secondInstallment
            },
            {
                input: firstInstallmentInput,
                value: firstInstallment
            }
        ];

        // Adjust from last installment backwards
        for (const installment of installments) {

            if (
                excess > 0 &&
                installment.input &&
                installment.input.value &&
                installment.value > 0
            ) {

                const newValue =
                    Math.max(0, installment.value - excess);

                installment.input.value =
                    formatCurrency(newValue);

                excess =
                    Math.max(0, excess - installment.value);

                // Trigger input event
                if (installment.input.dispatchEvent) {

                    const event = new Event('input', {
                        bubbles: true
                    });

                    installment.input.dispatchEvent(event);
                }
            }
        }

        // Recalculate
        return calculateBalance();
    }

    // -------------------------------
    // Update Balance Field
    // -------------------------------
    if (balanceInput) {

        const displayValue =
            balance <= 0
                ? '0.00'
                : balance.toFixed(2);

        if (balanceInput.type === 'number') {

            balanceInput.value =
                balance <= 0
                    ? '0'
                    : balance.toString();

        } else {

            balanceInput.value = displayValue;
        }

        // Balance Styling
        if (balance <= 0) {

            balanceInput.classList.remove('text-red-600');

            balanceInput.classList.add('text-green-600');

            if (balanceInput.type !== 'number') {

                balanceInput.value = '0.00';

            } else {

                balanceInput.value = '0';
            }

        } else {

            balanceInput.classList.remove('text-green-600');

            balanceInput.classList.add('text-red-600');
        }
    }

    return balance;
}

// -------------------------------
// Assign Global Functions
// -------------------------------
window.calculateBalance = calculateBalance;
window.formatCurrency = formatCurrency;
window.parseCurrency = parseCurrency;
window.formatDate = formatDate;

// -------------------------------
// Utils Loaded
// -------------------------------
console.log('Finance Utils Loaded Successfully');
```
