document.addEventListener('DOMContentLoaded', () => {
/* =========================================================
   HOMEWORK & ASSIGNMENT MANAGEMENT
   Ready-to-paste replacement
   ========================================================= */

(() => {
    'use strict';

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    const API_BASE_URL =
        window.API_CONFIG?.BASE_URL ||
        'https://timiza-saas.onrender.com';

    const API_HOMEWORKS = `${API_BASE_URL}/api/homeworks`;
    const API_ASSIGNMENTS = `${API_BASE_URL}/api/assignments`;

    let allHomeworks = [];
    let allAssignments = [];

    /* =========================================================
       HELPER FUNCTIONS
       ========================================================= */

    function getToken() {
        return localStorage.getItem('token');
    }

    function requireToken() {
        const token = getToken();

        if (!token) {
            showMessage('Please log in first.', 'error');
            return null;
        }

        return token;
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getFileUrl(file) {
        if (!file) {
            return '';
        }

        // If backend already returns a complete URL
        if (/^https?:\/\//i.test(file)) {
            return file;
        }

        // If backend returns a path beginning with /
        if (file.startsWith('/')) {
            return `${API_BASE_URL}${file}`;
        }

        return `${API_BASE_URL}/${file}`;
    }

    async function parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return await response.json();
        }

        const text = await response.text();

        return {
            error: text || `Request failed with status ${response.status}`
        };
    }

    function formatDate(date) {
        if (!date) {
            return 'N/A';
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Invalid date';
        }

        return parsedDate.toLocaleDateString();
    }

    function formatDateTime(date) {
        if (!date) {
            return 'N/A';
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Invalid date';
        }

        return parsedDate.toLocaleString();
    }

    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');

        const bootstrapType =
            type === 'error'
                ? 'danger'
                : type === 'success'
                    ? 'success'
                    : type === 'warning'
                        ? 'warning'
                        : 'info';

        messageDiv.className =
            `alert alert-${bootstrapType} alert-dismissible fade show`;

        messageDiv.setAttribute('role', 'alert');

        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '99999';
        messageDiv.style.minWidth = '300px';
        messageDiv.style.maxWidth = '500px';

        const text = document.createElement('span');
        text.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('aria-label', 'Close');

        closeButton.onclick = () => {
            messageDiv.remove();
        };

        messageDiv.appendChild(text);
        messageDiv.appendChild(closeButton);

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                messageDiv.style.transition = 'opacity 0.3s ease';

                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    function setFormMessage(elementId, message, type = 'error') {
        const msgDiv = document.getElementById(elementId);

        if (!msgDiv) {
            showMessage(message, type);
            return;
        }

        msgDiv.style.display = 'block';
        msgDiv.textContent = message;

        if (type === 'success') {
            msgDiv.style.color = 'green';
        } else if (type === 'error') {
            msgDiv.style.color = 'red';
        } else {
            msgDiv.style.color = '#333';
        }
    }

    /* =========================================================
       HOMEWORK CREATION
       ========================================================= */

    function initializeHomeworkCreation() {
        const form = document.getElementById('create-homework-form');

        if (!form) {
            return;
        }

        form.onsubmit = async function (e) {
            e.preventDefault();

            const title =
                document.getElementById('homework-title')?.value.trim() || '';

            const description =
                document.getElementById('homework-description')?.value.trim() || '';

            const dueDate =
                document.getElementById('homework-due-date')?.value.trim() || '';

            const classAssigned =
                document.getElementById('homework-class')?.value.trim() || '';

            if (!title || !dueDate || !classAssigned) {
                setFormMessage(
                    'homework-create-msg',
                    'Please fill in all required fields: title, due date, and class.',
                    'error'
                );
                return;
            }

            const token = requireToken();

            if (!token) {
                return;
            }

            const submitButton = form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

            const originalButtonText = submitButton
                ? submitButton.textContent
                : '';

            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Creating...';
                }

                const formData = new FormData(form);

                const response = await fetch(API_HOMEWORKS, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await parseResponse(response);

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        `Failed to create homework (${response.status})`
                    );
                }

                setFormMessage(
                    'homework-create-msg',
                    'Homework created successfully!',
                    'success'
                );

                form.reset();

                const formContainer =
                    document.getElementById('homework-form-container');

                if (formContainer) {
                    formContainer.style.display = 'none';
                }

                await fetchHomeworks();

            } catch (error) {
                console.error('Error creating homework:', error);

                setFormMessage(
                    'homework-create-msg',
                    `Error: ${error.message || 'Failed to create homework'}`,
                    'error'
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText || 'Create Homework';
                }
            }
        };
    }

    /* =========================================================
       ASSIGNMENT CREATION
       ========================================================= */

    function initializeAssignmentCreation() {
        const form = document.getElementById('create-assignment-form');

        if (!form) {
            return;
        }

        form.onsubmit = async function (e) {
            e.preventDefault();

            const title =
                document.getElementById('assignment-title')?.value.trim() || '';

            const description =
                document.getElementById('assignment-description')?.value.trim() || '';

            const dueDate =
                document.getElementById('assignment-due-date')?.value.trim() || '';

            const classAssigned =
                document.getElementById('assignment-class')?.value.trim() || '';

            if (!title || !dueDate || !classAssigned) {
                setFormMessage(
                    'assignment-create-msg',
                    'Please fill in all required fields: title, due date, and class.',
                    'error'
                );
                return;
            }

            const token = requireToken();

            if (!token) {
                return;
            }

            const submitButton = form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

            const originalButtonText = submitButton
                ? submitButton.textContent
                : '';

            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Creating...';
                }

                const formData = new FormData(form);

                const response = await fetch(API_ASSIGNMENTS, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await parseResponse(response);

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        `Failed to create assignment (${response.status})`
                    );
                }

                setFormMessage(
                    'assignment-create-msg',
                    'Assignment created successfully!',
                    'success'
                );

                form.reset();

                const formContainer =
                    document.getElementById('assignment-form-container');

                if (formContainer) {
                    formContainer.style.display = 'none';
                }

                await fetchAssignments();

            } catch (error) {
                console.error('Error creating assignment:', error);

                setFormMessage(
                    'assignment-create-msg',
                    `Error: ${error.message || 'Failed to create assignment'}`,
                    'error'
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent =
                        originalButtonText || 'Create Assignment';
                }
            }
        };
    }

    /* =========================================================
       HOMEWORK CLASS FILTER
       ========================================================= */

    function updateClassFilter(classes) {
        const classFilter = document.getElementById('class-filter');

        if (!classFilter) {
            return;
        }

        const currentValue = classFilter.value;

        // Keep "All Classes"
        while (classFilter.options.length > 1) {
            classFilter.remove(1);
        }

        const uniqueClasses = [
            ...new Set(
                classes
                    .map(item => String(item || '').trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b));

        uniqueClasses.forEach(className => {
            const option = document.createElement('option');

            option.value = className;
            option.textContent = className;

            classFilter.appendChild(option);
        });

        const stillExists = Array.from(classFilter.options)
            .some(option => option.value === currentValue);

        if (stillExists) {
            classFilter.value = currentValue;
        } else {
            classFilter.value = 'all';
        }
    }

    function initializeClassFilter() {
        const classFilter = document.getElementById('class-filter');

        if (!classFilter || classFilter.dataset.listenerAttached === 'true') {
            return;
        }

        classFilter.dataset.listenerAttached = 'true';

        classFilter.addEventListener('change', function (e) {
            renderHomeworks(e.target.value);
        });
    }

    /* =========================================================
       RENDER HOMEWORKS
       ========================================================= */

    function renderHomeworks(classFilter = 'all') {
        const homeworkList =
            document.getElementById('homework-list');

        if (!homeworkList) {
            console.warn('Could not find #homework-list');
            return;
        }

        homeworkList.innerHTML = '';

        const filteredHomeworks =
            classFilter === 'all'
                ? allHomeworks
                : allHomeworks.filter(homework =>
                    String(homework.classAssigned || '').trim() ===
                    String(classFilter).trim()
                );

        if (!filteredHomeworks.length) {
            const li = document.createElement('li');

            li.textContent =
                classFilter === 'all'
                    ? 'No homeworks found.'
                    : `No homeworks found for class "${classFilter}".`;

            homeworkList.appendChild(li);
            return;
        }

        filteredHomeworks.forEach(homework => {
            const li = document.createElement('li');

            li.className = 'homework-item';

            const title = escapeHTML(homework.title);
            const description = escapeHTML(homework.description);
            const className = escapeHTML(homework.classAssigned);
            const teacherName = escapeHTML(
                homework.teacher?.name || 'N/A'
            );

            const fileUrl = homework.file
                ? getFileUrl(homework.file)
                : '';

            li.innerHTML = `
                <h4>${title}</h4>

                <p>
                    <strong>Description:</strong>
                    ${description || 'No description'}
                </p>

                <p>
                    <strong>Due Date:</strong>
                    ${formatDate(homework.dueDate)}
                </p>

                <p>
                    <strong>Class:</strong>
                    ${className || 'N/A'}
                </p>

                <p>
                    <strong>Created By:</strong>
                    ${teacherName}
                </p>

                ${
                    fileUrl
                        ? `
                            <p>
                                <strong>File:</strong>
                                <a
                                    href="${escapeHTML(fileUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Download
                                </a>
                            </p>
                        `
                        : ''
                }

                <div class="homework-actions">

                    <button
                        type="button"
                        class="edit-homework-btn"
                        data-id="${escapeHTML(homework._id)}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-homework-btn"
                        data-id="${escapeHTML(homework._id)}"
                    >
                        Delete
                    </button>

                    <button
                        type="button"
                        class="view-submissions-btn"
                        data-id="${escapeHTML(homework._id)}"
                    >
                        View Submissions
                    </button>

                </div>
            `;

            // Attach events without putting IDs into onclick strings
            const editButton =
                li.querySelector('.edit-homework-btn');

            const deleteButton =
                li.querySelector('.delete-homework-btn');

            const submissionsButton =
                li.querySelector('.view-submissions-btn');

            editButton?.addEventListener('click', () => {
                editHomework(homework._id);
            });

            deleteButton?.addEventListener('click', () => {
                deleteHomework(homework._id);
            });

            submissionsButton?.addEventListener('click', () => {
                viewHomeworkSubmissions(homework._id);
            });

            homeworkList.appendChild(li);
        });
    }

    /* =========================================================
       FETCH HOMEWORKS
       ========================================================= */

    async function fetchHomeworks() {
        const token = getToken();

        if (!token) {
            console.warn('No authentication token found.');
            return;
        }

        try {
            const response = await fetch(API_HOMEWORKS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    `Failed to fetch homeworks (${response.status})`
                );
            }

            // Make sure we always have an array
            allHomeworks = Array.isArray(data)
                ? data
                : Array.isArray(data.homeworks)
                    ? data.homeworks
                    : [];

            const classes = allHomeworks
                .map(homework => homework.classAssigned)
                .filter(Boolean);

            updateClassFilter(classes);

            const classFilter =
                document.getElementById('class-filter');

            renderHomeworks(
                classFilter?.value || 'all'
            );

        } catch (error) {
            console.error('Error fetching homeworks:', error);

            const homeworkList =
                document.getElementById('homework-list');

            if (homeworkList) {
                homeworkList.innerHTML = '';

                const li = document.createElement('li');
                li.textContent =
                    `Failed to load homeworks: ${error.message}`;

                homeworkList.appendChild(li);
            }
        }
    }

    /* =========================================================
       RENDER ASSIGNMENTS
       ========================================================= */

    function renderAssignments(assignments) {
        const assignmentList =
            document.getElementById('assignment-list');

        if (!assignmentList) {
            return;
        }

        assignmentList.innerHTML = '';

        if (!assignments.length) {
            const li = document.createElement('li');
            li.textContent = 'No assignments found.';
            assignmentList.appendChild(li);
            return;
        }

        assignments.forEach(assignment => {
            const li = document.createElement('li');

            const fileUrl = assignment.file
                ? getFileUrl(assignment.file)
                : '';

            li.className = 'assignment-item';

            li.innerHTML = `
                <h4>
                    ${escapeHTML(assignment.title)}
                </h4>

                <p>
                    <strong>Class:</strong>
                    ${escapeHTML(assignment.classAssigned || 'N/A')}
                </p>

                <p>
                    <strong>Due Date:</strong>
                    ${formatDate(assignment.dueDate)}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${escapeHTML(assignment.description || 'No description')}
                </p>

                ${
                    fileUrl
                        ? `
                            <p>
                                <a
                                    href="${escapeHTML(fileUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Assignment File
                                </a>
                            </p>
                        `
                        : ''
                }

                <div class="assignment-actions">

                    <button
                        type="button"
                        class="view-assignment-submissions-btn"
                    >
                        View Submissions
                    </button>

                    <button
                        type="button"
                        class="grade-assignment-btn"
                    >
                        Grade
                    </button>

                    <button
                        type="button"
                        class="edit-assignment-btn"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-assignment-btn warning-btn"
                    >
                        Delete
                    </button>

                </div>
            `;

            li.querySelector(
                '.view-assignment-submissions-btn'
            )?.addEventListener('click', () => {
                if (typeof window.viewAssignmentSubmissions === 'function') {
                    window.viewAssignmentSubmissions(assignment._id);
                } else {
                    showMessage(
                        'Assignment submissions function is not available.',
                        'error'
                    );
                }
            });

            li.querySelector(
                '.grade-assignment-btn'
            )?.addEventListener('click', () => {
                if (typeof window.gradeAssignment === 'function') {
                    window.gradeAssignment(assignment._id);
                } else {
                    showMessage(
                        'Assignment grading function is not available.',
                        'error'
                    );
                }
            });

            li.querySelector(
                '.edit-assignment-btn'
            )?.addEventListener('click', () => {
                if (typeof window.editAssignment === 'function') {
                    window.editAssignment(assignment._id);
                } else {
                    showMessage(
                        'Assignment editing function is not available.',
                        'error'
                    );
                }
            });

            li.querySelector(
                '.delete-assignment-btn'
            )?.addEventListener('click', () => {
                if (typeof window.deleteAssignment === 'function') {
                    window.deleteAssignment(assignment._id);
                } else {
                    showMessage(
                        'Assignment deletion function is not available.',
                        'error'
                    );
                }
            });

            assignmentList.appendChild(li);
        });
    }

    /* =========================================================
       FETCH ASSIGNMENTS
       ========================================================= */

    async function fetchAssignments() {
        const token = getToken();

        if (!token) {
            console.warn('No authentication token found.');
            return;
        }

        try {
            const response = await fetch(API_ASSIGNMENTS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    `Failed to fetch assignments (${response.status})`
                );
            }

            allAssignments = Array.isArray(data)
                ? data
                : Array.isArray(data.assignments)
                    ? data.assignments
                    : [];

            renderAssignments(allAssignments);

        } catch (error) {
            console.error('Error fetching assignments:', error);

            const assignmentList =
                document.getElementById('assignment-list');

            if (assignmentList) {
                assignmentList.innerHTML = '';

                const li = document.createElement('li');
                li.textContent =
                    `Failed to load assignments: ${error.message}`;

                assignmentList.appendChild(li);
            }
        }
    }

    /* =========================================================
       HOMEWORK SUBMISSIONS MODAL
       ========================================================= */

    async function viewHomeworkSubmissions(homeworkId) {
        if (!homeworkId) {
            showMessage('Invalid homework ID.', 'error');
            return;
        }

        const token = requireToken();

        if (!token) {
            return;
        }

        const loadingModal = createLoadingModal();

        document.body.appendChild(loadingModal);

        try {
            const response = await fetch(
                `${API_HOMEWORKS}/${encodeURIComponent(homeworkId)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    'Failed to fetch homework submissions.'
                );
            }

            loadingModal.remove();

            createSubmissionsModal(data);

        } catch (error) {
            console.error('Error loading submissions:', error);

            loadingModal.remove();

            showMessage(
                error.message ||
                'Failed to load submissions. Please try again.',
                'error'
            );
        }
    }

    function createLoadingModal() {
        const modal = document.createElement('div');

        modal.className = 'custom-loading-modal';

        Object.assign(modal.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '100000'
        });

        modal.innerHTML = `
            <div style="
                background:white;
                padding:30px;
                border-radius:10px;
                width:90%;
                max-width:450px;
                text-align:center;
            ">
                <div style="
                    width:40px;
                    height:40px;
                    border:4px solid #ddd;
                    border-top-color:#007bff;
                    border-radius:50%;
                    animation: homeworkSpin 0.8s linear infinite;
                    margin:0 auto 20px;
                "></div>

                <h3>Loading Submissions</h3>

                <p>
                    Please wait while we load the submissions.
                </p>
            </div>
        `;

        if (!document.getElementById('homework-spin-animation')) {
            const style = document.createElement('style');

            style.id = 'homework-spin-animation';

            style.textContent = `
                @keyframes homeworkSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `;

            document.head.appendChild(style);
        }

        return modal;
    }

    function createSubmissionsModal(data) {
        const backdrop = document.createElement('div');

        backdrop.className = 'homework-submissions-backdrop';

        Object.assign(backdrop.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.55)',
            zIndex: '10000'
        });

        const modal = document.createElement('div');

        modal.className = 'homework-submissions-modal';

        Object.assign(modal.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '10001',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            padding: '40px 20px'
        });

        const content = document.createElement('div');

        Object.assign(content.style, {
            background: '#fff',
            width: '100%',
            maxWidth: '850px',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        });

        const header = document.createElement('div');

        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            borderBottom: '1px solid #eee',
            paddingBottom: '15px',
            marginBottom: '20px'
        });

        const title = document.createElement('h3');

        title.textContent =
            `Submissions for ${data.title || 'Homework'}`;

        title.style.margin = '0';

        const closeButton = document.createElement('button');

        closeButton.type = 'button';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close');

        Object.assign(closeButton.style, {
            background: 'transparent',
            border: 'none',
            fontSize: '30px',
            cursor: 'pointer',
            lineHeight: '1'
        });

        function closeModal() {
            modal.remove();
            backdrop.remove();
        }

        closeButton.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        header.appendChild(title);
        header.appendChild(closeButton);

        const submissionsContainer = document.createElement('div');

        Object.assign(submissionsContainer.style, {
            maxHeight: '70vh',
            overflowY: 'auto'
        });

        const submissions =
            Array.isArray(data.submissions)
                ? data.submissions
                : [];

        if (!submissions.length) {
            const empty = document.createElement('p');

            empty.textContent = 'No submissions yet.';
            empty.style.padding = '20px';
            empty.style.textAlign = 'center';

            submissionsContainer.appendChild(empty);

        } else {
            submissions.forEach(submission => {
                submissionsContainer.appendChild(
                    createSubmissionElement(
                        data._id,
                        submission
                    )
                );
            });
        }

        content.appendChild(header);
        content.appendChild(submissionsContainer);

        modal.appendChild(content);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        document.addEventListener(
            'keydown',
            function escapeHandler(e) {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener(
                        'keydown',
                        escapeHandler
                    );
                }
            }
        );
    }

    function createSubmissionElement(homeworkId, submission) {
        const submissionEl = document.createElement('div');

        submissionEl.className = 'submission-item';
        submissionEl.dataset.submissionId = submission._id;

        Object.assign(submissionEl.style, {
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '18px',
            marginBottom: '15px'
        });

        const studentName =
            submission.student?.name ||
            submission.student?.username ||
            'Unknown Student';

        submissionEl.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                flex-wrap:wrap;
                margin-bottom:12px;
            ">
                <div>
                    <strong>Student:</strong>
                    ${escapeHTML(studentName)}
                </div>

                <div>
                    <small>
                        Submitted:
                        ${escapeHTML(
                            formatDateTime(submission.submittedAt)
                        )}
                    </small>
                </div>
            </div>
        `;

        if (submission.file) {
            const fileDiv = document.createElement('div');

            fileDiv.style.marginBottom = '15px';

            const fileUrl = getFileUrl(submission.file);

            fileDiv.innerHTML = `
                <strong>File:</strong>
                <a
                    href="${escapeHTML(fileUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${escapeHTML(
                        String(submission.file).split('/').pop()
                    )}
                </a>
            `;

            submissionEl.appendChild(fileDiv);
        }

        const hasGrade =
            submission.grade !== null &&
            submission.grade !== undefined &&
            submission.grade !== '';

        if (hasGrade) {
            const gradeDisplay = document.createElement('div');

            gradeDisplay.className = 'grade-display';

            gradeDisplay.innerHTML = `
                <strong>Grade:</strong>
                ${escapeHTML(submission.grade)}%
            `;

            submissionEl.appendChild(gradeDisplay);

            if (submission.comments) {
                const feedbackDisplay = document.createElement('div');

                feedbackDisplay.className = 'feedback-display';

                feedbackDisplay.style.marginTop = '8px';
                feedbackDisplay.style.padding = '10px';
                feedbackDisplay.style.background = '#f8f9fa';
                feedbackDisplay.style.borderRadius = '5px';

                feedbackDisplay.innerHTML = `
                    <strong>Feedback:</strong>
                    ${escapeHTML(submission.comments)}
                `;

                submissionEl.appendChild(feedbackDisplay);
            }

            return submissionEl;
        }

        /* =====================================================
           GRADING FORM
           ===================================================== */

        const gradeForm = document.createElement('div');

        gradeForm.className = 'grade-form';

        Object.assign(gradeForm.style, {
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #eee'
        });

        const gradeLabel = document.createElement('label');

        gradeLabel.textContent = 'Grade (0-100):';
        gradeLabel.htmlFor = `grade-${submission._id}`;

        gradeLabel.style.display = 'block';
        gradeLabel.style.marginBottom = '5px';

        const gradeInput = document.createElement('input');

        gradeInput.type = 'number';
        gradeInput.id = `grade-${submission._id}`;
        gradeInput.min = '0';
        gradeInput.max = '100';
        gradeInput.step = '1';
        gradeInput.placeholder = '0-100';

        Object.assign(gradeInput.style, {
            width: '120px',
            padding: '8px',
            marginBottom: '12px'
        });

        const commentsLabel = document.createElement('label');

        commentsLabel.textContent = 'Feedback:';
        commentsLabel.htmlFor = `comments-${submission._id}`;

        commentsLabel.style.display = 'block';
        commentsLabel.style.marginBottom = '5px';

        const commentsInput = document.createElement('textarea');

        commentsInput.id = `comments-${submission._id}`;
        commentsInput.placeholder =
            'Add feedback for the student...';

        Object.assign(commentsInput.style, {
            width: '100%',
            minHeight: '90px',
            padding: '8px',
            resize: 'vertical',
            marginBottom: '12px'
        });

        const submitButton = document.createElement('button');

        submitButton.type = 'button';
        submitButton.textContent = 'Submit Grade';

        submitButton.dataset.homeworkId = homeworkId;
        submitButton.dataset.submissionId = submission._id;

        Object.assign(submitButton.style, {
            padding: '9px 18px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        });

        submitButton.addEventListener('click', async () => {
            await gradeHomework(
                homeworkId,
                submission._id
            );
        });

        gradeForm.appendChild(gradeLabel);
        gradeForm.appendChild(gradeInput);

        gradeForm.appendChild(commentsLabel);
        gradeForm.appendChild(commentsInput);

        gradeForm.appendChild(submitButton);

        submissionEl.appendChild(gradeForm);

        return submissionEl;
    }

    /* =========================================================
       GRADE HOMEWORK
       ========================================================= */

    async function gradeHomework(homeworkId, submissionId) {
        const gradeInput =
            document.getElementById(`grade-${submissionId}`);

        const commentsInput =
            document.getElementById(`comments-${submissionId}`);

        if (!gradeInput || !commentsInput) {
            showMessage(
                'Could not find the grading form.',
                'error'
            );
            return false;
        }

        const grade = Number(gradeInput.value);
        const comments = commentsInput.value.trim();

        if (
            !Number.isFinite(grade) ||
            grade < 0 ||
            grade > 100
        ) {
            showMessage(
                'Please enter a valid grade between 0 and 100.',
                'error'
            );
            return false;
        }

        if (!comments) {
            showMessage(
                'Please provide feedback for the student.',
                'error'
            );
            return false;
        }

        const token = requireToken();

        if (!token) {
            return false;
        }

        const submitButton =
            document.querySelector(
                `button[data-homework-id="${CSS.escape(String(homeworkId))}"][data-submission-id="${CSS.escape(String(submissionId))}"]`
            );

        if (!submitButton) {
            showMessage(
                'Could not find the grade button.',
                'error'
            );
            return false;
        }

        const originalText = submitButton.textContent;

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const response = await fetch(
                `${API_HOMEWORKS}/grade/${encodeURIComponent(homeworkId)}/${encodeURIComponent(submissionId)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        grade,
                        comments
                    })
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    'Failed to submit grade.'
                );
            }

            showMessage(
                'Grade submitted successfully!',
                'success'
            );

            const submissionElement =
                document.querySelector(
                    `.submission-item[data-submission-id="${CSS.escape(String(submissionId))}"]`
                );

            if (submissionElement) {
                const gradeForm =
                    submissionElement.querySelector('.grade-form');

                if (gradeForm) {
                    gradeForm.remove();
                }

                const gradeDisplay =
                    document.createElement('div');

                gradeDisplay.className = 'grade-display';

                gradeDisplay.innerHTML = `
                    <strong>Grade:</strong>
                    ${escapeHTML(grade)}%
                `;

                submissionElement.appendChild(gradeDisplay);

                const feedbackDisplay =
                    document.createElement('div');

                feedbackDisplay.className =
                    'feedback-display';

                Object.assign(feedbackDisplay.style, {
                    marginTop: '8px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '5px'
                });

                feedbackDisplay.innerHTML = `
                    <strong>Feedback:</strong>
                    ${escapeHTML(comments)}
                `;

                submissionElement.appendChild(
                    feedbackDisplay
                );
            }

            return true;

        } catch (error) {
            console.error(
                'Error submitting grade:',
                error
            );

            showMessage(
                error.message ||
                'Failed to submit grade.',
                'error'
            );

            submitButton.disabled = false;
            submitButton.textContent = originalText;

            return false;
        }
    }

    /* =========================================================
       DELETE HOMEWORK
       ========================================================= */

    async function deleteHomework(homeworkId) {
        if (!homeworkId) {
            showMessage(
                'Invalid homework ID.',
                'error'
            );
            return;
        }

        const confirmed = confirm(
            'Are you sure you want to delete this homework?'
        );

        if (!confirmed) {
            return;
        }

        const token = requireToken();

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                `${API_HOMEWORKS}/${encodeURIComponent(homeworkId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    'Failed to delete homework.'
                );
            }

            showMessage(
                'Homework deleted successfully!',
                'success'
            );

            await fetchHomeworks();

        } catch (error) {
            console.error(
                'Error deleting homework:',
                error
            );

            showMessage(
                error.message ||
                'Failed to delete homework.',
                'error'
            );
        }
    }

    /* =========================================================
       EDIT HOMEWORK
       ========================================================= */

    async function editHomework(homeworkId) {
        if (!homeworkId) {
            showMessage(
                'Invalid homework ID.',
                'error'
            );
            return;
        }

        const token = requireToken();

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                `${API_HOMEWORKS}/${encodeURIComponent(homeworkId)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    'Failed to fetch homework.'
                );
            }

            createEditHomeworkModal(
                homeworkId,
                data,
                token
            );

        } catch (error) {
            console.error(
                'Error fetching homework:',
                error
            );

            showMessage(
                error.message ||
                'Failed to load homework.',
                'error'
            );
        }
    }

    function createEditHomeworkModal(
        homeworkId,
        data,
        token
    ) {
        const backdrop =
            document.createElement('div');

        Object.assign(backdrop.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.55)',
            zIndex: '10000'
        });

        const modal =
            document.createElement('div');

        Object.assign(modal.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '10001',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            padding: '40px 20px'
        });

        const content =
            document.createElement('div');

        Object.assign(content.style, {
            background: '#fff',
            width: '100%',
            maxWidth: '600px',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        });

        content.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:20px;
            ">
                <h3 style="margin:0;">
                    Edit Homework
                </h3>

                <button
                    type="button"
                    class="edit-homework-close"
                    style="
                        background:none;
                        border:none;
                        font-size:28px;
                        cursor:pointer;
                    "
                >
                    &times;
                </button>
            </div>

            <form id="edit-homework-form">

                <div class="form-group" style="margin-bottom:15px;">
                    <label for="edit-title">
                        Title:
                    </label>

                    <input
                        type="text"
                        id="edit-title"
                        name="title"
                        value="${escapeHTML(data.title || '')}"
                        required
                        style="width:100%;padding:9px;"
                    />
                </div>

                <div class="form-group" style="margin-bottom:15px;">
                    <label for="edit-description">
                        Description:
                    </label>

                    <textarea
                        id="edit-description"
                        name="description"
                        required
                        style="width:100%;min-height:100px;padding:9px;"
                    >${escapeHTML(data.description || '')}</textarea>
                </div>

                <div class="form-group" style="margin-bottom:15px;">
                    <label for="edit-due-date">
                        Due Date:
                    </label>

                    <input
                        type="date"
                        id="edit-due-date"
                        name="dueDate"
                        required
                        style="width:100%;padding:9px;"
                    />
                </div>

                <div class="form-group" style="margin-bottom:15px;">
                    <label for="edit-class">
                        Class Assigned:
                    </label>

                    <input
                        type="text"
                        id="edit-class"
                        name="classAssigned"
                        value="${escapeHTML(data.classAssigned || '')}"
                        required
                        style="width:100%;padding:9px;"
                    />
                </div>

                <div class="form-group" style="margin-bottom:20px;">
                    <label for="edit-file">
                        Upload File (PDF/DOC/DOCX):
                    </label>

                    <input
                        type="file"
                        id="edit-file"
                        name="homework-file"
                        accept=".pdf,.doc,.docx"
                        style="width:100%;"
                    />
                </div>

                <div id="edit-homework-message"
                    style="margin-bottom:15px;">
                </div>

                <button
                    type="submit"
                    class="modern-btn"
                    style="
                        padding:10px 18px;
                        border:none;
                        border-radius:5px;
                        cursor:pointer;
                    "
                >
                    Update Homework
                </button>

            </form>
        `;

        // Correct date format for input[type=date]
        const dueDateInput =
            content.querySelector('#edit-due-date');

        if (data.dueDate) {
            const date = new Date(data.dueDate);

            if (!Number.isNaN(date.getTime())) {
                dueDateInput.value =
                    date.toISOString().split('T')[0];
            }
        }

        function close() {
            modal.remove();
            backdrop.remove();
        }

        content.querySelector(
            '.edit-homework-close'
        ).addEventListener('click', close);

        backdrop.addEventListener('click', close);

        const form =
            content.querySelector('#edit-homework-form');

        form.addEventListener('submit', async e => {
            e.preventDefault();

            const submitButton =
                form.querySelector('button[type="submit"]');

            const messageDiv =
                content.querySelector(
                    '#edit-homework-message'
                );

            try {
                submitButton.disabled = true;
                submitButton.textContent = 'Updating...';

                const formData =
                    new FormData(form);

                const response = await fetch(
                    `${API_HOMEWORKS}/${encodeURIComponent(homeworkId)}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    }
                );

                const result =
                    await parseResponse(response);

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        result.message ||
                        'Failed to update homework.'
                    );
                }

                messageDiv.textContent =
                    'Homework updated successfully!';

                messageDiv.style.color = 'green';

                showMessage(
                    'Homework updated successfully!',
                    'success'
                );

                setTimeout(async () => {
                    close();
                    await fetchHomeworks();
                }, 500);

            } catch (error) {
                console.error(
                    'Error updating homework:',
                    error
                );

                messageDiv.textContent =
                    error.message ||
                    'Failed to update homework.';

                messageDiv.style.color = 'red';

                submitButton.disabled = false;
                submitButton.textContent =
                    'Update Homework';
            }
        });

        modal.appendChild(content);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    }

    /* =========================================================
       TABS
       ========================================================= */

    function initializeTabs() {
        const tabs =
            document.querySelectorAll('.tab');

        const sections =
            document.querySelectorAll('.tab-section');

        tabs.forEach(tab => {
            if (tab.dataset.listenerAttached === 'true') {
                return;
            }

            tab.dataset.listenerAttached = 'true';

            tab.addEventListener('click', () => {
                tabs.forEach(t =>
                    t.classList.remove('active')
                );

                sections.forEach(section =>
                    section.classList.remove('active')
                );

                tab.classList.add('active');

                const sectionId =
                    tab.getAttribute('data-section');

                if (!sectionId) {
                    return;
                }

                const section =
                    document.getElementById(sectionId);

                if (section) {
                    section.classList.add('active');
                }

                if (sectionId === 'homework-section') {
                    fetchHomeworks();
                }

                if (sectionId === 'assignments-section') {
                    fetchAssignments();
                }
            });
        });
    }

    /* =========================================================
       MAKE FUNCTIONS AVAILABLE TO OTHER CODE
       ========================================================= */

    window.fetchHomeworks = fetchHomeworks;
    window.fetchAssignments = fetchAssignments;

    window.renderHomeworks = renderHomeworks;

    window.viewHomeworkSubmissions =
        viewHomeworkSubmissions;

    window.gradeHomework =
        gradeHomework;

    window.deleteHomework =
        deleteHomework;

    window.editHomework =
        editHomework;

    window.showMessage =
        showMessage;

    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initializeHomeworkSystem() {
        console.log('Initializing Homework & Assignment system...');

        initializeHomeworkCreation();
        initializeAssignmentCreation();

        initializeClassFilter();
        initializeTabs();

        // Load initial data
        fetchHomeworks();
        fetchAssignments();

        console.log(
            'Homework & Assignment system initialized.'
        );
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initializeHomeworkSystem,
            { once: true }
        );
    } else {
        initializeHomeworkSystem();
    }

})();

  /* ---------------------------
     TAB MANAGER (for tab switching)
     --------------------------- */
  class TabManager {
    /**
     * @param {string} tabLinksSelector - Selector for tab links (e.g., '.tab-link')
     * @param {string} tabSectionsSelector - Selector for tab sections (e.g., '.tab-section')
     */
    constructor(tabLinksSelector, tabSectionsSelector) {
      this.tabLinks = document.querySelectorAll(tabLinksSelector);
      this.tabSections = document.querySelectorAll(tabSectionsSelector);
      // Get default tab from URL hash or localStorage, or fallback to first tab
      this.defaultTab =
        window.location.hash.substring(1) ||
        localStorage.getItem('activeTab') ||
        (this.tabLinks.length > 0 ? this.tabLinks[0].getAttribute('data-tab') : null);
      this.init();
    }

    hideAllTabs() {
      this.tabSections.forEach((section) => {
        section.style.display = 'none';
        section.classList.remove('fade-in');
      });
      this.tabLinks.forEach((link) => link.classList.remove('active'));
    }

    showTab(tabId) {
      this.hideAllTabs();
      const targetSection = document.getElementById(tabId);
      if (targetSection) {
        targetSection.style.display = 'block';
        // Fade-in effect (ensure your CSS defines .fade-in with transition)
        setTimeout(() => targetSection.classList.add('fade-in'), 50);
      } else {
        console.warn(`No tab section found with ID: ${tabId}`);
      }
      // Mark corresponding link as active
      this.tabLinks.forEach((link) => {
        if (link.getAttribute('data-tab') === tabId) {
          link.classList.add('active');
        }
      });
      localStorage.setItem('activeTab', tabId);
      window.history.pushState(null, '', '#' + tabId);
    }

    handleHashChange() {
      const hash = window.location.hash.substring(1);
      if (hash) {
        this.showTab(hash);
      }
    }

    init() {
      this.tabLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const tabId = link.getAttribute('data-tab');
          this.showTab(tabId);
        });
      });
      window.addEventListener('hashchange', this.handleHashChange.bind(this));
      if (this.defaultTab) {
        this.showTab(this.defaultTab);
      }
    }
  }

  // Initialize the TabManager for teacher dashboard tabs
  new TabManager('.tab-link', '.tab-section');
  
  // Make homework-related functions available globally
  window.viewHomeworkSubmissions = viewHomeworkSubmissions;
  window.editHomework = editHomework;
  window.deleteHomework = deleteHomework;
  window.gradeHomework = gradeHomework;

  /* ---------------------------
     PROFILE MANAGEMENT
     --------------------------- */
  class TeacherProfile {
    constructor() {
      this.initProfileForm();
      this.initChangePhoto();
      this.initChangePassword();
    }
    initProfileForm() {
      const profileForm = document.getElementById('profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          // If there's a global showSuccess function, use it
          if (typeof showSuccess === 'function') {
            showSuccess('Profile updated successfully!');
          } else {
            // Fallback to console log if showSuccess is not available
            console.log('Profile updated successfully!');
          }
        });
      }
    }
    initChangePhoto() {
      const changePhotoBtn = document.getElementById('change-photo-btn');
      const photoUpload = document.getElementById('photo-upload');
      changePhotoBtn.addEventListener('click', () => {
        photoUpload.click();
      });
      photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            document.getElementById('profile-photo').src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
    initChangePassword() {
      const passwordForm = document.getElementById('password-form');
      if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
          e.preventDefault();
          alert('Password changed successfully!');
          passwordForm.reset();
        });
      }
    }
  }

  /* ---------------------------
     CLASS MANAGEMENT
     --------------------------- */
  class ClassManagement {
    constructor() {
      this.classes = [];
      this.modal = document.getElementById('class-modal');
      this.initViewDetails();
      this.initClassManagement();
      this.fetchClasses();
      this.setupModalCloseHandlers();
    }

    initViewDetails() {
      // Implementation for viewing class details
      const viewDetailBtns = document.querySelectorAll('.view-details-btn');
      viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const className = e.target.closest('li').querySelector('strong').innerText;
          // Display dummy class details; replace with actual details as needed.
          alert(`Viewing details for ${className}:\n- Teacher: Jane Smith\n- Students: ${className.includes('10A') ? '25' : '28'}\n- Room: 101`);
        });
      });
    }

    initClassManagement() {
      // Add event listener for the "Add Class" button
      const addClassBtn = document.getElementById('add-class-btn');
      if (addClassBtn) {
        addClassBtn.addEventListener('click', () => this.showAddClassModal());
      }

      // Add event listener for the class form submission
      const classForm = document.getElementById('class-form');
      if (classForm) {
        classForm.addEventListener('submit', (e) => this.handleClassFormSubmit(e));
      }
    }

    // Set up event handlers for closing the modal
    setupModalCloseHandlers() {
      // Close button
      const closeBtn = this.modal?.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal());
      }

      // Close when clicking outside the modal content
      this.modal?.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });

      // Close with Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.style.display === 'block') {
          this.closeModal();
        }
      });
    }

    // Show the add class modal
    showAddClassModal() {
      if (!this.modal) return;

      // Reset form
      const form = document.getElementById('class-form');
      if (form) {
        form.reset();
        form.dataset.editMode = 'false';
        form.dataset.classId = '';
      }

      // Set modal title
      const modalTitle = this.modal.querySelector('.modal-title');
      if (modalTitle) {
        modalTitle.textContent = 'Add New Class';
      }

      // Show the modal by adding the 'show' class
      this.modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    // Close the modal
    closeModal() {
      if (this.modal) {
        this.modal.classList.remove('show');
        document.body.style.overflow = ''; // Re-enable scrolling
      }
    }

    showEditClassModal(classId) {
      const classToEdit = this.classes.find(cls => cls.id === classId);
      if (!classToEdit) return;

      const modal = document.getElementById('class-modal');
      if (!modal) return;

      // Fill form with class data
      const form = document.getElementById('class-form');
      if (form) {
        form.className.value = classToEdit.name;
        form.level.value = classToEdit.level || '';
        form.section.value = classToEdit.section || '';
        form.capacity.value = classToEdit.capacity || '';
        form.teacherInCharge.value = classToEdit.teacherInCharge || '';
        form.roomNumber.value = classToEdit.roomNumber || '';
        form.academicYear.value = classToEdit.academicYear || '';
        form.notes.value = classToEdit.notes || '';
        
        // Set edit mode and class ID
        form.dataset.editMode = 'true';
        form.dataset.classId = classId;
      }

      // Set modal title
      const modalTitle = modal.querySelector('.modal-title');
      if (modalTitle) {
        modalTitle.textContent = 'Edit Class';
      }

      // Show the modal
      modal.style.display = 'block';
    }

    async handleClassFormSubmit(e) {
      e.preventDefault();
      
      const form = e.target;
      const isEditMode = form.dataset.editMode === 'true';
      const classId = form.dataset.classId;
      
      // Get form data
      const classData = {
        name: form.className.value.trim(),
        level: form.level.value.trim(),
        section: form.section.value.trim(),
        capacity: parseInt(form.capacity.value) || 0,
        teacherInCharge: form.teacherInCharge.value.trim(),
        roomNumber: form.roomNumber.value.trim(),
        academicYear: form.academicYear.value.trim(),
        notes: form.notes.value.trim()
      };

      // Basic validation
      if (!classData.name) {
        this.showMessage('Class name is required', 'error');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        let response;
        
        if (isEditMode && classId) {
          // Update existing class
          response = await fetch(`https://timiza-saas.onrender.com/api/classes/${classId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
          });
        } else {
          // Create new class
          response = await fetch('https://timiza-saas.onrender.com/api/classes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
          });
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to save class');
        }

        // Close the modal
        const modal = document.getElementById('class-modal');
        if (modal) modal.style.display = 'none';

        // Refresh the classes list
        this.fetchClasses();

        // Show success message
        this.showMessage(
          `Class ${isEditMode ? 'updated' : 'created'} successfully!`,
          'success'
        );

      } catch (error) {
        console.error('Error saving class:', error);
        this.showMessage(
          error.message || 'An error occurred while saving the class',
          'error'
        );
      }
    }

    async fetchClasses() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('https://timiza-saas.onrender.com/api/classes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }

        const data = await response.json();
        this.classes = data;
        this.renderClassesTable();

      } catch (error) {
        console.error('Error fetching classes:', error);
        this.showMessage(
          error.message || 'An error occurred while fetching classes',
          'error'
        );
      }
    }

    renderClassesTable() {
      const tableBody = document.getElementById('classes-table-body');
      if (!tableBody) return;

      // Clear existing rows
      tableBody.innerHTML = '';

      if (this.classes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="7" class="text-center">No classes found. Click "Add Class" to create one.</td>
        `;
        tableBody.appendChild(row);
        return;
      }

      // Add each class to the table
      this.classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${cls.name}</td>
          <td>${cls.level || '-'}</td>
          <td>${cls.section || '-'}</td>
          <td>${cls.teacherInCharge || '-'}</td>
          <td>${cls.capacity || '0'}</td>
          <td>${cls.studentCount || '0'}/${cls.capacity || '0'}</td>
          <td class="actions">
            <button class="btn-action btn-edit-class" data-id="${cls.id}">Edit</button>
            <button class="btn-action btn-delete-class" data-id="${cls.id}">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Add event listeners to the action buttons
      this.setupClassActionButtons();
    }

    setupClassActionButtons() {
      // Edit buttons
      document.querySelectorAll('.btn-edit-class').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const classId = e.currentTarget.dataset.id;
          this.showEditClassModal(classId);
        });
      });

      // Delete buttons
      document.querySelectorAll('.btn-delete-class').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const classId = e.currentTarget.dataset.id;
          const classToDelete = this.classes.find(cls => cls.id === classId);
          
          if (!classToDelete) return;

          if (confirm(`Are you sure you want to delete the class "${classToDelete.name}"? This action cannot be undone.`)) {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('No authentication token found');
              }

              const response = await fetch(`https://timiza-saas.onrender.com/api/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete class');
              }


              // Refresh the classes list
              this.fetchClasses();

              // Show success message
              this.showMessage('Class deleted successfully!', 'success');

            } catch (error) {
              console.error('Error deleting class:', error);
              this.showMessage(
                error.message || 'An error occurred while deleting the class',
                'error'
              );
            }
          }
        });
      });
    }

    showMessage(message, type = 'info') {
      const messageDiv = document.getElementById('class-message');
      if (!messageDiv) return;

      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type}`;
      messageDiv.style.display = 'block';

      // Hide the message after 5 seconds
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  /* ---------------------------
     TEACHER DASHBOARD FUNCTIONALITIES
     --------------------------- */
  class TeacherDashboard {
    constructor() {
      // Initialize Profile and Class Management functionalities
      new TeacherProfile();
      new ClassManagement();
      
      // Check authentication
      if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
      }
      
      // Initialize attendance management
      this.currentClass = null;
      this.students = [];
      this.attendanceRecords = new Map(); // studentId -> {status, remarks}
      
      // Initialize all functionalities
      this.initAssignmentManagement();
      this.initGradeManagement();
      this.initAddGradeForm();
      this.initAnnouncements();
      this.initAttendanceManagement();
      this.initCommunicationManagement();
      this.initResourceUpload();
      this.initDownloadReport();
      this.initReportCardUpload();
      this.fetchReportCards();
      this.loadStudentsForReportCardDropdown();
    }
    
    // Show message to user
    showMessage(message, type = 'info') {
      // Create message element if it doesn't exist
      let messageDiv = document.getElementById('message-container');
      if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message-container';
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';
        document.body.appendChild(messageDiv);
      }

      // Create message element
      const messageEl = document.createElement('div');
      messageEl.className = `message ${type}`;
      messageEl.style.padding = '10px 15px';
      messageEl.style.marginBottom = '10px';
      messageEl.style.borderRadius = '4px';
      messageEl.style.color = '#fff';
      messageEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(20px)';
      messageEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      // Set background color based on message type
      const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      };
      messageEl.style.backgroundColor = colors[type] || colors.info;
      
      messageEl.textContent = message;
      
      // Add to container
      messageDiv.insertBefore(messageEl, messageDiv.firstChild);
      
      // Animate in
      setTimeout(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateX(0)';
      }, 10);
      
      // Auto-remove after delay
      setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(20px)';
        setTimeout(() => messageEl.remove(), 300);
      }, 5000);
    }



  /* ------------------
   ATTENDANCE MANAGEMENT
   ------------------ */
  initAttendanceManagement() {
    // Initialize date picker with today's date
    const dateInput = document.getElementById('attendance-date');
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) {
      dateInput.value = today;
    }

    // Initialize past attendance date range
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    if (startDate && endDate) {
      startDate.value = new Date(today).toISOString().split('T')[0];
      endDate.value = new Date(today).toISOString().split('T')[0];
    }

    // Handle class selection for both current and past attendance
    const classSelect = document.getElementById('attendance-class');
    const pastClassSelect = document.getElementById('past-class');
    if (classSelect) {
      classSelect.addEventListener('change', (e) => this.onClassSelected(e.target.value));
    }
    if (pastClassSelect) {
      pastClassSelect.addEventListener('change', () => {
        this.showPastAttendance();
      });
    }

    // Handle view attendance button
    const viewAttendanceBtn = document.getElementById('view-attendance-btn');
    if (viewAttendanceBtn) {
      viewAttendanceBtn.addEventListener('click', async () => {
        try {
          const selectedClass = document.getElementById('past-class').value;
          const startDate = document.getElementById('start-date').value;
          const endDate = document.getElementById('end-date').value;

          if (!selectedClass || !startDate || !endDate) {
            this.showMessage('Please select a class and date range', 'error');
            return;
          }

          viewAttendanceBtn.disabled = true;
          viewAttendanceBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...';

          await this.showPastAttendance();

          viewAttendanceBtn.disabled = false;
          viewAttendanceBtn.innerHTML = '<i class="fas fa-search"></i> View Attendance Records';

        } catch (error) {
          console.error('Error in view attendance button:', error);
          this.showMessage('Failed to load attendance records: ' + error.message, 'error');
          viewAttendanceBtn.disabled = false;
          viewAttendanceBtn.innerHTML = '<i class="fas fa-search"></i> View Attendance Records';
        }
      });
    }

    // Handle save attendance
    const saveBtn = document.getElementById('save-attendance-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAttendance());
    }
  }
  
  // Handle class selection
  async onClassSelected(className) {
    if (!className) {
      const studentsList = document.getElementById('students-list');
      if (studentsList) studentsList.style.display = 'none';
      const attendanceSummary = document.getElementById('attendance-summary');
      if (attendanceSummary) attendanceSummary.style.display = 'none';
      return;
    }
    
    this.currentClass = className;
    
    try {
      // Show loading state
      const studentsList = document.getElementById('attendance-students-list');
      if (studentsList) {
        studentsList.innerHTML = '<tr><td colspan="3" class="text-center">Loading students...</td></tr>';
      }
      
      // Show the students list
      const studentsListContainer = document.getElementById('students-list');
      if (studentsListContainer) {
        studentsListContainer.style.display = 'block';
      }
      
      // Fetch students for the selected class
      await this.fetchStudentsForClass(className);
      
      // Render the students list
      this.renderStudentsList();
      
      // Show attendance summary
      const attendanceSummary = document.getElementById('attendance-summary');
      if (attendanceSummary) {
        attendanceSummary.style.display = 'block';
      }
      this.updateSummary();
      
    } catch (error) {
      console.error('Error loading students:', error);
      this.showMessage('Failed to load students: ' + error.message, 'error');
    }
  }
  
  // Fetch students for a specific class
  async fetchStudentsForClass(className) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }
      
      // Show loading state
      const studentsList = document.getElementById('attendance-students-list');
      if (studentsList) {
        studentsList.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div> Loading students...</td></tr>';
      }
      
      // Use the correct backend URL (port 5000)
      const baseUrl = 'https://timiza-saas.onrender.com';
      const apiUrl = `${baseUrl}/api/students/class/${encodeURIComponent(className)}`;
      
      console.log('Fetching students from:', apiUrl);
      
      // Fetch students from the backend API
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies in the request
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch students');
      }
      
      if (!result.data || !Array.isArray(result.data)) {
        console.error('Invalid data format received:', result);
        throw new Error('Invalid data format received from server');
      }
      
      // Map the API response to the expected format
      this.students = result.data.map(student => ({
        id: student._id || student.id,
        name: student.name || 'Unknown Student',
        email: student.email || '',
        className: student.class || student.profile?.class || className || 'N/A'
      }));
      
      console.log('Mapped students:', this.students);
      
      // Initialize attendance records with default values
      this.attendanceRecords = new Map();
      this.students.forEach(student => {
        this.attendanceRecords.set(student.id, { 
          status: 'present', 
          remarks: '' 
        });
      });
      
      return this.students;
      
    } catch (error) {
      console.error('Error fetching students:', error);
      
      // Update UI to show error
      const studentsList = document.getElementById('attendance-students-list');
      if (studentsList) {
        studentsList.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-danger">
              <div>Error loading students</div>
              <div class="small">${error.message || 'Please try again'}</div>
              <button class="btn btn-sm btn-outline-secondary mt-2" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Retry
              </button>
            </td>
          </tr>`;
      }
      
      this.showMessage(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // Render students list with attendance options
  renderStudentsList() {
    const studentsList = document.getElementById('attendance-students-list');
    if (!studentsList) return;
    
    if (this.students.length === 0) {
      studentsList.innerHTML = '<tr><td colspan="3" class="text-center">No students found in this class.</td></tr>';
      return;
    }
    
    studentsList.innerHTML = this.students.map(student => {
      const record = this.attendanceRecords.get(student.id) || { status: 'present', remarks: '' };
      return `
        <tr data-student-id="${student.id}">
          <td>${student.name}</td>
          <td>
            <select class="form-control form-control-sm attendance-status" 
                    data-student-id="${student.id}">
              <option value="present" ${record.status === 'present' ? 'selected' : ''}>Present</option>
              <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>Absent</option>
              <option value="late" ${record.status === 'late' ? 'selected' : ''}>Late</option>
              <option value="excused" ${record.status === 'excused' ? 'selected' : ''}>Excused</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control form-control-sm attendance-remarks" 
                   data-student-id="${student.id}" 
                   value="${record.remarks || ''}"
                   placeholder="Remarks (optional)">
          </td>
        </tr>
      `;
    }).join('');
    
    // Add event listeners
    document.querySelectorAll('.attendance-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const studentId = e.target.dataset.studentId;
        const status = e.target.value;
        this.updateAttendanceRecord(studentId, 'status', status);
        this.updateSummary();
      });
    });
    
    document.querySelectorAll('.attendance-remarks').forEach(input => {
      input.addEventListener('change', (e) => {
        const studentId = e.target.dataset.studentId;
        const remarks = e.target.value;
        this.updateAttendanceRecord(studentId, 'remarks', remarks);
      });
    });
  }
  
  // Update attendance record
  updateAttendanceRecord(studentId, field, value) {
    const record = this.attendanceRecords.get(studentId) || { status: 'present', remarks: '' };
    record[field] = value;
    this.attendanceRecords.set(studentId, record);
  }
  
  // Update attendance summary
  updateSummary() {
    if (!this.students.length) return;
    
    let presentCount = 0;
    let absentCount = 0;
    
    this.attendanceRecords.forEach(record => {
      if (record.status === 'present' || record.status === 'late') {
        presentCount++;
      } else if (record.status === 'absent') {
        absentCount++;
      }
    });
    
    const presentCountEl = document.getElementById('present-count');
    const absentCountEl = document.getElementById('absent-count');
    const totalCountEl = document.getElementById('total-count');
    
    if (presentCountEl) presentCountEl.textContent = presentCount;
    if (absentCountEl) absentCountEl.textContent = absentCount;
    if (totalCountEl) totalCountEl.textContent = this.students.length;
  }

  // Show past attendance records
  async showPastAttendance() {
    const pastClassSelect = document.getElementById('past-class');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (!pastClassSelect || !startDate || !endDate) {
      this.showMessage('Please select class and date range', 'error');
      return;
    }

    const selectedClass = pastClassSelect.value;
    const start = startDate.value;
    const end = endDate.value;

    if (!selectedClass || !start || !end) {
      this.showMessage('Please select class and date range', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      const baseUrl = 'https://timiza-saas.onrender.com';
      const response = await fetch(`${baseUrl}/api/attendance/history?class=${encodeURIComponent(selectedClass)}&start=${start}&end=${end}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const records = await response.json();
      console.log('Past attendance records:', records);

      const recordsList = document.getElementById('past-attendance-records');
      if (!recordsList) return;

      // Calculate attendance statistics for each record
      const attendanceStats = records.map(record => {
        const present = record.records.filter(r => r.status === 'present' || r.status === 'late').length;
        const absent = record.records.filter(r => r.status === 'absent').length;
        const total = record.records.length;
        return {
          date: new Date(record.date).toLocaleDateString(),
          class: record.class,
          present,
          absent,
          total,
          _id: record._id
        };
      });

      // Sort records by date in descending order
      attendanceStats.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Helper function to build the correct details URL
function getDetailsPageUrl(id) {
  const needsHtml = !window.location.hostname.includes('localhost');
  const fileName = needsHtml ? 'attendance-details.html' : 'attendance-details';
  return `/pages/${fileName}?id=${encodeURIComponent(id)}`;
}

// Render the records table
recordsList.innerHTML = attendanceStats.map(record => `
  <tr>
    <td>${record.date}</td>
    <td>${record.class}</td>
    <td>${record.present}</td>
    <td>${record.absent}</td>
    <td>${record.total}</td>
    <td>
      <button class="btn btn-sm btn-info attendance-details-btn" 
              data-id="${record._id.toString()}">
        <i class="fas fa-eye"></i> View Details
      </button>
    </td>
  </tr>
`).join('');

// Add click handlers after rendering
document.querySelectorAll('.attendance-details-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    console.log('Button clicked with ID:', id);
    if (id) {
      const fullUrl = getDetailsPageUrl(id);
      console.log('Navigating to:', fullUrl);
      window.location.href = fullUrl;
    } else {
      console.error('No ID found on button');
    }
  });
});

// Add click handler for details buttons
const detailsButtons = document.querySelectorAll('.attendance-details-btn');
if (detailsButtons.length === 0) {
  console.error('No details buttons found');
  return;
}

detailsButtons.forEach(button => {
  const id = button.dataset.id;
  if (!id) {
    console.error('Button missing ID');
    return;
  }

  button.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = getDetailsPageUrl(id);
  });

  button.style.cursor = 'pointer';
  button.addEventListener('mouseover', () => {
    button.style.opacity = '0.9';
  });
  button.addEventListener('mouseout', () => {
    button.style.opacity = '1';
  });
});

// Add MutationObserver to handle dynamically added buttons
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.classList.contains('attendance-details-btn')) {
        const id = node.dataset.id;
        if (!id) {
          console.error('Dynamically added button missing ID');
          return;
        }

        node.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = getDetailsPageUrl(id);
        });

        node.style.cursor = 'pointer';
        node.addEventListener('mouseover', () => {
          node.style.opacity = '0.9';
        });
        node.addEventListener('mouseout', () => {
          node.style.opacity = '1';
        });
      }
    });
  });
});

// Start observing the table body
const tableBody = document.querySelector('#past-attendance-records');
if (tableBody) {
  observer.observe(tableBody, { childList: true, subtree: true });
} else {
  console.error('Table body not found');
}

// Show the records list
const pastAttendanceList = document.getElementById('past-attendance-list');
if (pastAttendanceList) {
  pastAttendanceList.style.display = 'block';
}

if (attendanceStats.length === 0) {
  this.showMessage('No attendance records found for the selected period', 'info');
}

} catch (error) {
  console.error('Error fetching past attendance:', error);
  this.showMessage('Failed to fetch attendance records: ' + (error.message || 'Please try again'), 'error');
}
}

// Save attendance to the server
async saveAttendance() {
  if (!this.currentClass) {
    this.showMessage('Please select a class first', 'error');
    return;
  }

  const dateInput = document.getElementById('attendance-date');
  if (!dateInput || !dateInput.value) {
    this.showMessage('Please select a date', 'error');
    return;
  }

  const date = dateInput.value;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    // Show loading state
    const saveBtn = document.getElementById('save-attendance-btn');
    const originalBtnText = saveBtn ? saveBtn.innerHTML : 'Save';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Saving...';
    }

    // Prepare attendance data
    const attendanceData = {
      class: this.currentClass,
      date: date,
      records: Array.from(this.attendanceRecords.entries()).map(([studentId, record]) => ({
        studentId,
        status: record.status,
        remarks: record.remarks || ''
      }))
    };

    console.log('Saving attendance data:', attendanceData);

    // Send attendance data to the backend API
    const baseUrl = 'https://timiza-saas.onrender.com';
    const response = await fetch(`${baseUrl}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(attendanceData)
    });

    // Restore button state
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnText;
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Attendance saved successfully:', result);

    this.showMessage('Attendance saved successfully!', 'success');

    // Refresh the attendance data to show the saved state
    await this.onClassSelected(this.currentClass);

  } catch (error) {
    console.error('Error saving attendance:', error);
    this.showMessage('Failed to save attendance: ' + (error.message || 'Please try again'), 'error');

    // Restore button state in case of error
    const saveBtn = document.getElementById('save-attendance-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Attendance';
    }
  }
}

  /* ------------------
   ASSIGNMENTS MANAGEMENT
   ------------------ */
  initAssignmentManagement() {
    const createAssignmentForm = document.getElementById('create-assignment-form');
    if (createAssignmentForm) {
      createAssignmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createAssignment();
      });
    }
    // Bind fetchAssignments to the current instance and call it
    this.fetchAssignments = this.fetchAssignments.bind(this);
    this.createAssignment = this.createAssignment.bind(this);
    // Fetch and display existing assignments on page load
    this.fetchAssignments();
  }

// Fetch assignments from the server with authentication
async fetchAssignments() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in again!');
    }
    const response = await fetch('https://timiza-saas.onrender.com/api/assignments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const assignments = await response.json();
      const assignmentList = document.getElementById('assignment-list');
      if (assignmentList) {
        assignmentList.innerHTML = '';
        assignments.forEach(assignment => this.addAssignmentToDOM(assignment));
      } else {
        console.log('Assignment list element not found');
      }
    } else if (response.status === 401) {
      alert('Session expired. Please log in again.');
      window.location.href = 'login.html';
    } else {
      console.error('Error fetching assignments from the server');
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    alert('Error fetching assignments. Please try again later.');
  }
}

// Add assignment to DOM
addAssignmentToDOM(assignment) {
  const li = document.createElement('li');
  li.classList.add('assignment');
  li.innerHTML = `<strong>${assignment.title}:</strong> Due ${new Date(assignment.dueDate).toLocaleDateString()}<br>${assignment.description ? assignment.description : ''}<br>Class: ${assignment.classAssigned ? assignment.classAssigned : ''}`;
  document.getElementById('assignment-list').appendChild(li);
}

// Create a new assignment and send to the server with authentication
async createAssignment() {
  const form = document.getElementById('create-assignment-form');
  const formData = new FormData(form);
  const msgDiv = document.getElementById('assignment-create-msg');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in again!');
    const response = await fetch('https://timiza-saas.onrender.com/api/assignments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set 'Content-Type' when sending FormData
      },
      body: formData,
    });
    if (response.ok) {
      msgDiv.style.display = 'block';
      msgDiv.style.color = 'green';
      msgDiv.textContent = 'Assignment created successfully!';
      form.reset();
      this.fetchAssignments();
    } else if (response.status === 401) {
      alert('Session expired. Please log in again.');
      window.location.href = 'login.html';
    } else {
      const errorData = await response.json().catch(() => ({}));
      msgDiv.style.display = 'block';
      msgDiv.style.color = 'red';
      msgDiv.textContent = errorData.error
        ? `Error creating assignment: ${errorData.error}`
        : 'Error creating assignment.';
    }
  } catch (error) {
    msgDiv.style.display = 'block';
    msgDiv.style.color = 'red';
    msgDiv.textContent = 'Something went wrong!';
    console.error('Error creating assignment:', error);
  }
}

    /* ------------------
       GRADES MANAGEMENT
       ------------------ */
    initGradeManagement() {
      const gradesTable = document.getElementById('grades-table');
      if (gradesTable) {
        // Fetch grades from backend and render
        const token = localStorage.getItem('token');
        const API_BASE_URL = 'https://timiza-saas.onrender.com';
        fetch(`${API_BASE_URL}/api/grades`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch grades');
          return response.json();
        })
        .then(grades => {
          const tbody = gradesTable.querySelector('tbody');
          tbody.innerHTML = '';
          grades.forEach(grade => {
            const studentName = grade.student && grade.student.name ? grade.student.name : (grade.student || '');
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${studentName}</td>
              <td>${grade.subject}</td>
              <td>${grade.grade || grade.score || ''}</td>
              <td>${grade.comments || ''}</td>
              <td><button class="edit-grade-btn">Edit</button></td>
            `;
            row.dataset.gradeId = grade._id || grade.id;
            tbody.appendChild(row);
          });
        })
        .catch(err => {
          const tbody = gradesTable.querySelector('tbody');
          tbody.innerHTML = '<tr><td colspan="5">Failed to load grades</td></tr>';
          console.error('Failed to load grades:', err);
        });
        // Add edit button handler
        gradesTable.addEventListener('click', (event) => {
          if (event.target.classList.contains('edit-grade-btn')) {
            const row = event.target.closest('tr');
            this.editGrade(row);
          }
        });
      }
    }

    editGrade(row) {
      const studentName = row.cells[0].innerText;
      const subject = row.cells[1].innerText;
      const currentGrade = row.cells[2].innerText;
      const newGrade = prompt(`Enter new grade for ${studentName} in ${subject}:`, currentGrade);
      if (newGrade) {
        row.cells[2].innerText = newGrade;
        this.updateGradeInStorage(studentName, subject, newGrade);
        const gradeId = row.dataset.gradeId;
        if (gradeId) {
          fetch(`/api/grades/${gradeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ grade: newGrade }),
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to update grade');
          })
          .catch(error => {
            alert('Failed to update grade on server!');
            console.error(error);
          });
        } else {
          alert('No grade ID found for this row. Please refresh or re-add grade.');
        }
      }
    }

    updateGradeInStorage(studentName, subject, newGrade) {
      let gradesData = JSON.parse(localStorage.getItem('gradesData')) || [];
      let gradeUpdated = false;
      for (let i = 0; i < gradesData.length; i++) {
        if (gradesData[i].student === studentName &&
            gradesData[i].subject.toLowerCase() === subject.toLowerCase()) {
          gradesData[i].grade = newGrade;
          gradeUpdated = true;
          break;
        }
      }
      if (!gradeUpdated) {
        gradesData.push({ student: studentName, subject: subject, grade: newGrade });
      }
      localStorage.setItem('gradesData', JSON.stringify(gradesData));
    }

    /* ------------------
       ADD GRADE FORM FUNCTIONALITY
       ------------------ */
    initAddGradeForm() {
      const addGradeForm = document.getElementById('add-grade-form');
      if (addGradeForm) {
        addGradeForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const studentSelect = document.getElementById('student-name');
          const studentId = studentSelect.value;
          const studentName = studentSelect.options[studentSelect.selectedIndex].text;
          const subject = document.getElementById('subject').value.trim();
          const grade = document.getElementById('grade').value.trim();
          const comments = document.getElementById('Comments').value.trim();
          if (studentId && subject && grade) {
            this.addGrade(studentId, studentName, subject, grade, comments);
            addGradeForm.reset();
          }
        });
      }
    }

    addGrade(studentId, studentName, subject, grade, comments) {
      const tableBody = document.querySelector('#grades-table tbody');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${studentName}</td>
        <td>${subject}</td>
        <td>${grade}</td>
        <td>${comments || ""}</td>
        <td><button class="edit-grade-btn">Edit</button></td>
      `;
      tableBody.appendChild(row);
      this.updateGradeInStorage(studentName, subject, grade);
      const API_BASE_URL = 'https://timiza-saas.onrender.com';
      fetch(`${API_BASE_URL}/api/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': 'Bearer ' + localStorage.getItem('token') } : {})
        },
        body: JSON.stringify({ student: studentId, subject, score: grade, comments }),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to add grade');
        return response.json();
      })
      .then(data => {
        row.dataset.gradeId = data.grade?._id || data.grade?.id;
      })
      .catch(error => {
        alert('Failed to save grade to server!');
        console.error(error);
      });
    }

  /* ------------------
   ANNOUNCEMENTS MANAGEMENT
------------------ */
initAnnouncementManagement() {
  const announcementForm = document.getElementById('announcement-form');
  if (announcementForm) {
    announcementForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const textInput = document.getElementById('announcement-text');
      const text = textInput.value.trim();

      if (text !== '') {
        this.postAnnouncement(text);
        announcementForm.reset();
      }
    });
  }

  // Fetch announcements on page load
  this.fetchAnnouncements();
}

postAnnouncement(text) {
  const token = localStorage.getItem('token');

  fetch('https://timiza-saas.onrender.com/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`Failed to post announcement: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>New Announcement:</strong> ${data.announcement.text}`;
    const announcementsList = document.querySelector('#announcements ul');
    if (announcementsList) {
      announcementsList.prepend(li); // adds it to top
    }
  })
  .catch(err => {
    console.error('Error posting announcement:', err);
    alert('Failed to post announcement. Please try again.');
  });
}

fetchAnnouncements() {
  const token = localStorage.getItem('token');

  fetch('https://timiza-saas.onrender.com/api/announcements', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`Failed to fetch announcements: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    const announcementsList = document.querySelector('#announcements ul');
    if (!announcementsList) return;

    announcementsList.innerHTML = ''; // Clear old list

    data.forEach(announcement => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Announcement:</strong> ${announcement.text}`;
      announcementsList.appendChild(li);
    });
  })
  .catch(err => {
      });
    }

    markAttendance(className) {
      const presentCount = prompt(`Enter number of students present in ${className}:`);
      if (presentCount) {
        alert(`Attendance updated for ${className}: ${presentCount} students present.`);
      }
    }

    /* ------------------
       COMMUNICATION MANAGEMENT
       ------------------ */
    initCommunicationManagement() {
      const communicationForm = document.getElementById('communication-form');
      if (communicationForm) {
        communicationForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const recipient = document.getElementById('message-recipient').value;
          const message = document.getElementById('message-text').value;
          if (message.trim() !== '') {
            this.sendMessage(recipient, message);
            communicationForm.reset();
          }
        });
      }
    }

    sendMessage(recipient, message) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>To ${recipient}:</strong> ${message}`;
      const communicationLog = document.querySelector('#communication-log ul');
      if (communicationLog) {
        communicationLog.appendChild(li);
      }
    }

    /* ------------------
       ANNOUNCEMENTS MANAGEMENT
       ------------------ */
    initAnnouncements() {
      // Bind methods to current instance
      this.addAnnouncement = this.addAnnouncement.bind(this);
      this.saveAnnouncement = this.saveAnnouncement.bind(this);
      this.loadAnnouncements = this.loadAnnouncements.bind(this);
      this.setupAnnouncementDeletion = this.setupAnnouncementDeletion.bind(this);

      // Handle announcement form submission
      const announcementForm = document.getElementById('announcement-form');
      if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const announcementText = document.getElementById('announcement-text').value.trim();
          if (announcementText) {
            this.saveAnnouncement(announcementText);
            announcementForm.reset();
          }
        });
      }

      // Load existing announcements
      this.loadAnnouncements();
      
      // Set up delete handlers for existing buttons
      this.setupAnnouncementDeletion();
    }
    
    async saveAnnouncement(text) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in again!');
        }
        
        const response = await fetch('https://timiza-saas.onrender.com/api/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const announcement = responseData.announcement || responseData;
          
          if (!announcement) {
            throw new Error('Invalid response format from server');
          }
          
          this.addAnnouncement(
            announcement.text || 'No content', 
            new Date(announcement.createdAt || announcement.date || new Date()),
            announcement._id || announcement.id || null
          );
          this.showMessage('Announcement posted successfully', 'success');
        } else {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to save announcement');
        }
      } catch (error) {
        console.error('Error saving announcement:', error);
        this.showMessage(error.message || 'Failed to post announcement', 'error');
      }
    }
    
    async loadAnnouncements() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in again!');
        }
        
        const response = await fetch('https://timiza-saas.onrender.com/api/announcements', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          // Handle both array response and object with announcements property
          const announcements = Array.isArray(responseData) ? 
            responseData : 
            (responseData.announcements || []);
            
          const announcementsList = document.getElementById('announcements-list');
          if (announcementsList) {
            announcementsList.innerHTML = ''; // Clear existing announcements
            announcements.reverse().forEach(announcement => {
              if (announcement) {
                this.addAnnouncement(
                  announcement.text || 'No content', 
                  new Date(announcement.createdAt || announcement.date || new Date()),
                  announcement._id || announcement.id || null
                );
              }
            });
          }
        } else {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to load announcements');
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
        this.showMessage('Failed to load announcements', 'error');
      }
    }

    addAnnouncement(text, date = null, id = null) {
      const announcementsList = document.getElementById('announcements-list');
      if (!announcementsList) return;

      // Ensure date is a valid Date object
      let announcementDate = date;
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        announcementDate = new Date();
      }

      const formattedDate = announcementDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const announcementItem = document.createElement('li');
      announcementItem.className = 'announcement-item';
      announcementItem.style.display = 'flex';
      announcementItem.style.justifyContent = 'space-between';
      announcementItem.style.alignItems = 'flex-start';
      announcementItem.style.padding = '12px';
      announcementItem.style.marginBottom = '10px';
      announcementItem.style.backgroundColor = '#f8f9fa';
      announcementItem.style.borderRadius = '6px';
      announcementItem.style.borderLeft = '4px solid #3498db';
      
      // Add ID if provided
      if (id) {
        announcementItem.dataset.id = id;
      }

      // Add fade-in animation
      announcementItem.style.opacity = '0';
      announcementItem.style.transform = 'translateY(10px)';
      announcementItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      announcementItem.innerHTML = `
        <div>
          <strong>New Announcement:</strong> ${text}
          <div class="announcement-meta" style="font-size: 0.85em; color: #6c757d; margin-top: 5px;">
            Posted on: ${formattedDate}
          </div>
        </div>
        <button class="delete-announcement-btn" style="background: none; border: 1px solid #e74c3c; color: #e74c3c; border-radius: 4px; padding: 4px 8px; cursor: pointer; transition: all 0.2s ease;" title="Delete Announcement">
          <i class="fas fa-trash"></i>
        </button>
      `;

      // Add to the top of the list
      if (announcementsList.firstChild) {
        announcementsList.insertBefore(announcementItem, announcementsList.firstChild);
      } else {
        announcementsList.appendChild(announcementItem);
      }

      // Trigger reflow and animate in
      setTimeout(() => {
        announcementItem.style.opacity = '1';
        announcementItem.style.transform = 'translateY(0)';
      }, 10);

      // Setup delete handler for the new button
      const deleteBtn = announcementItem.querySelector('.delete-announcement-btn');
      if (deleteBtn) {
        this.setupDeleteButton(deleteBtn);
      }
    }

    setupAnnouncementDeletion() {
      const announcementsList = document.getElementById('announcements-list');
      if (!announcementsList) return;

      // Setup for existing delete buttons
      const deleteButtons = announcementsList.querySelectorAll('.delete-announcement-btn');
      deleteButtons.forEach(button => {
        this.setupDeleteButton(button);
      });
    }

    async deleteAnnouncement(announcementId, announcementItem) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in again!');
        }
        
        const response = await fetch(`https://timiza-saas.onrender.com/api/announcements/${announcementId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Add fade-out animation
          announcementItem.style.opacity = '0';
          announcementItem.style.transform = 'translateX(-20px)';
          announcementItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          
          // Remove after animation completes
          setTimeout(() => {
            announcementItem.remove();
            this.showMessage('Announcement deleted successfully', 'success');
          }, 300);
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete announcement');
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
        this.showMessage(error.message || 'Failed to delete announcement', 'error');
      }
    }
    
    setupDeleteButton(button) {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const announcementItem = button.closest('.announcement-item');
        if (!announcementItem) return;
        
        const announcementId = announcementItem.dataset.id;
        if (!announcementId) {
          // If no ID, just remove from DOM (for client-side only items)
          if (confirm('Are you sure you want to delete this announcement?')) {
            announcementItem.style.opacity = '0';
            announcementItem.style.transform = 'translateX(-20px)';
            announcementItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
              announcementItem.remove();
              this.showMessage('Announcement deleted', 'success');
            }, 300);
          }
          return;
        }
        
        if (confirm('Are you sure you want to delete this announcement?')) {
          await this.deleteAnnouncement(announcementId, announcementItem);
        }
      });

      // Add hover effects
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#f8d7da';
        button.style.color = '#c0392b';
        button.style.transform = 'scale(1.05)';
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'transparent';
        button.style.color = '#e74c3c';
        button.style.transform = 'scale(1)';
      });
    }

    /* ------------------
       RESOURCES MANAGEMENT
       ------------------ */
    initResourceUpload() {
      // Get the resource list container
      const resourceList = document.getElementById('resource-list');
      if (!resourceList) return;
      
      // Add initial styles to the resource list
      resourceList.style.listStyle = 'none';
      resourceList.style.padding = '0';
      resourceList.style.margin = '0';
      
      // Handle upload button
      const uploadResourceBtn = document.getElementById('submit-resource-btn');
      if (uploadResourceBtn) {
        uploadResourceBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const resourceName = prompt("Enter resource name:");
          if (resourceName) {
            // Create list item
            const li = document.createElement('li');
            li.className = 'resource-item';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '10px';
            li.style.margin = '5px 0';
            li.style.backgroundColor = '#f8f9fa';
            li.style.borderRadius = '4px';
            li.style.borderLeft = '4px solid #3498db';
            
            // Create resource link
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'resource-link';
            link.textContent = resourceName;
            link.style.color = '#2c3e50';
            link.style.textDecoration = 'none';
            link.style.flexGrow = '1';
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-resource-btn';
            deleteBtn.title = 'Delete Resource';
            
            // Create icon element
            const icon = document.createElement('i');
            icon.className = 'fas fa-trash';
            icon.style.fontSize = '16px';  // Ensure icon has a visible size
            
            // Append icon to button
            deleteBtn.appendChild(icon);
            
            // Style the button
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = '1px solid #e74c3c';
            deleteBtn.style.color = '#e74c3c';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.padding = '5px 10px';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.style.display = 'inline-flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.transition = 'all 0.2s ease';
            
            // Add hover effect
            deleteBtn.onmouseover = function() {
              this.style.backgroundColor = '#f8d7da';
              this.style.color = '#c0392b';
              this.style.transform = 'scale(1.05)';
            };
            
            deleteBtn.onmouseout = function() {
              this.style.backgroundColor = 'transparent';
              this.style.color = '#e74c3c';
              this.style.transform = 'scale(1)';
            };
            
            // Add hover effect
            deleteBtn.onmouseover = () => {
              deleteBtn.style.backgroundColor = '#f8d7da';
              deleteBtn.style.color = '#c0392b';
              deleteBtn.style.transform = 'scale(1.1)';
            };
            deleteBtn.onmouseout = () => {
              deleteBtn.style.backgroundColor = 'transparent';
              deleteBtn.style.color = '#e74c3c';
              deleteBtn.style.transform = 'scale(1)';
            };
            
            // Add delete functionality
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this resource?')) {
                li.style.transition = 'opacity 0.3s ease';
                li.style.opacity = '0';
                setTimeout(() => {
                  li.remove();
                  this.showMessage('Resource deleted successfully', 'success');
                }, 300);
              }
            });
            
            // Add elements to the list item
            li.appendChild(link);
            li.appendChild(deleteBtn);
            
            // Add the new resource to the list
            resourceList.appendChild(li);
          }
        });
      }
      
      // Add event delegation for any existing delete buttons
      resourceList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-resource-btn, .delete-btn');
        if (deleteBtn) {
          e.preventDefault();
          const resourceItem = deleteBtn.closest('li');
          if (resourceItem && confirm('Are you sure you want to delete this resource?')) {
            resourceItem.style.transition = 'opacity 0.3s ease';
            resourceItem.style.opacity = '0';
            setTimeout(() => {
              resourceItem.remove();
              this.showMessage('Resource deleted successfully', 'success');
            }, 300);
          }
        }
      });
    }

    /* ------------------
       DOWNLOAD GRADES REPORT (jsPDF)
       ------------------ */
    initDownloadReport() {
      const downloadBtn = document.getElementById('download-grades-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => this.downloadGradesReport());
      }
    }

    downloadGradesReport() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Grades Report", 14, 20);
      const headers = [["Student", "Subject", "Grade"]];
      let gradesData = JSON.parse(localStorage.getItem('gradesData')) || [];
      const rows = gradesData.map(item => [item.student, item.subject, item.grade]);
      if (doc.autoTable) {
        doc.autoTable({
          head: headers,
          body: rows,
          startY: 30,
        });
      } else {
        let yPos = 30;
        rows.forEach(row => {
          doc.text(row.join("  |  "), 14, yPos);
          yPos += 10;
        });
      }
      doc.save("grades_report.pdf");
    }

    /* ------------------
       REPORT CARD UPLOAD (PDF)
       ------------------ */
    initReportCardUpload() {
      const uploadForm = document.getElementById('upload-report-form');
      if (!uploadForm) return;
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('report-student').value.trim();
        const year = document.getElementById('report-year').value;
        const term = document.getElementById('report-term').value;
        const comments = document.getElementById('report-comments').value.trim();
        const fileInput = document.getElementById('report-file');
        if (!studentName || !year || !term || !fileInput.files[0]) {
          alert('Please fill in all required fields and select a PDF file.');
          return;
        }
        const formData = new FormData();
        formData.append('studentName', studentName);
        formData.append('year', year);
        formData.append('term', term);
        formData.append('comments', comments);
        formData.append('reportCard', fileInput.files[0]);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('https://timiza-saas.onrender.com/api/report-cards', {
            method: 'POST',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {},
            body: formData
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.msg || 'Failed to upload report card');
          alert('Report card uploaded successfully!');
          uploadForm.reset();
          this.fetchReportCards();
        } catch (err) {
          alert('Failed to upload report card!');
          console.error(err);
        }
      });
    }

    // Fetch and display uploaded report cards
    async fetchReportCards() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Not authenticated. Please log in.');
        }

        // Get all students with their classes
        const studentsResponse = await fetch('https://timiza-saas.onrender.com/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!studentsResponse.ok) {
          const errorText = await studentsResponse.text();
          throw new Error(`HTTP error! status: ${studentsResponse.status}. Response: ${errorText}`);
        }

        const students = await studentsResponse.json();
        const container = document.getElementById('report-cards-list');
        if (!container) return;
        container.innerHTML = '';

        // For each student, fetch their marks for each term
        const terms = ['Term 1', 'Term 2', 'Term 3'];
        const reportCards = [];

        for (const student of students) {
          for (const term of terms) {
            try {
              const marksResponse = await fetch(`${window.API_CONFIG?.API_BASE_URL || 'https://timiza-saas.onrender.com'}/marks/student/${student._id}?term=${encodeURIComponent(term)}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });

              if (marksResponse.ok) {
                const marksData = await marksResponse.json();
                if (marksData.success && marksData.data) {
                  // Transform the data to match our display format
                  const subjects = marksData.data.map(subject => ({
                    subject: subject.subject,
                    marks: subject.marks,
                    grade: getGradeFromMarks(subject.marks),
                    remarks: subject.remarks || ''
                  }));
                  
                  reportCards.push({
                    studentId: student._id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    term: term,
                    marks: subjects,
                    teacherRemarks: marksData.teacherRemarks || ''
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching marks for ${student.firstName} ${student.lastName} (${term}):`, error);
            }
          }
        }

        if (!reportCards.length) {
          container.innerHTML = '<p>No report cards uploaded yet.</p>';
          return;
        }
        // Display report cards
        reportCards.forEach(card => {
          const div = document.createElement('div');
          div.className = 'report-card-item';
          
          // Create a header with student name and term
          const header = document.createElement('div');
          header.className = 'report-card-header';
          header.innerHTML = `
            <h4>${card.studentName}</h4>
            <p><strong>Term:</strong> ${card.term}</p>
          `;
          div.appendChild(header);
          
          // Create table to display marks
          const table = document.createElement('table');
          table.className = 'report-card-table';
          
          // Add table header
          const thead = document.createElement('thead');
          thead.innerHTML = `
            <tr>
              <th>Subject</th>
              <th>Marks</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          `;
          table.appendChild(thead);
          
          // Add table body
          const tbody = document.createElement('tbody');
          card.marks.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${subject.subject}</td>
              <td>${subject.marks}</td>
              <td>${subject.grade}</td>
              <td>${subject.remarks || ''}</td>
            `;
            tbody.appendChild(row);
          });
          
          // Add overall grade row
          const totalRow = document.createElement('tr');
          totalRow.className = 'total-row';
          totalRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td><strong>${card.marks.reduce((sum, subj) => sum + (subj.marks || 0), 0)}</strong></td>
            <td><strong>${calculateGradeFromAverage(card.marks.reduce((sum, subj) => sum + (subj.marks || 0), 0) / card.marks.length)}</strong></td>
            <td>&nbsp;</td>
          `;
          tbody.appendChild(totalRow);
          
          table.appendChild(tbody);
          div.appendChild(table);
          container.appendChild(div);
        });
      } catch (err) {
        console.error('Failed to fetch report cards:', err);
      }
    }

    async loadStudentsForReportCardDropdown() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://timiza-saas.onrender.com/api/students', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        const students = await response.json();
        const select = document.getElementById('student-select') || document.getElementById('report-student');
        if (!select) return;
        
        // Clear existing options
        select.innerHTML = '<option value="">-- Select Student --</option>';
        
        // Add student options with class information
        students.forEach(student => {
          const name = student.name || student.username || student.email || student._id;
          const studentClass = student.class || student.className || 'N/A';
          const option = document.createElement('option');
          option.value = student._id;
          option.textContent = `${name} (${studentClass})`;
          option.setAttribute('data-class', studentClass);
          select.appendChild(option);
        });
      } catch (err) {
        console.error('Failed to load students for report card dropdown:', err);
      }
    }
  }

  // Initialize all teacher dashboard functionalities.
  const dashboard = new TeacherDashboard();
  
  // Load students for grade dropdown after dashboard// Helper function to calculate grade from marks
function getGradeFromMarks(marks) {
    if (marks >= 80) return 'A';
    if (marks >= 75) return 'A-';
    if (marks >= 70) return 'B+';
    if (marks >= 65) return 'B';
    if (marks >= 60) return 'B-';
    if (marks >= 55) return 'C+';
    if (marks >= 50) return 'C';
    if (marks >= 45) return 'C-';
    if (marks >= 40) return 'D';
    return 'F';
}

// API configuration
const API_BASE_URL = 'https://timiza-saas.onrender.com';
  
  function loadStudentsForGradeDropdown() {
    const studentSelect = document.getElementById('student-name');
    if (!studentSelect) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
      })
      .then(students => {
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        students.forEach(student => {
          const option = document.createElement('option');
          option.value = student._id || student.id;
          option.textContent = student.name;
          studentSelect.appendChild(option);
        });
      })
      .catch(err => {
        studentSelect.innerHTML = '<option value="">Failed to load students</option>';
        console.error('Failed to load students:', err);
      });
  }

  // Function to handle adding a new grade
  async function handleAddGrade(e) {
    e.preventDefault();
    
    const studentSelect = document.getElementById('student-name');
    const subjectInput = document.getElementById('subject');
    const gradeInput = document.getElementById('grade');
    const commentsInput = document.getElementById('Comments');
    
    const gradeData = {
      student: studentSelect.value,
      subject: subjectInput.value,
      score: parseFloat(gradeInput.value),
      comments: commentsInput.value
    };
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }
      
      const response = await fetch('https://timiza-saas.onrender.com/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gradeData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Grade added successfully!');
        // Clear the form
        e.target.reset();
        // Refresh the grades table
        fetchGrades();
      } else {
        throw new Error(result.error || 'Failed to add grade');
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Function to fetch and display grades
  async function fetchGrades() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const response = await fetch('https://timiza-saas.onrender.com/api/grades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }
      
      const grades = await response.json();
      const tbody = document.querySelector('#grades-table tbody');
      tbody.innerHTML = '';
      
      grades.forEach(grade => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${grade.student?.name || 'N/A'}</td>
          <td>${grade.subject}</td>
          <td>${grade.score}</td>
          <td>${grade.comments || ''}</td>
          <td>
            <button onclick="editGrade('${grade._id}')">Edit</button>
            <button onclick="deleteGrade('${grade._id}')">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  }
  
  // Function to handle saving marks and generating report
  async function handleSaveMarks(e) {
    e.preventDefault();
    
    // Debug: Log form submission
    console.log('=== Form Submission Started ===', e);
    
    // Make sure the form doesn't submit the traditional way
    e.preventDefault();
    
    // Show loading state
    const submitBtn = document.querySelector('#save-marks-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    }
    
    const studentSelect = document.getElementById('student-select');
    const termSelect = document.getElementById('term-select');
    const yearInput = document.getElementById('academic-year');
    const commentsInput = document.getElementById('teacher-comments');
    
    // Debug: Log form values
    console.log('Form values:', {
      student: studentSelect.value,
      term: termSelect.value,
      year: yearInput.value,
      comments: commentsInput.value
    });
    
    // Validate required fields
    if (!studentSelect.value || !termSelect.value || !yearInput.value) {
      const missingFields = [];
      if (!studentSelect.value) missingFields.push('student');
      if (!termSelect.value) missingFields.push('term');
      if (!yearInput.value) missingFields.push('academic year');
      
      console.error('Missing required fields:', missingFields);
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Collect subject marks
    const subjectMarks = [];
    let hasValidMarks = false;
    
    // Get all subject rows from the marks entry table
    const marksRows = document.querySelectorAll('#marks-entry-body tr');
    console.log('Found marks rows:', marksRows.length);
    
    // Store the original subject names for reference
    const originalSubjects = {};
    
    // Process each row in the marks entry table
    marksRows.forEach((row, index) => {
      try {
        // Get the subject name from the first cell (td)
        const subjectCell = row.cells[0];
        const markInput = row.querySelector('input.marks-input');
        
        if (!subjectCell || !markInput) {
          console.warn('Skipping row - missing subject cell or mark input');
          return;
        }
        
        // Get the subject name - first try to get from data-subject attribute as it's more reliable
        let subjectName = '';
        
        // 1. First try to get from data-subject attribute
        if (markInput.hasAttribute('data-subject')) {
          subjectName = markInput.getAttribute('data-subject').trim();
          console.log(`Got subject name from data-subject: ${subjectName}`);
        }
        
        // 2. If not found, try to get from the first cell's text content
        if (!subjectName && subjectCell.textContent) {
          subjectName = subjectCell.textContent.trim();
          console.log(`Got subject name from cell text: ${subjectName}`);
        }
        
        // 3. If still empty, use a default name
        if (!subjectName) {
          subjectName = `Subject ${index + 1}`;
          console.log(`Using default subject name: ${subjectName}`);
        }
        
        const rawValue = markInput.value;
        const mark = parseFloat(rawValue) || 0;
        const subjectId = markInput.id.replace('marks-', '');
        
        // Clean up the subject name (remove any extra spaces, etc.)
        subjectName = subjectName
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/^\s+|\s+$/g, '')  // Trim spaces
          .replace(/\b(\w)/g, l => l.toUpperCase());  // Capitalize first letter of each word
        
        // Store the original subject name with its ID
        if (subjectId) {
          originalSubjects[subjectId] = subjectName;
        }
        
        console.log(`Processing subject ${index + 1}:`, {
          subjectName,
          subjectId,
          rawValue,
          mark,
          cellContent: subjectCell.innerHTML,
          rowHtml: row.outerHTML
        });
        
        if (mark > 0) {
          hasValidMarks = true;
          console.log(`Valid mark found: ${mark} for ${subjectName}`);
        }
        
        // Add the subject with its name and ID
        subjectMarks.push({
          subject: subjectName,  // Use the cleaned subject name
          mark: mark,
          id: subjectId || `subject-${index}`,
          // Add the original subject name as a separate property
          originalSubject: subjectName
        });
      } catch (error) {
        console.error('Error processing subject row:', error);
      }
    });
    
    // Fallback to direct input collection if no rows processed
    if (subjectMarks.length === 0) {
      console.log('No subjects found in table, falling back to input collection');
      const inputs = document.querySelectorAll('input.marks-input');
      inputs.forEach((input, index) => {
        const subjectName = input.getAttribute('data-subject') || `Subject ${index + 1}`;
        const rawValue = input.value;
        const mark = parseFloat(rawValue) || 0;
        
        if (mark > 0) hasValidMarks = true;
        
        subjectMarks.push({
          subject: subjectName,
          mark: mark,
          id: input.id
        });
      });
    }
    
    if (!hasValidMarks) {
      console.error('No valid marks found. All marks:', 
        Array.from(subjectInputs).map(i => ({
          subject: i.getAttribute('data-subject'),
          value: i.value,
          parsed: parseFloat(i.value) || 0
        }))
      );
      alert('Please enter at least one mark greater than 0');
      return;
    }
    
    console.log('All marks are valid, proceeding with submission...');
    
    const studentId = studentSelect.value;
    const studentName = studentSelect.options[studentSelect.selectedIndex].text;
    const term = termSelect.value;
    const year = yearInput.value;
    const comments = commentsInput.value;
    
    // Get the selected student's full name and class from the dropdown
    const selectedOption = studentSelect.options[studentSelect.selectedIndex];
    const studentFullName = selectedOption.textContent.trim();
    const studentClass = selectedOption.getAttribute('data-class') || 'N/A';
    
    const marksData = {
      studentId,
      studentName: studentFullName,
      className: studentClass,
      term,
      academicYear: year,
      year, // Keep for backward compatibility
      subjects: subjectMarks,
      originalSubjects, // Add original subject names for reference
      comments
    };
    
    console.log('Original subjects mapping:', originalSubjects);
    
    console.log('Marks data prepared:', {
      ...marksData,
      subjects: marksData.subjects.map(s => `${s.subject}: ${s.mark}`)
    });
    
    // UI elements for feedback
    const loadingIndicator = document.getElementById('loading-indicator');
    const formFields = document.querySelector('.form-fields');
    const statusMessage = document.getElementById('save-status-message') || (() => {
      const msg = document.createElement('div');
      msg.id = 'save-status-message';
      msg.style.marginTop = '15px';
      msg.style.padding = '10px';
      msg.style.borderRadius = '4px';
      formFields.parentNode.insertBefore(msg, formFields.nextSibling);
      return msg;
    })();
    
    try {
      // Show loading state
      loadingIndicator.style.display = 'block';
      formFields.style.opacity = '0.5';
      formFields.style.pointerEvents = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }
      
      // Clear previous messages
      statusMessage.textContent = '';
      statusMessage.className = '';
      
      // Generate the report card HTML
      const reportCardHtml = generateReportCard(marksData, true);
      
      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }
      
      // Prepare the request data
      const requestData = {
        studentId,
        term,
        year,
        htmlContent: reportCardHtml,
        comments: comments || ''
      };

      console.log('Sending report card data:', {
        ...requestData,
        htmlContent: requestData.htmlContent.substring(0, 100) + '...' // Log just the beginning of the HTML
      });
      
      // Log the token being sent (first 10 chars for security)
      console.log('Sending request with token:', token ? 
        `${token.substring(0, 10)}...` : 'No token found');
      
      try {
        // Send the report card to the backend for PDF generation and storage
        const response = await fetch('https://timiza-saas.onrender.com/api/report-cards/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token // Also send as x-auth-token for compatibility
          },
          credentials: 'include',
          body: JSON.stringify(requestData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json().catch(() => ({}));
        console.log('Response data:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 
            `Server responded with status: ${response.status} - ${response.statusText}`);
        }
        
        return responseData; // Return the successful response data
      } catch (error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw error; // Re-throw to be caught by the outer catch block
      }
      
      const result = await response.json();
      
      // Show success message
      statusMessage.textContent = 'Report card saved successfully!';
      statusMessage.className = 'alert alert-success';
      
      // Show the preview with the generated PDF
      generateReportCard(marksData);
      
      // Add a button to view the saved PDF
      const previewSection = document.getElementById('report-card-preview');
      const actionsDiv = previewSection.querySelector('.report-card-actions') || document.createElement('div');
      actionsDiv.className = 'report-card-actions mt-3';
      actionsDiv.style.display = 'flex';
      actionsDiv.style.gap = '10px';
      actionsDiv.style.flexWrap = 'wrap';
      
      // Create view PDF button
      const viewPdfBtn = document.createElement('button');
      viewPdfBtn.textContent = 'View Saved PDF';
      viewPdfBtn.className = 'btn btn-primary';
      viewPdfBtn.onclick = () => window.open(`${window.API_CONFIG?.BASE_URL || 'https://timiza-saas.onrender.com'}${result.data.path}`, '_blank');
      
      // Create download button
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'Download PDF';
      downloadBtn.className = 'btn btn-outline-primary';
      downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = `${window.API_CONFIG?.BASE_URL || 'https://timiza-saas.onrender.com'}${result.data.path}`;
        link.download = `ReportCard_${studentName.replace(/\s+/g, '_')}_${term}_${year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // Clear previous buttons and add new ones
      actionsDiv.innerHTML = '';
      actionsDiv.appendChild(viewPdfBtn);
      actionsDiv.appendChild(downloadBtn);
      
      // Only append if not already in the DOM
      if (!previewSection.contains(actionsDiv)) {
        previewSection.appendChild(actionsDiv);
      }
      
      // Reset form after successful save
      const form = e.target;
      if (form && form.reset) {
        form.reset();
      }
      
    } catch (error) {
      console.error('Error saving report card:', error);
      
      // Show error message
      statusMessage.textContent = `Failed to save report card: ${error.message}`;
      statusMessage.className = 'alert alert-danger';
      
      // Log the error for debugging
      if (error.response) {
        console.error('Error response:', await error.response.json());
      }
      
    } finally {
      // Reset UI state
      loadingIndicator.style.display = 'none';
      formFields.style.opacity = '1';
      formFields.style.pointerEvents = 'auto';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Marks & Generate Report Card';
      }
    }
  }
  
  // Function to generate report card HTML
  function generateReportCard(data, returnHtmlOnly = false) {
    // Calculate total and average
    const totalMarks = data.subjects.reduce((sum, subj) => sum + (parseInt(subj.mark) || 0), 0);
    const averageMark = data.subjects.length > 0 ? (totalMarks / data.subjects.length).toFixed(1) : 0;
    
    // Format subject names to be more readable
    const formatSubjectName = (subject) => {
      if (!subject) return 'Unknown Subject';
      
      // If it's already a proper name, return as is
      if (typeof subject === 'string' && subject.trim().length > 0 && 
          subject !== subject.toUpperCase() && subject !== subject.toLowerCase()) {
        return subject;
      }
      
      // Otherwise, format it
      return subject
        .toString()
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b(\w)/g, l => l.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Debug: Log the subjects data we received
    console.log('Subjects data in generateReportCard:', data.subjects);
    
    // Generate subjects HTML with proper formatting and grading
    const subjectsHtml = data.subjects.map((subj, index) => {
      // Debug log the subject object to see what we're working with
      console.log('Processing subject object:', JSON.stringify(subj, null, 2));
      
      // Get the subject name from the most reliable source first
      let subjectName = '';
      
      // 1. Try to get from originalSubject if it exists and is valid
      if (subj.originalSubject && typeof subj.originalSubject === 'string' && subj.originalSubject.trim() !== '') {
        subjectName = subj.originalSubject;
      } 
      // 2. Try to get from subject if it exists and is valid
      else if (subj.subject && typeof subj.subject === 'string' && subj.subject.trim() !== '') {
        subjectName = subj.subject;
      }
      // 3. Try to get from originalSubjects mapping using the ID
      else if (subj.id && data.originalSubjects && data.originalSubjects[subj.id]) {
        subjectName = data.originalSubjects[subj.id];
        console.log(`Found subject name in originalSubjects: ${subjectName} for ID: ${subj.id}`);
      }
      // 4. Try to use the ID if it's a string and looks like a subject name
      else if (subj.id && typeof subj.id === 'string' && isNaN(subj.id)) {
        subjectName = subj.id;
      }
      // 5. Last resort: use a generic name
      else {
        subjectName = `Subject ${index + 1}`;
      }
      
      // Clean up the subject name - replace hyphens/underscores with spaces, capitalize first letters
      subjectName = subjectName
        .toString()
        .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
        .replace(/\b(\w)/g, l => l.toUpperCase())  // Capitalize first letter of each word
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
        
      console.log(`Final subject name for index ${index}:`, subjectName);
      
      const score = parseInt(subj.mark) || 0;
      const grade = calculateGrade(score);
      
      console.log(`Processing subject ${index + 1}:`, {
        originalSubject: subj.originalSubject || subj.subject,
        subjectId: subj.id,
        finalSubjectName: subjectName,
        score,
        grade,
        allData: subj  // Log all data for this subject for debugging
      });
      
      return `
        <tr>
          <td>${subjectName}</td>
          <td style="text-align: center;">${score}%</td>
          <td style="text-align: center;">${grade}</td>
          <td>${grade} - ${getGradeComment(grade)}</td>
        </tr>
      `;
    }).join('');
    
    // Calculate overall grade based on average
    const overallGrade = calculateGrade(averageMark);
    
    // Get current date for issued date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create the report card HTML with matching student format
    const reportCardHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Report Card - ${data.studentName} - ${data.term} ${data.year}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            color: #333; 
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .school-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
            color: #2c3e50;
          }
          .report-title { 
            font-size: 20px; 
            margin: 10px 0; 
            color: #2c3e50;
          }
          .student-info { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .student-info p {
            margin: 5px 0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td { 
            padding: 12px 15px; 
            border: 1px solid #ddd; 
            text-align: left; 
          }
          th { 
            background-color: #2c3e50; 
            color: white;
            font-weight: bold;
            text-align: center;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
          .teacher-comments {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #2c3e50;
          }
          .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 50px 0 5px 0;
          }
          .text-center {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">School Name</div>
          <div class="report-title">Report Card</div>
          <div>${data.term || 'Term'} - ${data.academicYear || data.year || ''}</div>
        </div>
        
        <div class="student-info">
          <p><strong>Issued:</strong> ${currentDate}</p>
          <p><strong>Student:</strong> ${data.studentName || 'N/A'}</p>
          <p><strong>Class:</strong> ${data.className ? 'Grade ' + data.className : 'N/A'}</p>
          <p><strong>Overall Grade:</strong> ${overallGrade}</p>
          <p><strong>Average Score:</strong> ${averageMark}%</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th style="width: 15%; text-align: center;">Score</th>
              <th style="width: 20%; text-align: center;">Grade</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${subjectsHtml}
          </tbody>
        </table>
        
        <div class="teacher-comments">
          <h3>Teacher's Comments:</h3>
          <p>No additional comments</p>
        </div>
        
        <div style="text-align: center; margin-top: 50px;">
          <div class="signature-line" style="margin: 0 auto;"></div>
          <p>Teacher's Signature</p>
        </div>
      </body>
      </html>
    `;
    
    // If we only want the HTML string (for PDF generation), return it
    if (returnHtmlOnly) {
      return reportCardHtml;
    }
    
    // Otherwise, display the preview
    const reportCard = document.getElementById('report-card');
    const previewSection = document.getElementById('report-card-preview');
    
    // Create an iframe to show the report card preview
    let iframe = document.getElementById('report-card-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'report-card-iframe';
      iframe.style.width = '100%';
      iframe.style.height = '800px';
      iframe.style.border = '1px solid #ddd';
      iframe.style.borderRadius = '4px';
      reportCard.innerHTML = '';
      reportCard.appendChild(iframe);
    }
    
    // Write the HTML to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(reportCardHtml);
    iframeDoc.close();
    
    // Show the preview section
    previewSection.style.display = 'block';
    
    // Scroll to the preview
    previewSection.scrollIntoView({ behavior: 'smooth' });
    
    return reportCardHtml;
  }
  
  // Function to convert mark to descriptive grade with percentage ranges
  function calculateGrade(score) {
    const numericScore = parseFloat(score) || 0;
    if (numericScore >= 70) return 'Exceed Expectation';
    if (numericScore >= 50) return 'Meet Expectation';
    return 'Below Expectation';
  }

  // Function to get a comment based on the grade
  function getGradeComment(grade) {
    const comments = {
      'Exceed Expectation': 'Excellent performance, keep it up!',
      'Meet Expectation': 'Good work, keep improving!',
      'Below Expectation': 'Needs improvement, please work harder.'
    };
    return comments[grade] || 'No comment available';
  }

  // Keep old function for backward compatibility
  function getGradeFromMark(mark) {
    return calculateGrade(mark);
  }
  
  // Function to load students for grade dropdown
  async function loadStudentsForGradeDropdown() {
    const studentSelect = document.getElementById('student-select');
    if (!studentSelect) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      // Fetch students from the API
      const response = await fetch('https://timiza-saas.onrender.com/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const students = await response.json();
      
      // Clear existing options
      studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
      
      // Add student options
      students.forEach(student => {
        const option = document.createElement('option');
        option.value = student._id;
        option.textContent = `${student.name} (${student.admissionNumber || 'N/A'})`;
        studentSelect.appendChild(option);
      });
      
      // Load subjects when a student is selected
      studentSelect.addEventListener('change', async (e) => {
        const studentId = e.target.value;
        if (studentId) {
          await loadStudentSubjects(studentId);
        } else {
          const subjectsContainer = document.getElementById('subjects-container');
          subjectsContainer.innerHTML = '<p class="no-subjects">Select a student to enter marks</p>';
        }
      });
      
    } catch (error) {
      console.error('Error loading students:', error);
      studentSelect.innerHTML = '<option value="">Error loading students</option>';
    }
  }
  
  // Function to load subjects for a student
  async function loadStudentSubjects(studentId) {
    const subjectsContainer = document.getElementById('subjects-container');
    
    try {
      // Show loading state
      subjectsContainer.innerHTML = '<p class="loading-subjects">Loading subjects...</p>';
      
      // In a real app, you would fetch the student's enrolled subjects from the API
      // For now, we'll use a mock list of subjects
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockSubjects = [
        'Mathematics', 'English', 'Kiswahili', 'Physics', 'Chemistry',
        'Biology', 'History', 'Geography', 'CRE', 'Business Studies'
      ];
      
      // Generate subject inputs
      const subjectsHtml = `
        <div class="subject-inputs">
          ${mockSubjects.map(subject => `
            <div class="form-group" style="display: flex; align-items: center; margin-bottom: 10px;">
              <label style="flex: 1; margin-right: 10px;">${subject}:</label>
              <input type="number" class="subject-mark" data-subject="${subject}" 
                     min="0" max="100" step="0.01" style="width: 80px; padding: 5px;" 
                     placeholder="Marks">
            </div>
          `).join('')}
        </div>
      `;
      
      subjectsContainer.innerHTML = subjectsHtml;
      
    } catch (error) {
      console.error('Error loading subjects:', error);
      subjectsContainer.innerHTML = '<p class="error-message">Error loading subjects. Please try again.</p>';
    }
  }
  
  // Initialize grade management
  function initGradeManagement() {
    // Load grades when the page loads
    fetchGrades();
    
    // Set up the download as PDF button
    const downloadPdfBtn = document.querySelector('.btn-secondary[onclick*="downloadAsPDF"]');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', downloadAsPDF);
    }
    
    // Add New Marks button click handler
    const openMarksModalBtn = document.getElementById('open-marks-modal');
    const marksModal = document.getElementById('marks-modal');
    const closeModalBtn = marksModal?.querySelector('.close-modal');
    const cancelMarksBtn = document.getElementById('cancel-marks-btn');
    const marksForm = document.getElementById('marks-entry-form');
    
    // Rest of the grade management initialization code

    if (openMarksModalBtn && marksModal) {
      openMarksModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Add New Marks button clicked'); // Debug log
        
        // Reset form and show modal
        if (marksForm) marksForm.reset();
        
        // Remove any existing display styles to ensure our class takes effect
        marksModal.style.display = '';
        marksModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Force a reflow to ensure the display property is updated
        void marksModal.offsetWidth;
        
        // Load students for the dropdown
        loadStudentsForGradeDropdown();
      });
    } else {
      console.error('Could not find openMarksModalBtn or marksModal:', { 
        openMarksModalBtn: !!openMarksModalBtn, 
        marksModal: !!marksModal 
      });
    }

    // Close modal when clicking the close button
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        marksModal.classList.remove('show');
        document.body.style.overflow = '';
        // Add a small delay before hiding to allow for transition
        setTimeout(() => {
          marksModal.style.display = 'none';
        }, 300);
      });
    }

    // Close modal when clicking cancel button
    if (cancelMarksBtn) {
      cancelMarksBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (marksForm) marksForm.reset();
        marksModal.classList.remove('show');
        document.body.style.overflow = '';
        // Add a small delay before hiding to allow for transition
        setTimeout(() => {
          marksModal.style.display = 'none';
        }, 300);
      });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
      if (e.target === marksModal) {
        e.preventDefault();
        marksModal.classList.remove('show');
        document.body.style.overflow = '';
        // Add a small delay before hiding to allow for transition
        setTimeout(() => {
          marksModal.style.display = 'none';
        }, 300);
      }
    });

    // Handle form submission
    if (marksForm) {
      marksForm.addEventListener('submit', handleSaveMarks);
    }

    // Load students when student select changes
    const studentSelect = document.getElementById('student-select');
    if (studentSelect) {
      studentSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          loadStudentSubjects(e.target.value);
        } else {
          const subjectsContainer = document.getElementById('subjects-container');
          if (subjectsContainer) {
            subjectsContainer.innerHTML = '<p class="no-subjects" style="text-align: center; color: #666; font-style: italic; padding: 20px 0;">Select a student to enter marks</p>';
          }
        }
      });
    }
  }
  
  // Function to download report card as PDF
  async function downloadAsPDF() {
    let downloadBtn = document.querySelector('.download-pdf-btn');
    let originalBtnHtml = downloadBtn ? downloadBtn.innerHTML : '';
    let statusMessage = document.getElementById('pdf-status-message') || (() => {
      const msg = document.createElement('div');
      msg.id = 'pdf-status-message';
      msg.style.marginTop = '15px';
      msg.style.padding = '10px';
      msg.style.borderRadius = '4px';
      
      // Insert after the download button if it exists, otherwise at the end of the preview section
      const previewSection = document.getElementById('report-card-preview');
      if (downloadBtn) {
        downloadBtn.parentNode.insertBefore(msg, downloadBtn.nextSibling);
      } else if (previewSection) {
        previewSection.appendChild(msg);
      }
      
      return msg;
    })();
    
    try {
      // Get the current report card data from the form
      const studentSelect = document.getElementById('student-select');
      const termSelect = document.getElementById('term-select');
      const yearInput = document.getElementById('academic-year');
      const commentsInput = document.getElementById('teacher-comments');
      
      // Validate required fields
      if (!studentSelect || !studentSelect.value || !termSelect || !termSelect.value || !yearInput || !yearInput.value) {
        throw new Error('Please fill in all required fields: student, term, and academic year');
      }
      
      // Collect subject marks
      const subjectMarks = [];
      const subjectInputs = document.querySelectorAll('.subject-mark');
      let hasValidMarks = false;
      
      subjectInputs.forEach(input => {
        const mark = parseFloat(input.value) || 0;
        if (mark > 0) hasValidMarks = true;
        subjectMarks.push({
          subject: input.getAttribute('data-subject'),
          mark: mark
        });
      });
      
      if (!hasValidMarks) {
        throw new Error('Please enter at least one valid mark before generating PDF.');
      }
      
      const marksData = {
        studentId: studentSelect.value,
        studentName: studentSelect.options[studentSelect.selectedIndex].text,
        term: termSelect.value,
        year: yearInput.value,
        subjects: subjectMarks,
        comments: commentsInput.value
      };
      
      // Show loading state
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
      }
      
      // Clear previous messages
      statusMessage.textContent = '';
      statusMessage.className = '';
      
      // Generate the report card HTML
      const reportCardHtml = generateReportCard(marksData, true);
      
      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }
      
      // Show status message
      statusMessage.textContent = 'Generating PDF, please wait...';
      statusMessage.className = 'alert alert-info';
      
      // Send the report card to the backend for PDF generation
      const response = await fetch('https://timiza-saas.onrender.com/api/report-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: marksData.studentId,
          studentName: marksData.studentName,
          term: marksData.term,
          year: marksData.year,
          htmlContent: reportCardHtml,
          comments: marksData.comments
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Show success message
      statusMessage.textContent = 'PDF generated successfully! Opening in a new tab...';
      statusMessage.className = 'alert alert-success';
      
      // Open the generated PDF in a new tab after a short delay
      setTimeout(() => {
        const pdfUrl = `${window.API_CONFIG?.BASE_URL || 'https://timiza-saas.onrender.com'}${result.data.path}`;
        window.open(pdfUrl, '_blank');
        
        // Add a direct download link as well
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `ReportCard_${marksData.studentName.replace(/\s+/g, '_')}_${marksData.term}_${marksData.year}.pdf`;
        downloadLink.textContent = 'Click here if the PDF did not open automatically';
        downloadLink.className = 'd-block mt-2';
        
        statusMessage.appendChild(document.createElement('br'));
        statusMessage.appendChild(downloadLink);
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error message
      statusMessage.textContent = `Failed to generate PDF: ${error.message}`;
      statusMessage.className = 'alert alert-danger';
      
      // Log the error for debugging
      if (error.response) {
        console.error('Error response:', await error.response.json());
      }
      
    } finally {
      // Reset the download button
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalBtnHtml || '<i class="fas fa-file-pdf"></i> Download PDF';
      }
    }
  }
  
  // Make downloadAsPDF available globally
  window.downloadAsPDF = downloadAsPDF;
});
