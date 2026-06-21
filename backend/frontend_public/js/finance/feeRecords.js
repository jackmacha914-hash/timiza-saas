// ===============================
// Load Fee Records
// ===============================
async function loadFeeRecords() {
    console.log('Loading fee records...');

    const recordsTab = document.getElementById('fee-records-section');
    if (!recordsTab || !recordsTab.classList.contains('active')) {
        console.log('Not on fee records tab, skipping load');
        return;
    }

    let feeList = document.getElementById('fee-list');

    if (!feeList) {
        const recordsContent = document.querySelector('#fee-records-section > div');
        if (!recordsContent) {
            console.error('Fee records container not found');
            return;
        }

        feeList = document.createElement('div');
        feeList.id = 'fee-list';
        recordsContent.appendChild(feeList);
    }

    // Loading UI
    feeList.innerHTML = `
        <div class="flex flex-col items-center py-8">
            <div class="flex items-center mb-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-2">Loading fee records...</span>
            </div>
            <button onclick="loadFeeRecords()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Refresh
            </button>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');

        const response = await fetch(
            'https://luckyjuniorschool.onrender.com/api/fees',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed: ${response.status} ${errText}`);
        }

        const data = await response.json();

        let fees = [];

        if (Array.isArray(data)) fees = data;
        else if (Array.isArray(data.fees)) fees = data.fees;
        else if (Array.isArray(data.data)) fees = data.data;

        if (!fees.length) {
            feeList.innerHTML = `
                <div class="text-center py-10 text-gray-500">
                    No fee records found.
                </div>
            `;
            return;
        }

        // ===========================
        // TABLE BUILD
        // ===========================
        let html = `
            <div class="mb-4">
                <input id="fee-search" placeholder="Search..." class="border p-2 rounded w-full sm:w-64" />
            </div>

            <div class="overflow-x-auto">
            <table class="min-w-full border">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        fees.forEach(fee => {
            const studentName = fee.student?.name || fee.studentName || 'N/A';
            const className = fee.className || fee.class || 'N/A';

            const total = fee.totalFees || fee.amount || 0;
            const paid = fee.amountPaid || 0;
            const balance = fee.balance || (total - paid);

            const status = balance > 0 ? 'Pending' : 'Paid';

            html += `
                <tr>
                    <td>${studentName}</td>
                    <td>${className}</td>
                    <td>${total}</td>
                    <td>${paid}</td>
                    <td>${balance}</td>
                    <td>${status}</td>
                    <td>${new Date(fee.dueDate || Date.now()).toLocaleDateString()}</td>
                    <td>
                        <button onclick="viewFeeDetails('${fee._id}')">View</button>
                        <button onclick="printReceipt('${fee._id}', event)">Print</button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

        feeList.innerHTML = html;

        // simple search
        const searchInput = document.getElementById('fee-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const term = searchInput.value.toLowerCase();
                document.querySelectorAll('tbody tr').forEach(row => {
                    row.style.display =
                        row.innerText.toLowerCase().includes(term)
                            ? ''
                            : 'none';
                });
            });
        }

    } catch (error) {
        console.error('Error loading fee records:', error);

        feeList.innerHTML = `
            <div class="text-red-600 p-4">
                Failed to load fee records: ${error.message}
                <br/>
                <button onclick="loadFeeRecords()">Retry</button>
            </div>
        `;
    }
}

// ===============================
// View Fee Details
// ===============================
function viewFeeDetails(feeId) {
    console.log('Viewing fee details for:', feeId);

    // later you can open modal or route
    alert(`View details for fee: ${feeId}`);
}
