(function() {
// Admin User Management - Initialize DOM elements safely
function getElementSafely(id, context = document) {
    const element = context.getElementById ? context.getElementById(id) : null;
    if (!element) {
        console.warn(`Element with ID '${id}' not found`);
    }
    return element;
}

// Main UI Elements
const elements = {
    // Export button
    userExportBtn: getElementSafely('export-users-btn'),
    // Forms and Tables
    addUserForm: getElementSafely('add-user-form'),
    userAddMsg: getElementSafely('user-add-msg'),
    userTableBody: document.querySelector('#user-table tbody'),
    userSearch: getElementSafely('user-search'),
    usersBulkToolbar: getElementSafely('users-bulk-toolbar'),
    usersBulkDelete: getElementSafely('users-bulk-delete'),
    usersBulkExport: getElementSafely('users-bulk-export'),
    selectAllUsers: getElementSafely('select-all-users'),
    userRoleFilter: getElementSafely('user-role-filter'),
    userStatusFilter: getElementSafely('user-status-filter'),
    
    // Edit Form Elements
    editUserId: getElementSafely('edit-user-id'),
    editName: getElementSafely('edit-user-name'),
    editEmail: getElementSafely('edit-user-email'),
    editUsername: getElementSafely('edit-user-username'),
    editRole: getElementSafely('edit-user-role'),
    
    // Modals
    modals: {
        edit: {
            modal: getElementSafely('user-edit-modal'),
            closeBtn: getElementSafely('close-user-edit-modal'),
            form: getElementSafely('user-edit-form'),
            msg: getElementSafely('user-edit-msg')
        },
        confirm: {
            modal: getElementSafely('universal-confirm-modal'),
            closeBtn: getElementSafely('close-universal-confirm-modal'),
            title: getElementSafely('universal-confirm-title'),
            message: getElementSafely('universal-confirm-message'),
            yesBtn: getElementSafely('universal-confirm-yes'),
            noBtn: getElementSafely('universal-confirm-no')
        }
    }
};

// Initialize modals
function initializeModals() {
    // Close modal buttons
    if (elements.modals.edit.closeBtn && elements.modals.edit.modal) {
        elements.modals.edit.closeBtn.onclick = () => closeModal('edit');
    }
    
    if (elements.modals.confirm.closeBtn && elements.modals.confirm.modal) {
        elements.modals.confirm.closeBtn.onclick = () => closeModal('confirm');
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            const modal = event.target;
            const modalType = Object.keys(elements.modals).find(
                key => elements.modals[key].modal === modal
            );
            if (modalType) {
                closeModal(modalType);
            }
        }
    });
}

// Open modal function
function openModal(modalType) {
    const modal = elements.modals[modalType]?.modal;
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Close modal function
function closeModal(modalType) {
    const modal = elements.modals[modalType]?.modal;
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Initialize the page
function initializeAdminPage() {
    // Initialize modals
    initializeModals();
    
    // Initialize event listeners
    if (elements.userSearch) {
        elements.userSearch.addEventListener('input', debounce(loadUsersWithFilters, 300));
    }
    
    if (elements.userRoleFilter) {
        elements.userRoleFilter.addEventListener('change', loadUsersWithFilters);
    }
    
    if (elements.userStatusFilter) {
        elements.userStatusFilter.addEventListener('change', loadUsersWithFilters);
    }
    
    // Initialize bulk actions
    if (elements.usersBulkDelete) {
        elements.usersBulkDelete.addEventListener('click', handleBulkDelete);
    }
    
    if (elements.usersBulkExport) {
        elements.usersBulkExport.addEventListener('click', handleBulkExport);
    }
    
    // Load initial data
    loadUsersWithFilters();
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load users with filters
async function loadUsersWithFilters() {
    try {
        // TODO: Implement user filtering logic
        console.log('Loading users with filters...');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Handle bulk delete action
async function handleBulkDelete() {
    try {
        // TODO: Implement bulk delete logic
        console.log('Bulk delete clicked');
    } catch (error) {
        console.error('Error in bulk delete:', error);
    }
}

// Handle bulk export action
async function handleBulkExport() {
    try {
        // TODO: Implement bulk export logic
        console.log('Bulk export clicked');
    } catch (error) {
        console.error('Error in bulk export:', error);
    }
}

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminPage);
} else {
    initializeAdminPage();
}
})(); // Close the IIFE

// =====================================================
// SCHOOL USER MANAGEMENT
// Students + Teachers
// Uses existing User model via /api/management-users
// =====================================================

(function () {

    'use strict';

    const API_URL = '/api/management-users';

    let managementUsers = [];


    // =====================================================
    // HELPERS
    // =====================================================

    function getToken() {
        return localStorage.getItem('token') || '';
    }


    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    function getElement(id) {
        return document.getElementById(id);
    }


    function getUserStatus(user) {

        const status =
            String(user?.status || 'Active')
                .trim()
                .toLowerCase();

        return status === 'suspended'
            ? 'Suspended'
            : 'Active';
    }


    function getUserClass(user) {

        return (
            user?.studentClass ||
            user?.classAssigned ||
            user?.class ||
            user?.profile?.class ||
            ''
        );

    }


    function getUserSubject(user) {

        if (user?.subject) {
            return user.subject;
        }

        if (
            Array.isArray(user?.subjects) &&
            user.subjects.length
        ) {
            return user.subjects.join(', ');
        }

        if (
            Array.isArray(user?.profile?.subjects) &&
            user.profile.subjects.length
        ) {
            return user.profile.subjects.join(', ');
        }

        if (user?.profile?.specialization) {
            return user.profile.specialization;
        }

        if (user?.specialization) {
            return user.specialization;
        }

        return '';

    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const form =
        getElement('management-add-user-form');

    const roleSelect =
        getElement('management-user-role');

    const subjectContainer =
        getElement('management-subject-container');

    const classContainer =
        getElement('management-class-container');

    const tableBody =
        getElement('management-users-table-body');


    // =====================================================
    // ROLE FIELD DISPLAY
    // =====================================================

    function updateRoleFields() {

        if (!roleSelect) {
            return;
        }

        const role =
            String(roleSelect.value || '')
                .toLowerCase()
                .trim();


        if (role === 'teacher') {

            if (subjectContainer) {
                subjectContainer.style.display = 'block';
            }

            if (classContainer) {
                classContainer.style.display = 'none';
            }

        } else {

            if (subjectContainer) {
                subjectContainer.style.display = 'none';
            }

            if (classContainer) {
                classContainer.style.display = 'block';
            }

        }

    }


    if (roleSelect) {

        roleSelect.addEventListener(
            'change',
            updateRoleFields
        );

        updateRoleFields();

    }


    // =====================================================
    // LOAD USERS
    // =====================================================

    async function loadManagementUsers() {

        const loading =
            getElement('management-users-loading');

        const errorBox =
            getElement('management-users-error');


        if (loading) {
            loading.style.display = 'block';
        }

        if (errorBox) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        }


        try {

            const searchInput =
                getElement('management-user-search');

            const roleFilter =
                getElement('management-role-filter');

            const statusFilter =
                getElement('management-status-filter');


            const search =
                searchInput
                    ? searchInput.value.trim()
                    : '';


            const role =
                roleFilter
                    ? roleFilter.value.trim()
                    : '';


            const status =
                statusFilter
                    ? statusFilter.value.trim()
                    : '';


            const params =
                new URLSearchParams();


            if (search) {
                params.set(
                    'search',
                    search
                );
            }


            if (role) {
                params.set(
                    'role',
                    role
                );
            }


            // IMPORTANT:
            // Backend expects status, not active.
            if (status) {
                params.set(
                    'status',
                    status
                );
            }


            const token =
                getToken();


            console.log(
                '[USER MANAGEMENT] Loading users',
                {
                    search,
                    role,
                    status
                }
            );


            const url =
                params.toString()
                    ? `${API_URL}?${params.toString()}`
                    : API_URL;


            const response =
                await fetch(
                    url,
                    {
                        method: 'GET',

                        credentials: 'include',

                        headers: {

                            'Content-Type':
                                'application/json',

                            ...(token
                                ? {
                                    'Authorization':
                                        `Bearer ${token}`
                                }
                                : {})

                        }
                    }
                );


            const result =
                await response.json();


            console.log(
                '[USER MANAGEMENT] API response:',
                result
            );


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    'Failed to load users'
                );

            }


            managementUsers =
                Array.isArray(result.data)
                    ? result.data
                    : [];


            console.log(
                '[USER MANAGEMENT] Users loaded:',
                managementUsers.length
            );


            renderManagementUsers();


        } catch (error) {

            console.error(
                '[USER MANAGEMENT] LOAD ERROR:',
                error
            );


            managementUsers = [];


            renderManagementUsers();


            if (errorBox) {

                errorBox.textContent =
                    error.message ||
                    'Failed to load users';

                errorBox.style.display =
                    'block';

            }

        } finally {

            if (loading) {
                loading.style.display = 'none';
            }

        }

    }


    // =====================================================
    // RENDER USERS
    // =====================================================

    function renderManagementUsers() {

        if (!tableBody) {

            console.error(
                '[USER MANAGEMENT] Table body not found'
            );

            return;
        }


        tableBody.innerHTML = '';


        const empty =
            getElement(
                'management-users-empty'
            );


        // =================================================
        // STATISTICS
        // =================================================

        const total =
            managementUsers.length;


        const active =
            managementUsers.filter(
                user =>
                    getUserStatus(user) === 'Active'
            ).length;


        const suspended =
            managementUsers.filter(
                user =>
                    getUserStatus(user) === 'Suspended'
            ).length;


        const totalElement =
            getElement(
                'management-total-users'
            );


        const activeElement =
            getElement(
                'management-active-users'
            );


        const suspendedElement =
            getElement(
                'management-suspended-users'
            );


        if (totalElement) {
            totalElement.textContent = total;
        }


        if (activeElement) {
            activeElement.textContent = active;
        }


        if (suspendedElement) {
            suspendedElement.textContent = suspended;
        }


        // =================================================
        // EMPTY STATE
        // =================================================

        if (!managementUsers.length) {

            if (empty) {
                empty.style.display = 'block';
            }

            return;
        }


        if (empty) {
            empty.style.display = 'none';
        }


        // =================================================
        // TABLE ROWS
        // =================================================

        managementUsers.forEach(user => {

            const row =
                document.createElement('tr');


            const role =
                String(user.role || '')
                    .toLowerCase()
                    .trim();


            const roleLabel =
                role === 'teacher'
                    ? 'Teacher'
                    : 'Student';


            const details =
                role === 'teacher'
                    ? (
                        getUserSubject(user) ||
                        '—'
                    )
                    : (
                        getUserClass(user) ||
                        '—'
                    );


            const status =
                getUserStatus(user);


            const isActive =
                status === 'Active';


            const userId =
                String(user._id || '');


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(
                            user.name || '—'
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        user.email || '—'
                    )}
                </td>

                <td>
                    <span class="badge ${
                        role === 'teacher'
                            ? 'bg-info'
                            : 'bg-primary'
                    }">
                        ${roleLabel}
                    </span>
                </td>

                <td>
                    ${escapeHtml(details)}
                </td>

                <td>
                    <span class="badge ${
                        isActive
                            ? 'bg-success'
                            : 'bg-danger'
                    }">
                        ${status}
                    </span>
                </td>

                <td class="text-end">

                    ${
                        isActive

                        ? `

                            <button
                                type="button"
                                class="btn btn-sm btn-warning"
                                onclick="suspendManagementUser('${userId}')"
                            >
                                <i class="fas fa-pause"></i>
                                Suspend
                            </button>

                        `

                        : `

                            <button
                                type="button"
                                class="btn btn-sm btn-success"
                                onclick="activateManagementUser('${userId}')"
                            >
                                <i class="fas fa-check"></i>
                                Activate
                            </button>

                        `
                    }

                    <button
    type="button"
    class="btn btn-sm btn-outline-primary"
    onclick="resetManagementUserPassword('${userId}', '${escapeHtml(user.name || '')}')"
    title="Reset password"
>
    <i class="fas fa-key"></i>
    Reset Password
</button>

<button
    type="button"
    class="btn btn-sm btn-outline-danger"
    onclick="deleteManagementUser('${userId}')"
    title="Delete user"
>
    <i class="fas fa-trash"></i>
</button>

                </td>

            `;


            tableBody.appendChild(row);

        });

    }
// =====================================================
// RESET USER PASSWORD
// =====================================================

window.resetManagementUserPassword =
async function (id, userName) {

    if (!id) {
        return;
    }

    const confirmed =
        confirm(
            `Reset the password for ${userName || 'this user'}?\n\n` +
            `A new temporary password will be generated.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const token =
            getToken();


        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(id)}/reset-password`,
                {
                    method: 'POST',

                    credentials: 'include',

                    headers: {

                        'Content-Type':
                            'application/json',

                        ...(token
                            ? {
                                'Authorization':
                                    `Bearer ${token}`
                            }
                            : {})

                    }
                }
            );


        const result =
            await response.json();


        console.log(
            '[USER MANAGEMENT] PASSWORD RESET:',
            result
        );


        if (!response.ok) {

            throw new Error(
                result.message ||
                'Failed to reset password'
            );

        }


        // =================================================
        // GET MODAL ELEMENTS
        // =================================================

        const modal =
            document.getElementById(
                'password-reset-modal'
            );


        const userNameElement =
            document.getElementById(
                'password-reset-user-name'
            );


        const passwordElement =
            document.getElementById(
                'temporary-password'
            );


        const copyMessage =
            document.getElementById(
                'copy-password-message'
            );


        // =================================================
        // SET MODAL CONTENT
        // =================================================

        if (userNameElement) {

            userNameElement.textContent =
                userName || 'User';

        }


        if (passwordElement) {

            passwordElement.value =
                result.temporaryPassword || '';

        }


        if (copyMessage) {

            copyMessage.textContent = '';

        }


        // =================================================
        // SHOW MODAL
        // =================================================

        if (modal) {

            modal.style.display =
                'block';

            document.body.style.overflow =
                'hidden';

        } else {

            // Fallback if modal HTML does not exist

            alert(
                `Password reset successfully!\n\n` +
                `User: ${userName || 'User'}\n\n` +
                `Temporary Password:\n` +
                `${result.temporaryPassword}\n\n` +
                `Give this temporary password to the user.`
            );

        }


    } catch (error) {

        console.error(
            '[USER MANAGEMENT] PASSWORD RESET ERROR:',
            error
        );


        alert(
            error.message ||
            'Failed to reset password'
        );

    }

};


// =====================================================
// PASSWORD RESET MODAL CONTROLS
// =====================================================

(function initializePasswordResetModal() {

    const modal =
        document.getElementById(
            'password-reset-modal'
        );


    const closeButton =
        document.getElementById(
            'close-password-reset-modal'
        );


    const doneButton =
        document.getElementById(
            'password-reset-done'
        );


    const copyButton =
        document.getElementById(
            'copy-temporary-password'
        );


    const passwordInput =
        document.getElementById(
            'temporary-password'
        );


    const copyMessage =
        document.getElementById(
            'copy-password-message'
        );


    // =================================================
    // CLOSE MODAL
    // =================================================

    function closePasswordResetModal() {

        if (modal) {

            modal.style.display =
                'none';

        }


        document.body.style.overflow =
            '';

    }


    // =================================================
    // CLOSE BUTTON
    // =================================================

    if (closeButton) {

        closeButton.addEventListener(
            'click',
            closePasswordResetModal
        );

    }


    // =================================================
    // DONE BUTTON
    // =================================================

    if (doneButton) {

        doneButton.addEventListener(
            'click',
            closePasswordResetModal
        );

    }


    // =================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =================================================

    if (modal) {

        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target === modal
                ) {

                    closePasswordResetModal();

                }

            }
        );

    }


    // =================================================
    // COPY TEMPORARY PASSWORD
    // =================================================

    if (copyButton) {

        copyButton.addEventListener(
            'click',
            async function () {

                const password =
                    passwordInput
                        ? passwordInput.value
                        : '';


                if (!password) {

                    return;

                }


                try {

                    await navigator.clipboard.writeText(
                        password
                    );


                    if (copyMessage) {

                        copyMessage.textContent =
                            'Password copied to clipboard.';

                    }


                    copyButton.innerHTML =
                        '<i class="fas fa-check"></i> Copied';


                    setTimeout(
                        function () {

                            copyButton.innerHTML =
                                '<i class="fas fa-copy"></i> Copy';

                        },
                        2000
                    );


                } catch (error) {

                    console.error(
                        '[USER MANAGEMENT] COPY PASSWORD ERROR:',
                        error
                    );


                    // Fallback for browsers where
                    // clipboard API is unavailable

                    if (passwordInput) {

                        passwordInput.focus();

                        passwordInput.select();

                        passwordInput.setSelectionRange(
                            0,
                            passwordInput.value.length
                        );

                    }


                    if (copyMessage) {

                        copyMessage.textContent =
                            'Password selected. Press Ctrl+C to copy.';

                    }

                }

            }
        );

    }

})();

    // =====================================================
    // CREATE USER
    // =====================================================

    if (form) {

        form.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const message =
                    getElement(
                        'management-add-user-message'
                    );


                const role =
                    roleSelect
                        ? String(
                            roleSelect.value || ''
                        ).toLowerCase().trim()
                        : 'student';


                const nameElement =
                    getElement(
                        'management-user-name'
                    );


                const emailElement =
                    getElement(
                        'management-user-email'
                    );


                const passwordElement =
                    getElement(
                        'management-user-password'
                    );


                const subjectElement =
                    getElement(
                        'management-user-subject'
                    );


                const classElement =
                    getElement(
                        'management-user-class'
                    );


                const name =
                    nameElement
                        ? nameElement.value.trim()
                        : '';


                const email =
                    emailElement
                        ? emailElement.value.trim()
                        : '';


                const password =
                    passwordElement
                        ? passwordElement.value
                        : '';


                const subject =
                    subjectElement
                        ? subjectElement.value.trim()
                        : '';


                const studentClass =
                    classElement
                        ? classElement.value.trim()
                        : '';


                // -----------------------------------------
                // CLIENT VALIDATION
                // -----------------------------------------

                if (!name) {

                    showMessage(
                        message,
                        'Full name is required.',
                        'danger'
                    );

                    return;
                }


                if (!email) {

                    showMessage(
                        message,
                        'Email is required.',
                        'danger'
                    );

                    return;
                }


                if (!password) {

                    showMessage(
                        message,
                        'Password is required.',
                        'danger'
                    );

                    return;
                }


                if (
                    !['student', 'teacher']
                        .includes(role)
                ) {

                    showMessage(
                        message,
                        'Select Student or Teacher.',
                        'danger'
                    );

                    return;
                }


                const body = {

                    name,

                    email,

                    password,

                    role,

                    subject,

                    studentClass

                };


                console.log(
                    '[USER MANAGEMENT] Creating user:',
                    {
                        name,
                        email,
                        role,
                        subject,
                        studentClass
                    }
                );


                try {

                    const token =
                        getToken();


                    const response =
                        await fetch(
                            API_URL,
                            {
                                method: 'POST',

                                credentials:
                                    'include',

                                headers: {

                                    'Content-Type':
                                        'application/json',

                                    ...(token
                                        ? {
                                            'Authorization':
                                                `Bearer ${token}`
                                        }
                                        : {})

                                },

                                body:
                                    JSON.stringify(body)

                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        '[USER MANAGEMENT] CREATE RESPONSE:',
                        result
                    );


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            'Failed to create user'
                        );

                    }


                    showMessage(
                        message,
                        result.message ||
                        'User created successfully.',
                        'success'
                    );


                    form.reset();


                    updateRoleFields();


                    // Reload table immediately
                    await loadManagementUsers();


                } catch (error) {

                    console.error(
                        '[USER MANAGEMENT] CREATE ERROR:',
                        error
                    );


                    showMessage(
                        message,
                        error.message ||
                        'Failed to create user',
                        'danger'
                    );

                }

            }
        );

    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(
        element,
        text,
        type
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            text;


        element.className =
            `alert alert-${type}`;


        element.style.display =
            'block';

    }


    // =====================================================
    // ACTIVATE
    // =====================================================

    window.activateManagementUser =
        async function (id) {

            if (!id) {
                return;
            }


            try {

                const token =
                    getToken();


                const response =
                    await fetch(
                        `${API_URL}/${encodeURIComponent(id)}/activate`,
                        {
                            method: 'PATCH',

                            credentials:
                                'include',

                            headers: {

                                'Content-Type':
                                    'application/json',

                                ...(token
                                    ? {
                                        'Authorization':
                                            `Bearer ${token}`
                                    }
                                    : {})

                            }
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    '[USER MANAGEMENT] ACTIVATE:',
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        'Failed to activate account'
                    );

                }


                await loadManagementUsers();


            } catch (error) {

                console.error(
                    '[USER MANAGEMENT] ACTIVATE ERROR:',
                    error
                );


                alert(
                    error.message ||
                    'Failed to activate account'
                );

            }

        };


    // =====================================================
    // SUSPEND
    // =====================================================

    window.suspendManagementUser =
        async function (id) {

            if (!id) {
                return;
            }


            if (
                !confirm(
                    'Suspend this account?'
                )
            ) {
                return;
            }


            try {

                const token =
                    getToken();


                const response =
                    await fetch(
                        `${API_URL}/${encodeURIComponent(id)}/suspend`,
                        {
                            method: 'PATCH',

                            credentials:
                                'include',

                            headers: {

                                'Content-Type':
                                    'application/json',

                                ...(token
                                    ? {
                                        'Authorization':
                                            `Bearer ${token}`
                                    }
                                    : {})

                            }
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    '[USER MANAGEMENT] SUSPEND:',
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        'Failed to suspend account'
                    );

                }


                await loadManagementUsers();


            } catch (error) {

                console.error(
                    '[USER MANAGEMENT] SUSPEND ERROR:',
                    error
                );


                alert(
                    error.message ||
                    'Failed to suspend account'
                );

            }

        };


    // =====================================================
    // DELETE
    // =====================================================

    window.deleteManagementUser =
        async function (id) {

            if (!id) {
                return;
            }


            if (
                !confirm(
                    'Delete this account permanently?'
                )
            ) {
                return;
            }


            try {

                const token =
                    getToken();


                const response =
                    await fetch(
                        `${API_URL}/${encodeURIComponent(id)}`,
                        {
                            method: 'DELETE',

                            credentials:
                                'include',

                            headers: {

                                'Content-Type':
                                    'application/json',

                                ...(token
                                    ? {
                                        'Authorization':
                                            `Bearer ${token}`
                                    }
                                    : {})

                            }
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    '[USER MANAGEMENT] DELETE:',
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        'Failed to delete user'
                    );

                }


                await loadManagementUsers();


            } catch (error) {

                console.error(
                    '[USER MANAGEMENT] DELETE ERROR:',
                    error
                );


                alert(
                    error.message ||
                    'Failed to delete user'
                );

            }

        };


    // =====================================================
    // SEARCH BUTTON
    // =====================================================

    const searchButton =
        getElement(
            'management-search-btn'
        );


    if (searchButton) {

        searchButton.addEventListener(
            'click',
            function () {
                loadManagementUsers();
            }
        );

    }


    // =====================================================
    // ROLE FILTER
    // =====================================================

    const roleFilter =
        getElement(
            'management-role-filter'
        );


    if (roleFilter) {

        roleFilter.addEventListener(
            'change',
            function () {
                loadManagementUsers();
            }
        );

    }


    // =====================================================
    // STATUS FILTER
    // =====================================================

    const statusFilter =
        getElement(
            'management-status-filter'
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            'change',
            function () {
                loadManagementUsers();
            }
        );

    }


    // =====================================================
    // REFRESH BUTTON
    // =====================================================

    const refreshButton =
        getElement(
            'management-refresh-btn'
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            function () {
                loadManagementUsers();
            }
        );

    }


    // =====================================================
    // SEARCH ENTER
    // =====================================================

    const searchInput =
        getElement(
            'management-user-search'
        );


    if (searchInput) {

        searchInput.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key === 'Enter'
                ) {

                    event.preventDefault();

                    loadManagementUsers();

                }

            }
        );

    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    function initializeManagementUsers() {

        console.log(
            '[USER MANAGEMENT] Initializing...'
        );


        updateRoleFields();


        loadManagementUsers();

    }


    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeManagementUsers
        );

    } else {

        initializeManagementUsers();

    }


})();

// =====================================================
// PASSWORD RESET MODAL CONTROLS
// =====================================================

(function () {

    'use strict';


    // =================================================
    // GET MODAL ELEMENTS
    // =================================================

    function getPasswordResetModalElements() {

        return {

            modal:
                document.getElementById(
                    'password-reset-modal'
                ),

            closeButton:
                document.getElementById(
                    'close-password-reset-modal'
                ),

            doneButton:
                document.getElementById(
                    'password-reset-done'
                ),

            copyButton:
                document.getElementById(
                    'copy-temporary-password'
                ),

            passwordInput:
                document.getElementById(
                    'temporary-password'
                ),

            copyMessage:
                document.getElementById(
                    'copy-password-message'
                )

        };

    }


    // =================================================
    // CLOSE MODAL
    // =================================================

    function closePasswordResetModal() {

        const elements =
            getPasswordResetModalElements();


        if (!elements.modal) {

            console.error(
                '[USER MANAGEMENT] Password reset modal not found.'
            );

            return;

        }


        elements.modal.style.display =
            'none';


        elements.modal.setAttribute(
            'aria-hidden',
            'true'
        );


        document.body.style.overflow =
            '';


        console.log(
            '[USER MANAGEMENT] Password reset modal closed'
        );

    }


    // =================================================
    // COPY TEMPORARY PASSWORD
    // =================================================

    async function copyTemporaryPassword() {

        const elements =
            getPasswordResetModalElements();


        const passwordInput =
            elements.passwordInput;


        const copyButton =
            elements.copyButton;


        const copyMessage =
            elements.copyMessage;


        if (!passwordInput) {

            console.error(
                '[USER MANAGEMENT] Temporary password input not found.'
            );

            return;

        }


        const password =
            passwordInput.value.trim();


        if (!password) {

            console.warn(
                '[USER MANAGEMENT] No temporary password available.'
            );

            return;

        }


        // =================================================
        // MODERN CLIPBOARD
        // =================================================

        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    password
                );

            } else {

                throw new Error(
                    'Clipboard API unavailable'
                );

            }


            // Success message

            if (copyMessage) {

                copyMessage.textContent =
                    'Password copied to clipboard.';

                copyMessage.className =
                    'text-success small mt-2';

            }


            if (copyButton) {

                copyButton.innerHTML =
                    '<i class="fas fa-check me-1"></i> Copied';

                copyButton.classList.remove(
                    'btn-outline-primary'
                );

                copyButton.classList.add(
                    'btn-success'
                );


                setTimeout(function () {

                    if (!copyButton) {
                        return;
                    }


                    copyButton.innerHTML =
                        '<i class="fas fa-copy me-1"></i> Copy';


                    copyButton.classList.remove(
                        'btn-success'
                    );


                    copyButton.classList.add(
                        'btn-outline-primary'
                    );

                }, 2000);

            }


            return;

        } catch (error) {

            console.warn(
                '[USER MANAGEMENT] Clipboard API unavailable. Using fallback.'
            );

        }


        // =================================================
        // FALLBACK COPY
        // =================================================

        try {

            passwordInput.removeAttribute(
                'readonly'
            );


            passwordInput.focus();


            passwordInput.select();


            passwordInput.setSelectionRange(
                0,
                passwordInput.value.length
            );


            const copied =
                document.execCommand('copy');


            passwordInput.setAttribute(
                'readonly',
                'readonly'
            );


            if (copied) {

                if (copyMessage) {

                    copyMessage.textContent =
                        'Password copied to clipboard.';

                    copyMessage.className =
                        'text-success small mt-2';

                }


                if (copyButton) {

                    copyButton.innerHTML =
                        '<i class="fas fa-check me-1"></i> Copied';

                    copyButton.classList.remove(
                        'btn-outline-primary'
                    );

                    copyButton.classList.add(
                        'btn-success'
                    );

                }

            } else {

                if (copyMessage) {

                    copyMessage.textContent =
                        'Copy failed. Please select and copy the password manually.';

                    copyMessage.className =
                        'text-danger small mt-2';

                }

            }

        } catch (error) {

            console.error(
                '[USER MANAGEMENT] Copy failed:',
                error
            );


            if (copyMessage) {

                copyMessage.textContent =
                    'Copy failed. Please copy the password manually.';

                copyMessage.className =
                    'text-danger small mt-2';

            }

        }

    }


    // =================================================
    // EVENT DELEGATION
    // =================================================
    // This is intentionally attached to document so
    // it works even when the modal is initially hidden.
    // =================================================

    document.addEventListener(
        'click',
        function (event) {

            // -----------------------------------------
            // COPY BUTTON
            // -----------------------------------------

            const copyButton =
                event.target.closest(
                    '#copy-temporary-password'
                );


            if (copyButton) {

                event.preventDefault();

                event.stopPropagation();

                copyTemporaryPassword();

                return;

            }


            // -----------------------------------------
            // DONE BUTTON
            // -----------------------------------------

            const doneButton =
                event.target.closest(
                    '#password-reset-done'
                );


            if (doneButton) {

                event.preventDefault();

                event.stopPropagation();

                closePasswordResetModal();

                return;

            }


            // -----------------------------------------
            // CLOSE BUTTON
            // -----------------------------------------

            const closeButton =
                event.target.closest(
                    '#close-password-reset-modal'
                );


            if (closeButton) {

                event.preventDefault();

                event.stopPropagation();

                closePasswordResetModal();

                return;

            }


            // -----------------------------------------
            // CLICK OUTSIDE MODAL
            // -----------------------------------------

            const modal =
                document.getElementById(
                    'password-reset-modal'
                );


            if (
                modal &&
                event.target === modal
            ) {

                closePasswordResetModal();

            }

        },
        true
    );


    // =================================================
    // ESCAPE KEY
    // =================================================

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key !== 'Escape'
            ) {

                return;

            }


            const modal =
                document.getElementById(
                    'password-reset-modal'
                );


            if (
                modal &&
                modal.style.display !== 'none'
            ) {

                closePasswordResetModal();

            }

        }
    );


    console.log(
        '[USER MANAGEMENT] Password reset modal controls ready'
    );

})();

