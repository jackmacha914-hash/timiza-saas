// ===============================
// CLASS MANAGEMENT (BULK VERSION)
// ===============================

// -------------------------------
// Load Classes (FROM BACKEND)
// -------------------------------
function loadClasses() {

    console.log('Loading classes...');

    const classSelect =
        document.getElementById('fee-class-name');

    if (!classSelect) {
        console.error('Could not find fee-class-name element');
        return;
    }

    try {

        classSelect.innerHTML =
            '<option value="">Loading classes...</option>';

        fetch('https://luckyjuniorschool.onrender.com/api/students')
            .then(res => res.json())
            .then(data => {

                console.log('STUDENTS RAW:', data);

                const students =
                    Array.isArray(data)
                        ? data
                        : (data.data || data.students || []);

                // extract unique classes
                const uniqueClasses = [...new Set(
                    students.map(s => s.class).filter(Boolean)
                )];

                console.log('UNIQUE CLASSES:', uniqueClasses);

                classSelect.innerHTML =
                    '<option value="">Select a class</option>';

                uniqueClasses.forEach(cls => {

                    const option = document.createElement('option');

                    option.value = cls;
                    option.textContent = cls;

                    classSelect.appendChild(option);
                });

                classSelect.disabled = false;

                classSelect.removeEventListener(
                    'change',
                    handleBulkClassChange
                );

                classSelect.addEventListener(
                    'change',
                    handleBulkClassChange
                );
            })
            .catch(err => {
                console.error('Error loading classes:', err);
                classSelect.innerHTML =
                    '<option value="">Error loading classes</option>';
            });

    } catch (error) {

        console.error('Error loading classes:', error);

        classSelect.innerHTML =
            '<option value="">Error loading classes</option>';
    }
}

// -------------------------------
// Handle Class Change (FIXED)
// -------------------------------
async function handleBulkClassChange(event) {

    const selectedClass = event.target.value;

    window.selectedClassStudents = [];
    window.selectedClassName = '';

    if (!selectedClass) return;

    try {

        console.log('Loading students for:', selectedClass);

        window.selectedClassName = selectedClass;

        // IMPORTANT FIX: use backend filter if available, otherwise fallback
        const response = await fetch(
            `https://luckyjuniorschool.onrender.com/api/students`
        );

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        console.log('FULL API RESULT:', result);

        const students =
            Array.isArray(result)
                ? result
                : (result.data || result.students || []);

        // FILTER
        const filteredStudents = students.filter(student => {

            const studentClass =
                student.class ||
                student.className ||
                student.grade;

            return studentClass === selectedClass;
        });

        window.selectedClassStudents = filteredStudents;

        console.log('FILTERED STUDENTS:', filteredStudents);
        console.log(`Loaded ${filteredStudents.length} students`);

        alert(`${filteredStudents.length} students loaded`);

    } catch (error) {

        console.error('Error loading students:', error);

        window.selectedClassStudents = [];
        window.selectedClassName = '';

        alert('Failed to load students');
    }
}

// -------------------------------
// GLOBAL ACCESS
// -------------------------------
window.loadClasses = loadClasses;
window.handleBulkClassChange = handleBulkClassChange;

// -------------------------------
// AUTO LOAD
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {

    console.log('Bulk fee page ready');

    loadClasses();
});

// -------------------------------
// MODULE LOADED
// -------------------------------
console.log('Bulk Fee Class Module Loaded');
