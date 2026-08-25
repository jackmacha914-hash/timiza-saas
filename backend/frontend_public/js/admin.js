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
// USER MANAGEMENT
// =====================================================

(function () {

    const API_URL = '/api/management-users';

    let managementUsers = [];


    // =================================================
    // ELEMENTS
    // =================================================

    const form =
        document.getElementById(
            'management-add-user-form'
        );

    const roleSelect =
        document.getElementById(
            'management-user-role'
        );

    const subjectContainer =
        document.getElementById(
            'management-subject-container'
        );

    const classContainer =
        document.getElementById(
            'management-class-container'
        );

    const tableBody =
        document.getElementById(
            'management-users-table-body'
        );


    // =================================================
    // ROLE FIELD DISPLAY
    // =================================================

    function updateRoleFields() {

        const role = roleSelect.value;

        if (role === 'teacher') {

            subjectContainer.style.display =
                'block';

            classContainer.style.display =
                'none';

        } else {

            subjectContainer.style.display =
                'none';

            classContainer.style.display =
                'block';
        }
    }


    if (roleSelect) {
        roleSelect.addEventListener(
            'change',
            updateRoleFields
        );

        updateRoleFields();
    }


    // =================================================
    // LOAD USERS
    // =================================================

    async function loadManagementUsers() {

        const loading =
            document.getElementById(
                'management-users-loading'
            );

        const errorBox =
            document.getElementById(
                'management-users-error'
            );

        loading.style.display = 'block';
        errorBox.style.display = 'none';


        try {

            const search =
                document.getElementById(
                    'management-user-search'
                ).value.trim();

            const role =
                document.getElementById(
                    'management-role-filter'
                ).value;

            const active =
                document.getElementById(
                    'management-status-filter'
                ).value;


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

            if (active) {
                params.set(
                    'active',
                    active
                );
            }


            const response =
                await fetch(
                    `${API_URL}?${params.toString()}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type':
                                'application/json',

                            'Authorization':
                                `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    result.message ||
                    'Failed to load users'
                );
            }


            managementUsers =
                result.data || [];


            renderManagementUsers();


        } catch (error) {

            console.error(
                '[USER MANAGEMENT]',
                error
            );

            errorBox.textContent =
                error.message;

            errorBox.style.display =
                'block';

        } finally {

            loading.style.display =
                'none';
        }
    }


    // =================================================
    // RENDER USERS
    // =================================================

    function renderManagementUsers() {

        tableBody.innerHTML = '';


        const empty =
            document.getElementById(
                'management-users-empty'
            );


        // Statistics
        const total =
            managementUsers.length;

        const active =
            managementUsers.filter(
                user => user.active === true
            ).length;

        const suspended =
            managementUsers.filter(
                user => user.active === false
            ).length;


        document.getElementById(
            'management-total-users'
        ).textContent = total;


        document.getElementById(
            'management-active-users'
        ).textContent = active;


        document.getElementById(
            'management-suspended-users'
        ).textContent = suspended;


        if (!managementUsers.length) {

            empty.style.display =
                'block';

            return;

        }


        empty.style.display =
            'none';


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
                    ? (user.subject || '—')
                    : (user.studentClass || '—');


            const isActive =
                user.active === true;


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(user.name || '—')}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(user.email || '—')}
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
                                class="btn btn-sm btn-warning"
                                onclick="suspendManagementUser('${user._id}')"
                            >
                                <i class="fas fa-pause"></i>
                                Suspend
                            </button>

                        `

                        : `

                            <button
                                class="btn btn-sm btn-success"
                                onclick="activateManagementUser('${user._id}')"
                            >
                                <i class="fas fa-check"></i>
                                Activate
                            </button>

                        `
                    }


                    <button
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


    // =================================================
    // CREATE USER
    // =================================================

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
                    roleSelect.value;


                const body = {

                    name:
                        document.getElementById(
                            'management-user-name'
                        ).value.trim(),

                    email:
                        document.getElementById(
                            'management-user-email'
                        ).value.trim(),

                    password:
                        document.getElementById(
                            'management-user-password'
                        ).value,

                    role: role,

                    subject:
                        document.getElementById(
                            'management-user-subject'
                        ).value.trim(),

                    studentClass:
                        document.getElementById(
                            'management-user-class'
                        ).value.trim()

                };


                try {

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

                                    'Authorization':
                                        `Bearer ${localStorage.getItem('token') || ''}`

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


                    message.textContent =
                        'User created successfully.';

                    message.className =
                        'alert alert-success';

                    message.style.display =
                        'block';


                    form.reset();

                    updateRoleFields();

                    await loadManagementUsers();


                } catch (error) {

                    message.textContent =
                        error.message;

                    message.className =
                        'alert alert-danger';

                    message.style.display =
                        'block';

                }

            }
        );

    }


    // =================================================
    // ACTIVATE
    // =================================================

    window.activateManagementUser =
        async function (id) {

            try {

                const response =
                    await fetch(
                        `${API_URL}/${id}/activate`,
                        {
                            method: 'PATCH',
                            credentials: 'include',
                            headers: {
                                'Authorization':
                                    `Bearer ${localStorage.getItem('token') || ''}`
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

                alert(error.message);

            }
        };


    // =================================================
    // SUSPEND
    // =================================================

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

                const response =
                    await fetch(
                        `${API_URL}/${id}/suspend`,
                        {
                            method: 'PATCH',
                            credentials: 'include',
                            headers: {
                                'Authorization':
                                    `Bearer ${localStorage.getItem('token') || ''}`
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

                alert(error.message);

            }
        };


    // =================================================
    // DELETE
    // =================================================

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

                const response =
                    await fetch(
                        `${API_URL}/${id}`,
                        {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: {
                                'Authorization':
                                    `Bearer ${localStorage.getItem('token') || ''}`
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

                alert(error.message);

            }
        };


    // =================================================
    // SEARCH / FILTERS
    // =================================================

    document
        .getElementById(
            'management-search-btn'
        )
        ?.addEventListener(
            'click',
            loadManagementUsers
        );


    document
        .getElementById(
            'management-role-filter'
        )
        ?.addEventListener(
            'change',
            loadManagementUsers
        );


    document
        .getElementById(
            'management-status-filter'
        )
        ?.addEventListener(
            'change',
            loadManagementUsers
        );


    document
        .getElementById(
            'management-refresh-btn'
        )
        ?.addEventListener(
            'click',
            loadManagementUsers
        );


    document
        .getElementById(
            'management-user-search'
        )
        ?.addEventListener(
            'keydown',
            function (event) {

                if (event.key === 'Enter') {
                    loadManagementUsers();
                }

            }
        );


    // =================================================
    // HTML ESCAPE
    // =================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    // =================================================
    // INITIAL LOAD
    // =================================================

    loadManagementUsers();

})();
