// ============================================================
// STUDENT MANAGEMENT SYSTEM
// ============================================================

class StudentManagement {
    constructor() {
        this.students = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentSort = {
            column: 'admissionNumber',
            direction: 'asc'
        };

        // API base URL
        if (typeof window.API_BASE_URL === 'undefined') {
            window.API_BASE_URL = 'https://timiza-saas.onrender.com/api';
        }

        this.API_BASE_URL = window.API_BASE_URL;
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    async initialize() {
        console.log('[STUDENTS] Initializing Student Management...');

        this.setupEventListeners();
        await this.loadStudents();

        console.log('[STUDENTS] Student Management initialized successfully');
    }

    // ============================================================
    // LOAD STUDENTS FROM BACKEND
    // ============================================================

    async loadStudents() {
        try {
            const classSelect = document.getElementById('class-select');

            // If a class selector exists, require a selected class
            if (classSelect && !classSelect.value) {
                console.log('[STUDENTS] No class selected');

                this.students = [];
                this.currentPage = 1;
                this.renderStudentTable();

                return;
            }

            const selectedClass = classSelect
                ? classSelect.value
                : '';

            console.log(
                '[STUDENTS] Loading students for class:',
                selectedClass || 'ALL'
            );

            let url = `${this.API_BASE_URL}/students`;

            if (selectedClass) {
                url += `?class=${encodeURIComponent(selectedClass)}`;
            }

            console.log('[STUDENTS] Fetching:', url);

            // Get authentication token
            const token = localStorage.getItem('token');

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP error! status: ${response.status}`
                );
            }

            const data = await response.json();

            console.log('[STUDENTS] API response:', data);

            // Support:
            // [...]
            // { students: [...] }
            // { data: [...] }

            if (Array.isArray(data)) {
                this.students = data;
            } else if (Array.isArray(data.students)) {
                this.students = data.students;
            } else if (Array.isArray(data.data)) {
                this.students = data.data;
            } else {
                this.students = [];
            }

            console.log(
                `[STUDENTS] Loaded ${this.students.length} students`
            );

            this.currentPage = 1;

            this.renderStudentTable();

        } catch (error) {
            console.error(
                '[STUDENTS] Error loading students:',
                error
            );

            this.students = [];
            this.currentPage = 1;

            this.renderStudentTable();

            this.showNotification(
                'Could not load students from the server.',
                'error'
            );
        }
    }

    // ============================================================
    // SAVE TO LOCAL STORAGE
    // ============================================================

    saveToLocalStorage() {
        try {
            localStorage.setItem(
                'students',
                JSON.stringify(this.students)
            );

            console.log(
                '[STUDENTS] Student data saved to localStorage'
            );

        } catch (error) {
            console.error(
                '[STUDENTS] Error saving to localStorage:',
                error
            );

            this.showNotification(
                'Error saving student data.',
                'error'
            );
        }
    }

    // ============================================================
    // SAMPLE DATA
    // ============================================================

    loadSampleData() {
        this.students = [
            {
                id: 1,
                admissionNumber: 'STD001',
                fullName: 'John Doe',
                className: 'Form 1A',
                gender: 'Male',
                dateOfBirth: '2010-05-15',
                parentName: 'Jane Doe',
                parentPhone: '0712345678',
                parentEmail: 'jane@example.com',
                address: '123 Main St, Nairobi',
                status: 'Active',
                admissionDate: '2023-01-10',
                bloodGroup: 'A+',
                allergies: 'None',
                medicalConditions: 'None'
            },
            {
                id: 2,
                admissionNumber: 'STD002',
                fullName: 'Jane Smith',
                className: 'Form 2B',
                gender: 'Female',
                dateOfBirth: '2009-08-22',
                parentName: 'John Smith',
                parentPhone: '0723456789',
                parentEmail: 'john@example.com',
                address: '456 Oak Ave, Mombasa',
                status: 'Active',
                admissionDate: '2022-09-05',
                bloodGroup: 'O+',
                allergies: 'Peanuts',
                medicalConditions: 'Asthma'
            }
        ];
    }

    // ============================================================
// RENDER STUDENT TABLE
// ============================================================

renderStudentTable() {
    console.log('[STUDENTS] Rendering student table...');

    const tableBody = document.getElementById('student-table-body');

    // Student table is not present on this page
    if (!tableBody) {
        console.warn(
            '[STUDENTS] #student-table-body was not found in the DOM.'
        );
        return;
    }

    // Always clear the table first
    tableBody.innerHTML = '';

    // Make sure students is an array
    if (!Array.isArray(this.students)) {
        this.students = [];
    }

    // No students
    if (this.students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    No students found
                </td>
            </tr>
        `;

        this.updatePagination();
        return;
    }

    // ========================================================
    // PAGINATION
    // ========================================================

    const startIndex =
        (this.currentPage - 1) * this.itemsPerPage;

    const endIndex =
        startIndex + this.itemsPerPage;

    const paginatedStudents =
        this.students.slice(startIndex, endIndex);

    // ========================================================
    // RENDER STUDENTS
    // ========================================================

    paginatedStudents.forEach(student => {

        const row = document.createElement('tr');

        const status =
            student.status || 'Inactive';

        const statusClass =
            String(status)
                .toLowerCase()
                .replace(/\s+/g, '-');

        const statusDisplay =
            String(status).charAt(0).toUpperCase() +
            String(status).slice(1);

        row.innerHTML = `
            <td>
                <input
                    type="checkbox"
                    class="student-checkbox"
                    data-id="${this.escapeHtml(
                        String(student.id || '')
                    )}"
                >
            </td>

            <td>
                ${this.escapeHtml(
                    student.admissionNumber || 'N/A'
                )}
            </td>

            <td>
                ${this.escapeHtml(
                    student.fullName || 'N/A'
                )}
            </td>

            <td>
                ${this.escapeHtml(
                    student.className || 'N/A'
                )}
            </td>

            <td>
                ${this.escapeHtml(
                    this.capitalize(
                        student.gender || 'N/A'
                    )
                )}
            </td>

            <td>
                ${this.escapeHtml(
                    student.parentName || 'N/A'
                )}
            </td>

            <td>
                ${this.escapeHtml(
                    student.parentPhone || 'N/A'
                )}
            </td>

            <td>
                <span class="status status-${statusClass}">
                    ${this.escapeHtml(statusDisplay)}
                </span>
            </td>

            <td class="actions">

                <button
                    type="button"
                    class="btn-action btn-view"
                    data-id="${this.escapeHtml(
                        String(student.id || '')
                    )}"
                >
                    View
                </button>

                <button
                    type="button"
                    class="btn-action btn-edit"
                    data-id="${this.escapeHtml(
                        String(student.id || '')
                    )}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="btn-action btn-delete"
                    data-id="${this.escapeHtml(
                        String(student.id || '')
                    )}"
                >
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);
    });

    // ========================================================
    // UPDATE UI
    // ========================================================

    this.setupActionButtons();
    this.updatePagination();

    console.log(
        `[STUDENTS] Rendered ${paginatedStudents.length} of ${this.students.length} students`
    );
}
    // ============================================================
    // ACTION BUTTONS
    // ============================================================

    setupActionButtons() {
        const tableBody =
            document.getElementById(
                'student-table-body'
            );

        if (!tableBody) {
            return;
        }

        // Prevent duplicate listeners
        if (tableBody.dataset.actionsInitialized === 'true') {
            return;
        }

        tableBody.dataset.actionsInitialized = 'true';

        tableBody.addEventListener('click', event => {

            const button =
                event.target.closest('.btn-action');

            if (!button) {
                return;
            }

            event.preventDefault();

            const studentId =
                button.dataset.id;

            if (!studentId) {
                console.error(
                    '[STUDENTS] Student ID missing'
                );
                return;
            }

            if (
                button.classList.contains(
                    'btn-view'
                )
            ) {
                this.viewStudentDetails(studentId);
            }

            else if (
                button.classList.contains(
                    'btn-edit'
                )
            ) {
                this.editStudent(studentId);
            }

            else if (
                button.classList.contains(
                    'btn-delete'
                )
            ) {
                this.deleteStudent(studentId);
            }
        });
    }

    // ============================================================
    // PAGINATION
    // ============================================================

    updatePagination() {
        const pagination =
            document.getElementById('pagination');

        if (!pagination) {
            return;
        }

        const totalPages =
            Math.ceil(
                this.students.length /
                this.itemsPerPage
            );

        const safeTotalPages =
            totalPages || 1;

        if (this.currentPage > safeTotalPages) {
            this.currentPage = safeTotalPages;
        }

        pagination.innerHTML = `
            <button
                type="button"
                class="btn-prev"
                ${this.currentPage <= 1 ? 'disabled' : ''}
            >
                Previous
            </button>

            <span>
                Page ${this.currentPage}
                of ${safeTotalPages}
            </span>

            <button
                type="button"
                class="btn-next"
                ${this.currentPage >= safeTotalPages ? 'disabled' : ''}
            >
                Next
            </button>
        `;

        const previousButton =
            pagination.querySelector('.btn-prev');

        const nextButton =
            pagination.querySelector('.btn-next');

        if (previousButton) {
            previousButton.onclick = () => {

                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderStudentTable();
                }

            };
        }

        if (nextButton) {
            nextButton.onclick = () => {

                if (
                    this.currentPage <
                    safeTotalPages
                ) {
                    this.currentPage++;
                    this.renderStudentTable();
                }

            };
        }
    }

    // ============================================================
    // SHOW ADD / EDIT MODAL
    // ============================================================

    showAddStudentModal(student = null) {
        const modal =
            document.getElementById(
                'add-student-modal'
            );

        const form =
            document.getElementById(
                'add-student-form'
            );

        if (!modal || !form) {
            console.error(
                '[STUDENTS] Student modal or form not found'
            );
            return;
        }

        form.reset();

        const isEdit =
            student !== null;

        form.dataset.editMode =
            isEdit ? 'true' : 'false';

        form.dataset.studentId =
            isEdit ? String(student.id) : '';

        const modalTitle =
            modal.querySelector('h2');

        if (modalTitle) {
            modalTitle.textContent =
                isEdit
                    ? 'Edit Student'
                    : 'Add New Student';
        }

        if (student) {

            this.setFormValue(
                form,
                'fullName',
                student.fullName
            );

            this.setFormValue(
                form,
                'admissionNumber',
                student.admissionNumber
            );

            this.setFormValue(
                form,
                'className',
                student.className
            );

            this.setFormValue(
                form,
                'gender',
                student.gender
            );

            this.setFormValue(
                form,
                'dateOfBirth',
                student.dateOfBirth
                    ? student.dateOfBirth.split('T')[0]
                    : ''
            );

            this.setFormValue(
                form,
                'parentName',
                student.parentName
            );

            this.setFormValue(
                form,
                'parentPhone',
                student.parentPhone
            );

            this.setFormValue(
                form,
                'parentEmail',
                student.parentEmail
            );

            this.setFormValue(
                form,
                'address',
                student.address
            );

            this.setFormValue(
                form,
                'status',
                student.status || 'Active'
            );

            this.setFormValue(
                form,
                'bloodGroup',
                student.bloodGroup
            );

            this.setFormValue(
                form,
                'allergies',
                student.allergies
            );

            this.setFormValue(
                form,
                'medicalConditions',
                student.medicalConditions
            );
        }

        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';

        this.setupModalClose(modal);
    }

    // Backwards-compatible alias
    showAddStudent() {
        this.showAddStudentModal();
    }

    // ============================================================
    // HANDLE ADD / EDIT FORM
    // ============================================================

    async handleAddStudent(event) {
        event.preventDefault();

        const form = event.target;

        const isEditMode =
            form.dataset.editMode === 'true';

        const studentId =
            form.dataset.studentId;

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {
            submitButton.disabled = true;

            submitButton.textContent =
                isEditMode
                    ? 'Updating...'
                    : 'Saving...';
        }

        try {

            const formData =
                new FormData(form);

            const studentData = {};

            formData.forEach((value, key) => {
                studentData[key] = value;
            });

            if (isEditMode && studentId) {

                const student =
                    this.students.find(
                        student =>
                            String(student.id) ===
                            String(studentId)
                    );

                if (!student) {
                    throw new Error(
                        'Student not found'
                    );
                }

                Object.assign(
                    student,
                    studentData
                );

                student.id =
                    student.id;

                student.admissionNumber =
                    student.admissionNumber;

                student.admissionDate =
                    student.admissionDate;

                student.status =
                    studentData.status ||
                    student.status ||
                    'Active';

                student.updatedAt =
                    new Date().toISOString();

                this.saveToLocalStorage();

                this.renderStudentTable();

                this.closeModal(
                    'add-student-modal'
                );

                this.showNotification(
                    'Student updated successfully!',
                    'success'
                );

            } else {

                const newId =
                    Date.now();

                const newStudent = {

                    id: newId,

                    admissionNumber:
                        `STD${String(newId).slice(-6)}`,

                    fullName:
                        studentData.fullName || '',

                    className:
                        studentData.className || '',

                    gender:
                        studentData.gender || '',

                    dateOfBirth:
                        studentData.dateOfBirth || null,

                    parentName:
                        studentData.parentName || '',

                    parentPhone:
                        studentData.parentPhone || '',

                    parentEmail:
                        studentData.parentEmail || null,

                    address:
                        studentData.address || null,

                    status:
                        studentData.status ||
                        'Active',

                    admissionDate:
                        new Date()
                            .toISOString()
                            .split('T')[0],

                    bloodGroup:
                        studentData.bloodGroup ||
                        'Not specified',

                    allergies:
                        studentData.allergies ||
                        'None',

                    medicalConditions:
                        studentData.medicalConditions ||
                        'None',

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()
                };

                this.students.unshift(
                    newStudent
                );

                this.currentPage = 1;

                this.saveToLocalStorage();

                this.renderStudentTable();

                form.reset();

                this.closeModal(
                    'add-student-modal'
                );

                this.showNotification(
                    'Student added successfully!',
                    'success'
                );
            }

        } catch (error) {

            console.error(
                '[STUDENTS] Error saving student:',
                error
            );

            this.showNotification(
                `Error ${
                    isEditMode
                        ? 'updating'
                        : 'adding'
                } student. Please try again.`,
                'error'
            );

        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    isEditMode
                        ? 'Update Student'
                        : 'Save Student';
            }
        }
    }

    // ============================================================
    // EDIT STUDENT
    // ============================================================

    editStudent(studentId) {

        const student =
            this.students.find(
                student =>
                    String(student.id) ===
                    String(studentId)
            );

        if (!student) {

            console.error(
                '[STUDENTS] Student not found:',
                studentId
            );

            this.showNotification(
                'Student not found.',
                'error'
            );

            return;
        }

        this.showAddStudentModal(
            student
        );
    }

    // ============================================================
    // VIEW STUDENT DETAILS
    // ============================================================

    viewStudentDetails(studentId) {

        try {

            const student =
                this.students.find(
                    student =>
                        String(student.id) ===
                        String(studentId)
                );

            if (!student) {

                this.showNotification(
                    'Student not found.',
                    'error'
                );

                return;
            }

            const modal =
                document.getElementById(
                    'student-details-modal'
                );

            if (!modal) {

                console.error(
                    '[STUDENTS] Student details modal not found'
                );

                return;
            }

            const setText =
                (elementId, value) => {

                    const element =
                        document.getElementById(
                            elementId
                        );

                    if (element) {
                        element.textContent =
                            value !== undefined &&
                            value !== null &&
                            value !== ''
                                ? value
                                : 'N/A';
                    }
                };

            const formatDate =
                dateString => {

                    if (!dateString) {
                        return 'N/A';
                    }

                    const date =
                        new Date(dateString);

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        return dateString;
                    }

                    return date.toLocaleDateString(
                        'en-US',
                        {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }
                    );
                };

            // Basic information
            setText(
                'student-details-name',
                student.fullName
            );

            setText(
                'student-details-admission',
                student.admissionNumber
            );

            setText(
                'student-details-class',
                student.className
            );

            setText(
                'student-details-gender',
                student.gender
            );

            setText(
                'student-details-dob',
                formatDate(student.dateOfBirth)
            );

            // Parent information
            setText(
                'student-details-parent',
                student.parentName
            );

            setText(
                'student-details-phone',
                student.parentPhone
            );

            setText(
                'student-details-email',
                student.parentEmail
            );

            setText(
                'student-details-address',
                student.address
            );

            // Academic information
            setText(
                'student-details-status',
                student.status
            );

            setText(
                'student-details-admission-date',
                formatDate(student.admissionDate)
            );

            setText(
                'student-details-updated',
                formatDate(
                    student.updatedAt ||
                    student.createdAt
                )
            );

            // Medical information
            setText(
                'student-details-blood-group',
                student.bloodGroup
            );

            setText(
                'student-details-allergies',
                student.allergies
            );

            setText(
                'student-details-conditions',
                student.medicalConditions
            );

            modal.style.display = 'block';

            this.setupModalClose(modal);

        } catch (error) {

            console.error(
                '[STUDENTS] Error showing student details:',
                error
            );

            this.showNotification(
                'Error showing student details.',
                'error'
            );
        }
    }

    // ============================================================
    // DELETE STUDENT
    // ============================================================

    async deleteStudent(studentId) {

        try {

            const student =
                this.students.find(
                    student =>
                        String(student.id) ===
                        String(studentId)
                );

            if (!student) {

                this.showNotification(
                    'Student not found.',
                    'error'
                );

                return;
            }

            const confirmed =
                confirm(
                    `Are you sure you want to delete ${
                        student.fullName
                    } (${
                        student.admissionNumber
                    })?\n\nThis action cannot be undone.`
                );

            if (!confirmed) {
                return;
            }

            const originalLength =
                this.students.length;

            this.students =
                this.students.filter(
                    item =>
                        String(item.id) !==
                        String(studentId)
                );

            if (
                this.students.length ===
                originalLength
            ) {
                throw new Error(
                    'Student could not be deleted'
                );
            }

            // Prevent invalid pagination
            const totalPages =
                Math.ceil(
                    this.students.length /
                    this.itemsPerPage
                );

            if (
                this.currentPage >
                Math.max(totalPages, 1)
            ) {
                this.currentPage =
                    Math.max(totalPages, 1);
            }

            this.saveToLocalStorage();

            this.renderStudentTable();

            this.showNotification(
                'Student deleted successfully!',
                'success'
            );

        } catch (error) {

            console.error(
                '[STUDENTS] Delete error:',
                error
            );

            this.showNotification(
                'Error deleting student. Please try again.',
                'error'
            );
        }
    }

    // ============================================================
    // SEARCH
    // ============================================================

    searchStudents(query) {

        const searchTerm =
            String(query || '')
                .trim()
                .toLowerCase();

        if (!searchTerm) {
            this.currentPage = 1;
            this.renderStudentTable();
            return;
        }

        const filteredStudents =
            this.students.filter(student => {

                return (

                    String(
                        student.fullName || ''
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    String(
                        student.admissionNumber || ''
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    String(
                        student.className || ''
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    String(
                        student.parentName || ''
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    String(
                        student.parentPhone || ''
                    )
                        .toLowerCase()
                        .includes(searchTerm)
                );
            });

        this.renderFilteredStudents(
            filteredStudents
        );
    }

    // ============================================================
    // FILTER BY CLASS
    // ============================================================

    filterByClass(className) {

        if (!className) {
            this.currentPage = 1;
            this.renderStudentTable();
            return;
        }

        const filteredStudents =
            this.students.filter(
                student =>
                    String(
                        student.className || ''
                    ) === String(className)
            );

        this.renderFilteredStudents(
            filteredStudents
        );
    }

    // ============================================================
    // FILTER BY STATUS
    // ============================================================

    filterByStatus(status) {

        if (!status) {
            this.currentPage = 1;
            this.renderStudentTable();
            return;
        }

        const filteredStudents =
            this.students.filter(
                student =>
                    String(
                        student.status || ''
                    ).toLowerCase() ===
                    String(status).toLowerCase()
            );

        this.renderFilteredStudents(
            filteredStudents
        );
    }

    // ============================================================
    // RENDER FILTERED STUDENTS
    // ============================================================

    renderFilteredStudents(
        filteredStudents
    ) {

        const tableBody =
            document.getElementById(
                'student-table-body'
            );

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = '';

        if (
            !filteredStudents ||
            filteredStudents.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="text-center"
                    >
                        No students found
                    </td>
                </tr>
            `;

            return;
        }

        filteredStudents.forEach(student => {

            const row =
                document.createElement('tr');

            const status =
                student.status || 'Inactive';

            const statusClass =
                status
                    .toLowerCase()
                    .replace(/\s+/g, '-');

            const statusDisplay =
                this.capitalize(status);

            row.innerHTML = `
                <td>
                    <input
                        type="checkbox"
                        class="student-checkbox"
                        data-id="${student.id}"
                    >
                </td>

                <td>
                    ${this.escapeHtml(
                        student.admissionNumber || 'N/A'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        student.fullName || 'N/A'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        student.className || 'N/A'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        this.capitalize(
                            student.gender || 'N/A'
                        )
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        student.parentName || 'N/A'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        student.parentPhone || 'N/A'
                    )}
                </td>

                <td>
                    <span
                        class="status status-${statusClass}"
                    >
                        ${this.escapeHtml(
                            statusDisplay
                        )}
                    </span>
                </td>

                <td class="actions">

                    <button
                        type="button"
                        class="btn-action btn-view"
                        data-id="${student.id}"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="btn-action btn-edit"
                        data-id="${student.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn-action btn-delete"
                        data-id="${student.id}"
                    >
                        Delete
                    </button>

                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    setupEventListeners() {

        // --------------------------------------------------------
        // Add Student Button
        // --------------------------------------------------------

        const addStudentBtn =
            document.getElementById(
                'add-student-btn'
            );

        if (addStudentBtn) {

            addStudentBtn.onclick = event => {

                event.preventDefault();

                this.showAddStudentModal();
            };
        }

        // --------------------------------------------------------
        // Add/Edit Student Form
        // --------------------------------------------------------

        const addStudentForm =
            document.getElementById(
                'add-student-form'
            );

        if (addStudentForm) {

            addStudentForm.onsubmit =
                event => {

                    this.handleAddStudent(
                        event
                    );
                };
        }

        // --------------------------------------------------------
        // Search
        // --------------------------------------------------------

        const searchInput =
            document.getElementById(
                'student-search'
            );

        if (searchInput) {

            searchInput.oninput =
                event => {

                    this.searchStudents(
                        event.target.value
                    );
                };
        }

        // --------------------------------------------------------
        // Class Filter
        // --------------------------------------------------------

        const classFilter =
            document.getElementById(
                'class-filter'
            );

        if (classFilter) {

            classFilter.onchange =
                event => {

                    this.filterByClass(
                        event.target.value
                    );
                };
        }

        // --------------------------------------------------------
        // Status Filter
        // --------------------------------------------------------

        const statusFilter =
            document.getElementById(
                'status-filter'
            );

        if (statusFilter) {

            statusFilter.onchange =
                event => {

                    this.filterByStatus(
                        event.target.value
                    );
                };
        }

        // --------------------------------------------------------
        // Select All
        // --------------------------------------------------------

        const selectAll =
            document.getElementById(
                'select-all'
            );

        if (selectAll) {

            selectAll.onchange =
                event => {

                    const checkboxes =
                        document.querySelectorAll(
                            '.student-checkbox'
                        );

                    checkboxes.forEach(
                        checkbox => {
                            checkbox.checked =
                                event.target.checked;
                        }
                    );
                };
        }

        // --------------------------------------------------------
        // Class Selection
        // --------------------------------------------------------

        const classSelect =
            document.getElementById(
                'class-select'
            );

        if (classSelect) {

            classSelect.onchange =
                async () => {

                    await this.loadStudents();
                };
        }

        // --------------------------------------------------------
        // Modal Close Buttons
        // --------------------------------------------------------

        document
            .querySelectorAll('.modal .close')
            .forEach(closeButton => {

                closeButton.onclick = () => {

                    const modal =
                        closeButton.closest(
                            '.modal'
                        );

                    if (modal) {
                        modal.style.display =
                            'none';
                    }
                };
            });

        // --------------------------------------------------------
        // Close Modal When Clicking Outside
        // --------------------------------------------------------

        window.addEventListener(
            'click',
            event => {

                if (
                    event.target.classList &&
                    event.target.classList.contains(
                        'modal'
                    )
                ) {
                    event.target.style.display =
                        'none';
                }
            }
        );
    }

    // ============================================================
    // MODAL HELPERS
    // ============================================================

    setupModalClose(modal) {

        const closeButton =
            modal.querySelector('.close');

        if (closeButton) {

            closeButton.onclick = () => {

                modal.style.display =
                    'none';
            };
        }

        modal.onclick = event => {

            if (
                event.target === modal
            ) {
                modal.style.display =
                    'none';
            }
        };
    }

    closeModal(modalId) {

        const modal =
            document.getElementById(
                modalId
            );

        if (modal) {
            modal.style.display =
                'none';
        }
    }

    // ============================================================
    // FORM HELPER
    // ============================================================

    setFormValue(
        form,
        fieldName,
        value
    ) {

        const field =
            form.elements[fieldName];

        if (field) {
            field.value =
                value ?? '';
        }
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================

    showNotification(
        message,
        type = 'info'
    ) {

        const container =
            document.getElementById(
                'notification-container'
            );

        if (!container) {

            alert(
                `${type.toUpperCase()}: ${message}`
            );

            return;
        }

        const notification =
            document.createElement('div');

        notification.className =
            `notification ${type}`;

        notification.innerHTML = `
            <span class="notification-message">
                ${this.escapeHtml(message)}
            </span>

            <button
                type="button"
                class="notification-close"
            >
                &times;
            </button>
        `;

        container.appendChild(
            notification
        );

        const removeNotification =
            () => {

                notification.classList.add(
                    'fade-out'
                );

                setTimeout(() => {

                    if (
                        notification.parentNode
                    ) {
                        notification.remove();
                    }

                }, 300);
            };

        setTimeout(
            removeNotification,
            5000
        );

        const closeButton =
            notification.querySelector(
                '.notification-close'
            );

        if (closeButton) {

            closeButton.onclick =
                removeNotification;
        }
    }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    capitalize(value) {

        if (!value) {
            return '';
        }

        const stringValue =
            String(value);

        return (
            stringValue
                .charAt(0)
                .toUpperCase() +
            stringValue
                .slice(1)
        );
    }

    escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}


// ============================================================
// INITIALIZE STUDENT MANAGEMENT
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        console.log(
            '[STUDENTS] DOM fully loaded'
        );

        // Prevent duplicate initialization
        if (window.studentManager) {

            console.log(
                '[STUDENTS] StudentManager already initialized'
            );

            return;
        }

        try {

            window.studentManager =
                new StudentManagement();

            await window.studentManager.initialize();

            // Debug reference
            window.debugStudentManager =
                window.studentManager;

            console.log(
                '[STUDENTS] StudentManager ready'
            );

        } catch (error) {

            console.error(
                '[STUDENTS] Initialization failed:',
                error
            );
        }
    }
);
