function initializeBulkFeeForm() {

    const form = document.getElementById('fee-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const students = window.selectedClassStudents || [];
        const className = window.selectedClassName;

        if (!className) {
            alert("Select a class first");
            return;
        }

        if (students.length === 0) {
            alert("No students found");
            return;
        }

        const feeData = {
            feesPerTerm: document.getElementById('fee-fees-per-term').value,
            balance: document.getElementById('fee-bal').value,
            dueDate: document.getElementById('fee-due-date').value,
            academicYear: document.getElementById('fee-academic-year').value,
            academicTerm: document.getElementById('fee-academic-term').value,
            notes: document.getElementById('fee-notes').value,
            className
        };

        try {

            const response = await fetch(`${API_BASE_URL}/fees/bulk-create`, {
                method: 'POST',
                headers: getFetchHeaders(),
                body: JSON.stringify({
                    students,
                    feeData
                })
            });

            if (!response.ok) throw new Error("Bulk save failed");

            alert(`Fees added for ${students.length} students`);

            form.reset();

            loadFeeRecords();

        } catch (err) {
            console.error(err);
            alert("Error saving fees");
        }
    });
}

window.initializeBulkFeeForm = initializeBulkFeeForm;
