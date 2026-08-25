// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================
// Uses EXISTING /api/users collection
// Students + Teachers only
//
// IMPORTANT:
// This replaces the old /api/management-users frontend.
// =====================================================

(function () {

    'use strict';

    const API_URL = '/api/users';

    let managementUsers = [];


    // =====================================================
    // HELPERS
    // =====================================================

    function getElement(id) {
        return document.getElementById(id);
    }


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


    function getStatus(user) {

        /*
         * Existing User records may not have status.
         * If status is missing, treat the account as Active.
         */

        const status =
            String(user?.status || 'Active')
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


    function getClass(user) {

        return (
            user?.classAssigned ||
            user?.class ||
            user?.studentClass ||
            user?.profile?.class ||
            ''
        );

    }


    function getSubject(user) {

        if (user?.subject) {
            return user.subject;
        }

        if (user?.specialization) {
            return user.specialization;
        }

        if (user?.profile?.specialization) {
            return user.profile.specialization;
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

        return '';

    }


    function showMessage(element, text, type) {

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            `alert alert-${type}`;

        element.style.display = 'block';

    }


    // =====================================================
    // ELEMENTS
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
            loading.style.display = 'block';
        }


        if (errorBox) {

            errorBox.style.display = 'none';

            errorBox.textContent = '';

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


            const selectedRole =
                roleFilter
                    ? roleFilter.value.trim().toLowerCase()
                    : '';


            const selectedStatus =
                statusFilter
                    ? statusFilter.value.trim().toLowerCase()
                    : '';


            console.log(
                '[USER MANAGEMENT] Loading from /api/users',
                {
                    search,
                    role: selectedRole,
                    status: selectedStatus
                }
            );


            const token =
                getToken();


            const response =
                await fetch(
                    API_URL,
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
                    result.message ||
                    'Failed to load users'
                );

            }


            /*
             * /api/users returns:
             *
             * [
             *   {...},
             *   {...}
             * ]
             *
             * NOT:
             *
             * { data: [...] }
             */

            let users =
                Array.isArray(result)
                    ? result
                    : Array.isArray(result.data)
                        ? result.data
                        : [];


            console.log(
                '[USER MANAGEMENT] Raw users:',
                users.length
            );


            // =================================================
            // ONLY STUDENTS + TEACHERS
            // =================================================

            users =
                users.filter(
                    user => {

                        const role =
                            String(
                                user?.role || ''
                            )
                                .toLowerCase()
                                .trim();

                        return (
                            role === 'student' ||
                            role === 'teacher'
                        );

                    }
                );


            // =================================================
            // SEARCH
            // =================================================

            if (search) {

                const searchLower =
                    search.toLowerCase();


                users =
                    users.filter(
                        user => {

                            const name =
                                String(
                                    user?.name || ''
                                ).toLowerCase();


                            const email =
                                String(
                                    user?.email || ''
                                ).toLowerCase();


                            const userClass =
                                String(
                                    getClass(user)
                                ).toLowerCase();


                            const subject =
                                String(
                                    getSubject(user)
                                ).toLowerCase();


                            return (
                                name.includes(searchLower) ||
                                email.includes(searchLower) ||
                                userClass.includes(searchLower) ||
                                subject.includes(searchLower)
                            );

                        }
                    );

            }


            // =================================================
            // ROLE FILTER
            // =================================================

            if (
                selectedRole &&
                (
                    selectedRole === 'student' ||
                    selectedRole === 'teacher'
                )
            ) {

                users =
                    users.filter(
                        user =>
                            String(
                                user?.role || ''
                            )
                                .toLowerCase()
                                .trim() === selectedRole
                    );

            }


            // =================================================
            // STATUS FILTER
            // =================================================

            if (selectedStatus) {

                users =
                    users.filter(
                        user =>
                            getStatus(user)
                                .toLowerCase() === selectedStatus
                    );

            }


            managementUsers =
                users;


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
    // RENDER
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
                    getStatus(user) === 'Active'
            ).length;


        const suspended =
            managementUsers.filter(
                user =>
                    getStatus(user) === 'Suspended'
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

        managementUsers.forEach(
            user => {

                const row =
                    document.createElement('tr');


                const role =
                    String(
                        user?.role || ''
                    )
                        .toLowerCase()
                        .trim();


                const roleLabel =
                    role === 'teacher'
                        ? 'Teacher'
                        : 'Student';


                const details =
                    role === 'teacher'
                        ? (
                            getSubject(user) ||
                            '—'
                        )
                        : (
                            getClass(user) ||
                            '—'
                        );


                const status =
                    getStatus(user);


                const isActive =
                    status === 'Active';


                const userId =
                    String(
                        user?._id || ''
                    );


                row.innerHTML = `

                    <td>
                        <strong>
                            ${escapeHtml(
                                user?.name || '—'
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHtml(
                            user?.email || '—'
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
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteManagementUser('${userId}')"
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


                const role =
                    roleSelect
                        ? String(
                            roleSelect.value || ''
                        )
                            .toLowerCase()
                            .trim()
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
                    ![
                        'student',
                        'teacher'
                    ].includes(role)
                ) {

                    showMessage(
                        message,
                        'Select Student or Teacher.',
                        'danger'
                    );

                    return;

                }


                // =================================================
                // CREATE
                // =================================================

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
                                    JSON.stringify({

                                        name,

                                        email,

                                        password,

                                        role,

                                        class:
                                            role === 'student'
                                                ? studentClass
                                                : '',

                                        classAssigned:
                                            role === 'student'
                                                ? studentClass
                                                : '',

                                        subject:
                                            role === 'teacher'
                                                ? subject
                                                : '',

                                        specialization:
                                            role === 'teacher'
                                                ? subject
                                                : ''

                                    })

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
    // ACTIVATE
    // =====================================================

    window.activateManagementUser =
        async function (id) {

            if (!id) {
                return;
            }


            if (
                !confirm(
                    'Activate this account?'
                )
            ) {
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
    // INITIALIZE
    // =====================================================

    function initializeManagementUsers() {

        console.log(
            '[USER MANAGEMENT] Initializing using /api/users'
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
