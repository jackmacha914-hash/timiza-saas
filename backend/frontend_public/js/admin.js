// =====================================================
// SCHOOLSYNC SaaS - ADMIN USER MANAGEMENT
// Students + Teachers
//
// IMPORTANT:
// This version uses the EXISTING SaaS /api/users endpoint.
// DO NOT use /api/management-users.
//
// Tenant isolation must remain handled by the backend.
// =====================================================

(function () {

    'use strict';


    // =====================================================
    // API
    // =====================================================

    const API_URL = '/api/users';

    let allUsers = [];
    let managementUsers = [];


    // =====================================================
    // HELPERS
    // =====================================================

    function getToken() {

        return (
            localStorage.getItem('token') ||
            ''
        );

    }


    function getElement(id) {

        return document.getElementById(id);

    }


    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    function normalizeRole(user) {

        return String(
            user?.role ||
            user?.accountType ||
            ''
        )
            .trim()
            .toLowerCase();

    }


    function normalizeStatus(user) {

        const status = String(
            user?.status ??
            ''
        )
            .trim()
            .toLowerCase();


        if (
            status === 'suspended' ||
            status === 'inactive' ||
            status === 'disabled'
        ) {

            return 'Suspended';

        }


        return 'Active';

    }


    function getUserClass(user) {

        return (
            user?.studentClass ||
            user?.classAssigned ||
            user?.className ||
            user?.class ||
            user?.profile?.studentClass ||
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


        return (
            user?.specialization ||
            user?.profile?.specialization ||
            ''
        );

    }


    function getUserId(user) {

        return String(
            user?._id ||
            user?.id ||
            ''
        );

    }


    // =====================================================
    // DOM
    // =====================================================

    const form =
        getElement(
            'management-add-user-form'
        );


    const roleSelect =
        getElement(
            'management-user-role'
        );


    const subjectContainer =
        getElement(
            'management-subject-container'
        );


    const classContainer =
        getElement(
            'management-class-container'
        );


    const tableBody =
        getElement(
            'management-users-table-body'
        );


    // =====================================================
    // ROLE FIELDS
    // =====================================================

    function updateRoleFields() {

        if (!roleSelect) {
            return;
        }


        const role =
            String(
                roleSelect.value || ''
            )
                .trim()
                .toLowerCase();


        if (role === 'teacher') {

            if (subjectContainer) {

                subjectContainer.style.display =
                    'block';

            }


            if (classContainer) {

                classContainer.style.display =
                    'none';

            }

        } else {

            if (subjectContainer) {

                subjectContainer.style.display =
                    'none';

            }


            if (classContainer) {

                classContainer.style.display =
                    'block';

            }

        }

    }


    if (roleSelect) {

        roleSelect.addEventListener(
            'change',
            updateRoleFields
        );

    }


    // =====================================================
    // API RESPONSE NORMALIZER
    // =====================================================

    function extractUsers(result) {

        /*
         * SaaS /api/users may return:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * OR:
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         *
         * OR:
         *
         * {
         *   users: [...]
         * }
         */

        if (Array.isArray(result)) {

            return result;

        }


        if (
            result &&
            Array.isArray(result.data)
        ) {

            return result.data;

        }


        if (
            result &&
            Array.isArray(result.users)
        ) {

            return result.users;

        }


        if (
            result?.data &&
            Array.isArray(result.data.users)
        ) {

            return result.data.users;

        }


        return [];

    }


    // =====================================================
    // LOAD USERS
    // =====================================================

    async function loadManagementUsers() {

        const loading =
            getElement(
                'management-users-loading'
            );


        const errorBox =
            getElement(
                'management-users-error'
            );


        if (loading) {

            loading.style.display =
                'block';

        }


        if (errorBox) {

            errorBox.style.display =
                'none';

            errorBox.textContent =
                '';

        }


        try {

            const searchInput =
                getElement(
                    'management-user-search'
                );


            const roleFilter =
                getElement(
                    'management-role-filter'
                );


            const statusFilter =
                getElement(
                    'management-status-filter'
                );


            const search =
                searchInput
                    ? searchInput.value.trim()
                    : '';


            const role =
                roleFilter
                    ? roleFilter.value.trim().toLowerCase()
                    : '';


            const status =
                statusFilter
                    ? statusFilter.value.trim().toLowerCase()
                    : '';


            /*
             * IMPORTANT:
             *
             * We query the EXISTING SaaS /api/users endpoint.
             *
             * The backend remains responsible for tenant isolation.
             */

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


            if (status) {

                params.set(
                    'status',
                    status
                );

            }


            const query =
                params.toString();


            const url =
                query
                    ? `${API_URL}?${query}`
                    : API_URL;


            console.log(
                '[USER MANAGEMENT] Loading SaaS users:',
                {
                    url,
                    search,
                    role,
                    status
                }
            );


            const token =
                getToken();


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
                '[USER MANAGEMENT] /api/users response:',
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    'Failed to load users'
                );

            }


            allUsers =
                extractUsers(result);


            console.log(
                '[USER MANAGEMENT] Raw SaaS users:',
                allUsers.length
            );


            /*
             * IMPORTANT:
             *
             * Only show Students + Teachers in this
             * particular management screen.
             *
             * Admins, superadmins, parents, etc. remain
             * available to the SaaS user-management system
             * but are not displayed here.
             */

            managementUsers =
                allUsers.filter(
                    user => {

                        const role =
                            normalizeRole(user);

                        return (
                            role === 'student' ||
                            role === 'teacher'
                        );

                    }
                );


            console.log(
                '[USER MANAGEMENT] Students + Teachers loaded:',
                managementUsers.length
            );


            renderManagementUsers();


        } catch (error) {

            console.error(
                '[USER MANAGEMENT] LOAD ERROR:',
                error
            );


            allUsers = [];

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

                loading.style.display =
                    'none';

            }

        }

    }


    // =====================================================
    // RENDER
    // =====================================================

    function renderManagementUsers() {

        if (!tableBody) {

            console.warn(
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
        // STATS
        // =================================================

        const total =
            managementUsers.length;


        const active =
            managementUsers.filter(
                user =>
                    normalizeStatus(user) === 'Active'
            ).length;


        const suspended =
            managementUsers.filter(
                user =>
                    normalizeStatus(user) === 'Suspended'
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

            totalElement.textContent =
                total;

        }


        if (activeElement) {

            activeElement.textContent =
                active;

        }


        if (suspendedElement) {

            suspendedElement.textContent =
                suspended;

        }


        // =================================================
        // EMPTY
        // =================================================

        if (!managementUsers.length) {

            if (empty) {

                empty.style.display =
                    'block';

            }

            return;

        }


        if (empty) {

            empty.style.display =
                'none';

        }


        // =================================================
        // ROWS
        // =================================================

        managementUsers.forEach(
            user => {

                const row =
                    document.createElement('tr');


                const role =
                    normalizeRole(user);


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
                    normalizeStatus(user);


                const isActive =
                    status === 'Active';


                const userId =
                    getUserId(user);


                row.innerHTML = `

                    <td>
                        <strong>
                            ${escapeHtml(
                                user.name ||
                                user.fullName ||
                                '—'
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHtml(
                            user.email ||
                            '—'
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

                        ${escapeHtml(
                            details
                        )}

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
                                    onclick="suspendManagementUser('${escapeHtml(userId)}')"
                                >

                                    <i class="fas fa-pause"></i>

                                    Suspend

                                </button>

                            `

                            : `

                                <button
                                    type="button"
                                    class="btn btn-sm btn-success"
                                    onclick="activateManagementUser('${escapeHtml(userId)}')"
                                >

                                    <i class="fas fa-check"></i>

                                    Activate

                                </button>

                            `
                        }


                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteManagementUser('${escapeHtml(userId)}')"
                            title="Delete user"
                        >

                            <i class="fas fa-trash"></i>

                        </button>

                    </td>

                `;


                tableBody.appendChild(row);

            }
        );

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
                    getElement(
                        'management-add-user-message'
                    );


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


                const role =
                    roleSelect
                        ? String(
                            roleSelect.value || ''
                        )
                            .trim()
                            .toLowerCase()
                        : 'student';


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


                // =================================================
                // VALIDATION
                // =================================================

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
                    role !== 'student' &&
                    role !== 'teacher'
                ) {

                    showMessage(
                        message,
                        'Select Student or Teacher.',
                        'danger'
                    );

                    return;

                }


                // =================================================
                // SaaS USER PAYLOAD
                // =================================================

                const body = {

                    name,

                    email,

                    password,

                    role,

                    subject,

                    studentClass

                };


                console.log(
                    '[USER MANAGEMENT] Creating SaaS user:',
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
                        '[USER MANAGEMENT] CREATE /api/users:',
                        result
                    );


                    if (!response.ok) {

                        throw new Error(
                            result?.message ||
                            'Failed to create user'
                        );

                    }


                    showMessage(
                        message,
                        result?.message ||
                        'User created successfully.',
                        'success'
                    );


                    form.reset();


                    updateRoleFields();


                    /*
                     * Reload from SaaS endpoint.
                     */

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
    // STATUS ACTION HELPER
    // =====================================================

    async function changeUserStatus(
        id,
        action
    ) {

        if (!id) {

            return;

        }


        try {

            const token =
                getToken();


            /*
             * Existing SaaS route:
             *
             * /api/users/:id/suspend
             * /api/users/:id/activate
             */

            const response =
                await fetch(
                    `${API_URL}/${encodeURIComponent(id)}/${action}`,
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
                `[USER MANAGEMENT] ${action.toUpperCase()}:`,
                result
            );


            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    `Failed to ${action} account`
                );

            }


            await loadManagementUsers();


        } catch (error) {

            console.error(
                `[USER MANAGEMENT] ${action.toUpperCase()} ERROR:`,
                error
            );


            alert(
                error.message ||
                `Failed to ${action} account`
            );

        }

    }


    // =====================================================
    // ACTIVATE
    // =====================================================

    window.activateManagementUser =
        async function (id) {

            await changeUserStatus(
                id,
                'activate'
            );

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


            await changeUserStatus(
                id,
                'suspend'
            );

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
                    '[USER MANAGEMENT] DELETE /api/users:',
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result?.message ||
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
    // SEARCH
    // =====================================================

    const searchButton =
        getElement(
            'management-search-btn'
        );


    if (searchButton) {

        searchButton.addEventListener(
            'click',
            loadManagementUsers
        );

    }


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
    // SEARCH FILTER
    // =====================================================

    /*
     * Optional live search.
     * If you don't want live searching, remove this block.
     */

    if (searchInput) {

        let searchTimer = null;


        searchInput.addEventListener(
            'input',
            function () {

                clearTimeout(
                    searchTimer
                );


                searchTimer =
                    setTimeout(
                        loadManagementUsers,
                        350
                    );

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
            loadManagementUsers
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
            loadManagementUsers
        );

    }


    // =====================================================
    // REFRESH
    // =====================================================

    const refreshButton =
        getElement(
            'management-refresh-btn'
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            loadManagementUsers
        );

    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initializeManagementUsers() {

        console.log(
            '[USER MANAGEMENT] SaaS initialization...'
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
