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
// =====================================================

(function () {

    const API_URL = '/api/management-users';

    let managementUsers = [];


    // =====================================================
    // ELEMENTS
    // =====================================================

    const form =
        document.getElementById('management-add-user-form');

    const roleSelect =
        document.getElementById('management-user-role');

    const subjectContainer =
        document.getElementById('management-subject-container');

    const classContainer =
        document.getElementById('management-class-container');

    const tableBody =
        document.getElementById('management-users-table-body');


    // =====================================================
    // ROLE FIELDS
    // =====================================================

    function updateRoleFields() {

        if (!roleSelect) return;

        const role =
            String(roleSelect.value || '').toLowerCase();

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
            document.getElementById(
                'management-users-loading'
            );

        const errorBox =
            document.getElementById(
                'management-users-error'
            );

        if (loading) {
            loading.style.display = 'block';
        }

        if (errorBox) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        }


        try {

            const searchInput =
                document.getElementById(
                    'management-user-search'
                );

            const roleFilter =
                document.getElementById(
                    'management-role-filter'
                );

            const statusFilter =
                document.getElementById(
                    'management-status-filter'
                );


            const search =
                searchInput
                    ? searchInput.value.trim()
                    : '';

            const role =
                roleFilter
                    ? roleFilter.value
                    : '';

            const status =
                statusFilter
                    ? statusFilter.value
                    : '';


            const params =
                new URLSearchParams();


            if (search) {
                params.set('search', search);
            }

            if (role) {
                params.set('role', role);
            }

            // IMPORTANT:
            // Backend expects "status", NOT "active"
            if (status) {
                params.set('status', status);
            }


            const token =
                localStorage.getItem('token');


            console.log(
                '[USER MANAGEMENT] Loading users',
                {
                    search,
                    role,
                    status
                }
            );


            const response =
                await fetch(
                    `${API_URL}?${params.toString()}`,
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


            renderManagementUsers();


        } catch (error) {

            console.error(
                '[USER MANAGEMENT] Load error:',
                error
            );


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
            document.getElementById(
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
                    String(user.status || '')
                        .toLowerCase() === 'active'
            ).length;


        const suspended =
            managementUsers.filter(
                user =>
                    String(user.status || '')
                        .toLowerCase() === 'suspended'
            ).length;


        const totalElement =
            document.getElementById(
                'management-total-users'
            );

        const activeElement =
            document.getElementById(
                'management-active-users'
            );

        const suspendedElement =
            document.getElementById(
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
        // EMPTY
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
        // TABLE
        // =================================================

        managementUsers.forEach(user => {

            const row =
                document.createElement('tr');


            const role =
                String(user.role || '')
                    .toLowerCase();


            const roleLabel =
                role === 'teacher'
                    ? 'Teacher'
                    : 'Student';


            const details =
                role === 'teacher'
                    ? (
                        user.subject ||
                        '—'
                    )
                    : (
                        user.studentClass ||
                        '—'
                    );


            const status =
                String(
                    user.status || 'Active'
                );


            const isActive =
                status.toLowerCase() === 'active';


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

                        ${
                            isActive
                                ? 'Active'
                                : 'Suspended'
                        }

                    </span>

                </td>


                <td class="text-end">

                    ${
                        isActive

                        ? `

                            <button
                                type="button"
                                class="btn btn-sm btn-warning"
                                onclick="suspendManagementUser('${user._id}')"
                            >

                                <i class="fas fa-pause"></i>

                                Suspend

                            </button>

                        `

                        : `

                            <button
                                type="button"
                                class="btn btn-sm btn-success"
                                onclick="activateManagementUser('${user._id}')"
                            >

                                <i class="fas fa-check"></i>

                                Activate

                            </button>

                        `
                    }


                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        onclick="deleteManagementUser('${user._id}')"
                    >

                        <i class="fas fa-trash"></i>

                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });

    }


    // =====================================================
    // CREATE USER
    // =====================================================

    if (form) {

        form.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const message =
                    document.getElementById(
                        'management-add-user-message'
                    );


                const role =
                    roleSelect
                        ? roleSelect.value
                        : 'student';


                const name =
                    document.getElementById(
                        'management-user-name'
                    ).value.trim();


                const email =
                    document.getElementById(
                        'management-user-email'
                    ).value.trim();


                const password =
                    document.getElementById(
                        'management-user-password'
                    ).value;


                const subjectElement =
                    document.getElementById(
                        'management-user-subject'
                    );


                const classElement =
                    document.getElementById(
                        'management-user-class'
                    );


                const body = {

                    name,

                    email,

                    password,

                    role,

                    subject:
                        subjectElement
                            ? subjectElement.value.trim()
                            : '',

                    studentClass:
                        classElement
                            ? classElement.value.trim()
                            : ''

                };


                try {

                    const token =
                        localStorage.getItem('token');


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


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            'Failed to create user'
                        );
                    }


                    if (message) {

                        message.textContent =
                            'User created successfully.';

                        message.className =
                            'alert alert-success';

                        message.style.display =
                            'block';
                    }


                    form.reset();

                    updateRoleFields();

                    await loadManagementUsers();


                } catch (error) {

                    console.error(
                        '[USER MANAGEMENT] CREATE ERROR:',
                        error
                    );


                    if (message) {

                        message.textContent =
                            error.message;

                        message.className =
                            'alert alert-danger';

                        message.style.display =
                            'block';
                    }

                }

            }
        );

    }


    // =====================================================
    // ACTIVATE
    // =====================================================

    window.activateManagementUser =
        async function (id) {

            try {

                const token =
                    localStorage.getItem('token');


                const response =
                    await fetch(
                        `${API_URL}/${id}/activate`,
                        {
                            method: 'PATCH',

                            credentials:
                                'include',

                            headers: {

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

                alert(error.message);

            }

        };


    // =====================================================
    // SUSPEND
    // =====================================================

    window.suspendManagementUser =
        async function (id) {

            if (
                !confirm(
                    'Suspend this account?'
                )
            ) {
                return;
            }


            try {

                const token =
                    localStorage.getItem('token');


                const response =
                    await fetch(
                        `${API_URL}/${id}/suspend`,
                        {
                            method: 'PATCH',

                            credentials:
                                'include',

                            headers: {

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

                alert(error.message);

            }

        };


    // =====================================================
    // DELETE
    // =====================================================

    window.deleteManagementUser =
        async function (id) {

            if (
                !confirm(
                    'Delete this account permanently?'
                )
            ) {
                return;
            }


            try {

                const token =
                    localStorage.getItem('token');


                const response =
                    await fetch(
                        `${API_URL}/${id}`,
                        {
                            method: 'DELETE',

                            credentials:
                                'include',

                            headers: {

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

                alert(error.message);

            }

        };


    // =====================================================
    // SEARCH
    // =====================================================

    document
        .getElementById(
            'management-search-btn'
        )
        ?.addEventListener(
            'click',
            loadManagementUsers
        );


    // =====================================================
    // ROLE FILTER
    // =====================================================

    document
        .getElementById(
            'management-role-filter'
        )
        ?.addEventListener(
            'change',
            loadManagementUsers
        );


    // =====================================================
    // STATUS FILTER
    // =====================================================

    document
        .getElementById(
            'management-status-filter'
        )
        ?.addEventListener(
            'change',
            loadManagementUsers
        );


    // =====================================================
    // REFRESH
    // =====================================================

    document
        .getElementById(
            'management-refresh-btn'
        )
        ?.addEventListener(
            'click',
            loadManagementUsers
        );


    // =====================================================
    // SEARCH ENTER
    // =====================================================

    document
        .getElementById(
            'management-user-search'
        )
        ?.addEventListener(
            'keydown',
            function (event) {

                if (event.key === 'Enter') {

                    event.preventDefault();

                    loadManagementUsers();

                }

            }
        );


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            loadManagementUsers
        );

    } else {

        loadManagementUsers();

    }

})();
