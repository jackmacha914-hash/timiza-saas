// =====================================================
// SCHOOL USER MANAGEMENT - SAAS USER SOURCE
// Students + Teachers
// SOURCE OF TRUTH: /api/users
// =====================================================

(function () {

    'use strict';

    const API_URL = '/api/users';

    let managementUsers = [];


    // =====================================================
    // HELPERS
    // =====================================================

    function getToken() {
        return localStorage.getItem('token') || '';
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


    function getUserRole(user) {

        return String(
            user?.role ||
            user?.userRole ||
            ''
        )
            .trim()
            .toLowerCase();

    }


    function getUserStatus(user) {

        const status = String(
            user?.status ??
            (user?.active === false ? 'suspended' : 'active')
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
            user?.profile?.classAssigned ||
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


    function getUserId(user) {

        return String(
            user?._id ||
            user?.id ||
            user?.userId ||
            ''
        );

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
                .trim()
                .toLowerCase();


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
    // LOAD SAAS USERS
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
                    ? searchInput.value.trim().toLowerCase()
                    : '';


            const selectedRole =
                roleFilter
                    ? roleFilter.value.trim().toLowerCase()
                    : '';


            const selectedStatus =
                statusFilter
                    ? statusFilter.value.trim().toLowerCase()
                    : '';


            const token =
                getToken();


            console.log(
                '[USER MANAGEMENT] Loading SaaS users from /api/users'
            );


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
                    result?.message ||
                    'Failed to load users'
                );

            }


            // -------------------------------------------------
            // SUPPORT THE COMMON /api/users RESPONSE SHAPES
            // -------------------------------------------------

            let rawUsers = [];


            if (Array.isArray(result)) {

                rawUsers = result;

            } else if (
                Array.isArray(result?.data)
            ) {

                rawUsers = result.data;

            } else if (
                Array.isArray(result?.users)
            ) {

                rawUsers = result.users;

            } else if (
                Array.isArray(result?.data?.users)
            ) {

                rawUsers = result.data.users;

            }


            console.log(
                '[USER MANAGEMENT] Raw SaaS users:',
                rawUsers.length
            );


            // -------------------------------------------------
            // IMPORTANT:
            // SaaS /api/users contains ALL users.
            //
            // Only Students + Teachers belong in this table.
            // -------------------------------------------------

            let filteredUsers =
                rawUsers.filter(function (user) {

                    const role =
                        getUserRole(user);

                    return (
                        role === 'student' ||
                        role === 'teacher'
                    );

                });


            console.log(
                '[USER MANAGEMENT] Students + Teachers loaded:',
                filteredUsers.length
            );


            // -------------------------------------------------
            // CLIENT-SIDE SEARCH
            // -------------------------------------------------

            if (search) {

                filteredUsers =
                    filteredUsers.filter(function (user) {

                        const name =
                            String(
                                user?.name || ''
                            ).toLowerCase();

                        const email =
                            String(
                                user?.email || ''
                            ).toLowerCase();

                        const username =
                            String(
                                user?.username || ''
                            ).toLowerCase();

                        return (
                            name.includes(search) ||
                            email.includes(search) ||
                            username.includes(search)
                        );

                    });

            }


            // -------------------------------------------------
            // ROLE FILTER
            // -------------------------------------------------

            if (
                selectedRole &&
                selectedRole !== 'all'
            ) {

                filteredUsers =
                    filteredUsers.filter(function (user) {

                        return (
                            getUserRole(user) ===
                            selectedRole
                        );

                    });

            }


            // -------------------------------------------------
            // STATUS FILTER
            // -------------------------------------------------

            if (
                selectedStatus &&
                selectedStatus !== 'all'
            ) {

                filteredUsers =
                    filteredUsers.filter(function (user) {

                        return (
                            getUserStatus(user)
                                .toLowerCase() ===
                            selectedStatus
                        );

                    });

            }


            managementUsers =
                filteredUsers;


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
            managementUsers.filter(function (user) {

                return (
                    getUserStatus(user) === 'Active'
                );

            }).length;


        const suspended =
            managementUsers.filter(function (user) {

                return (
                    getUserStatus(user) === 'Suspended'
                );

            }).length;


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
        // ROWS
        // =================================================

        managementUsers.forEach(function (user) {

            const row =
                document.createElement('tr');


            const role =
                getUserRole(user);


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
                getUserId(user);


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
                // SAAS CREATE PAYLOAD
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
                    body
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


                    // =================================================
                    // IMPORTANT:
                    // RELOAD FROM /api/users
                    // =================================================

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
                        result?.message ||
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
                        result?.message ||
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

                if (event.key === 'Enter') {

                    event.preventDefault();

                    loadManagementUsers();

                }

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
            '[USER MANAGEMENT] Initializing SaaS user management...'
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
