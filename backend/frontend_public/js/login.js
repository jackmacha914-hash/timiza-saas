// =====================================================
// DASHBOARD URL
// =====================================================

function getDashboardURL(role) {

    switch (role) {

        case 'superadmin':
            return '/superadmin.html';

        case 'admin':
            return '/index.html';

        case 'teacher':
            return '/teacher.html';

        case 'student':
            return '/student.html';

        case 'accountant':
            return '/accountant.html';

        case 'parent':
            return '/parent.html';

        default:
            return '/login.html';
    }
}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(
    message,
    elementId = 'error-message'
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        console.error(
            '[LOGIN] Error element not found:',
            elementId
        );
        return;
    }

    element.textContent = message;
    element.style.display = 'block';
    element.style.color = 'red';
}


// =====================================================
// SHOW SUCCESS
// =====================================================

function showSuccess(
    message,
    elementId
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.display = 'block';
    element.style.color = 'green';
}


// =====================================================
// HIDE ALL AUTH SCREENS
// =====================================================

function hideAllForms() {

    const loginForm =
        document.getElementById('login-form');

    const registerForm =
        document.getElementById('register-form');

    const changePasswordContainer =
        document.getElementById(
            'change-password-container'
        );


    // Hide login

    if (loginForm) {

        loginForm.style.display =
            'none';

    }


    // Hide register

    if (registerForm) {

        registerForm.style.display =
            'none';

    }


    // Hide change password container

    if (changePasswordContainer) {

        changePasswordContainer.style.display =
            'none';

    }

}


// =====================================================
// SHOW LOGIN FORM
// =====================================================

function showLoginForm() {

    hideAllForms();


    const loginForm =
        document.getElementById(
            'login-form'
        );

    const formTitle =
        document.getElementById(
            'form-title'
        );


    if (loginForm) {

        loginForm.style.display =
            'block';

    }


    if (formTitle) {

        formTitle.style.display =
            'block';

        formTitle.textContent =
            'Login';

    }

}


// =====================================================
// SHOW REGISTER FORM
// =====================================================

function showRegisterForm() {

    hideAllForms();


    const registerForm =
        document.getElementById(
            'register-form'
        );

    const formTitle =
        document.getElementById(
            'form-title'
        );


    if (registerForm) {

        registerForm.style.display =
            'block';

    }


    if (formTitle) {

        formTitle.style.display =
            'block';

        formTitle.textContent =
            'Create Account';

    }

}


// =====================================================
// SHOW CHANGE PASSWORD SCREEN
// =====================================================

function showChangePasswordForm() {

    console.log(
        '[LOGIN] SHOWING CHANGE PASSWORD SCREEN'
    );


    // Hide login/register

    hideAllForms();


    const changePasswordContainer =
        document.getElementById(
            'change-password-container'
        );

    const changePasswordForm =
        document.getElementById(
            'change-password-form'
        );

    const formTitle =
        document.getElementById(
            'form-title'
        );


    // =================================================
    // MAKE SURE CONTAINER EXISTS
    // =================================================

    if (!changePasswordContainer) {

        console.error(
            '[LOGIN] change-password-container NOT FOUND'
        );

        alert(
            'ERROR: change-password-container is missing from login.html'
        );

        return;

    }


    // =================================================
    // SHOW CHANGE PASSWORD CONTAINER
    // =================================================

    changePasswordContainer.style.display =
        'block';

    changePasswordContainer.style.visibility =
        'visible';

    changePasswordContainer.style.opacity =
        '1';


    // =================================================
    // SHOW CHANGE PASSWORD FORM
    // =================================================

    if (changePasswordForm) {

        changePasswordForm.style.display =
            'block';

        changePasswordForm.style.visibility =
            'visible';

        changePasswordForm.style.opacity =
            '1';

    }


    // =================================================
    // HIDE MAIN LOGIN TITLE
    // =================================================

    if (formTitle) {

        formTitle.style.display =
            'none';

    }


    // =================================================
    // CLEAR OLD MESSAGE
    // =================================================

    const message =
        document.getElementById(
            'change-password-message'
        );

    if (message) {

        message.textContent =
            '';

        message.style.display =
            'none';

    }


    // =================================================
    // FOCUS CURRENT PASSWORD
    // =================================================

    const currentPassword =
        document.getElementById(
            'current-password'
        );

    if (currentPassword) {

        setTimeout(() => {

            currentPassword.focus();

        }, 100);

    }


    console.log(
        '[LOGIN] Change Password UI displayed successfully'
    );

}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '[LOGIN] Login JavaScript loaded'
        );


        // =================================================
        // GET ELEMENTS
        // =================================================

        const loginForm =
            document.getElementById(
                'login-form'
            );

        const registerForm =
            document.getElementById(
                'register-form'
            );

        const changePasswordForm =
            document.getElementById(
                'change-password-form'
            );

        const showRegisterLink =
            document.getElementById(
                'show-register'
            );

        const showLoginButton =
            document.getElementById(
                'show-login'
            );

        const roleSelect =
            document.getElementById(
                'role'
            );

        const classGroup =
            document.getElementById(
                'class-group'
            );


        // =================================================
        // DEBUG ELEMENT CHECK
        // =================================================

        console.log(
            '[LOGIN] Elements:',
            {
                loginForm: !!loginForm,
                registerForm: !!registerForm,
                changePasswordForm: !!changePasswordForm,
                changePasswordContainer:
                    !!document.getElementById(
                        'change-password-container'
                    ),
                showRegisterLink:
                    !!showRegisterLink,
                showLoginButton:
                    !!showLoginButton
            }
        );


        // =================================================
        // LOGIN
        // =================================================

        if (loginForm) {

            loginForm.addEventListener(
                'submit',
                async function (e) {

                    e.preventDefault();


                    console.log(
                        '[LOGIN] Login submitted'
                    );


                    const emailElement =
                        document.getElementById(
                            'login-email'
                        );

                    const passwordElement =
                        document.getElementById(
                            'login-password'
                        );

                    const schoolCodeElement =
                        document.getElementById(
                            'school-code'
                        );


                    const email =
                        emailElement?.value?.trim();

                    const password =
                        passwordElement?.value || '';

                    const schoolCode =
                        schoolCodeElement?.value?.trim();


                    // =================================================
                    // VALIDATION
                    // =================================================

                    if (
                        !email ||
                        !password ||
                        !schoolCode
                    ) {

                        showError(
                            'Please enter school code, email and password'
                        );

                        return;

                    }


                    try {

                        console.log(
                            '[LOGIN] Sending login request'
                        );


                        // =================================================
                        // LOGIN REQUEST
                        // =================================================

                        const response =
                            await apiFetch(
                                `${API_CONFIG.AUTH_URL}/login`,
                                {
                                    method: 'POST',

                                    body:
                                        JSON.stringify({
                                            email,
                                            password,
                                            schoolCode
                                        })
                                }
                            );


                        console.log(
                            '[LOGIN] Server response:',
                            response
                        );


                        // =================================================
                        // CHECK TOKEN
                        // =================================================

                        if (!response?.token) {

                            showError(
                                'No authentication token received'
                            );

                            return;

                        }


                        // =================================================
                        // SAVE TOKEN
                        // =================================================

                        localStorage.setItem(
                            'token',
                            response.token
                        );


                        console.log(
                            '[LOGIN] Token saved'
                        );


                        // =================================================
                        // SAVE USER
                        // =================================================

                        if (response.user) {

                            localStorage.setItem(
                                'user',
                                JSON.stringify(
                                    response.user
                                )
                            );

                        }


                        // =================================================
                        // GET ROLE
                        // =================================================

                        const role =
                            response.user?.role ||
                            response.role ||
                            'student';


                        // =================================================
                        // CHECK TEMPORARY PASSWORD
                        // =================================================

                        const mustChangePassword =
                            response.mustChangePassword === true ||
                            response.user?.mustChangePassword === true;


                        console.log(
                            '[LOGIN] mustChangePassword:',
                            mustChangePassword
                        );


                        // =================================================
                        // TEMPORARY PASSWORD
                        // =================================================

                        if (mustChangePassword) {

                            console.log(
                                '[LOGIN] Temporary password detected'
                            );


                            console.log(
                                '[LOGIN] User must change password'
                            );


                            // -------------------------------------------------
                            // SHOW CHANGE PASSWORD SCREEN
                            // -------------------------------------------------

                            showChangePasswordForm();


                            // -------------------------------------------------
                            // CLEAR LOGIN PASSWORD
                            // -------------------------------------------------

                            if (passwordElement) {

                                passwordElement.value =
                                    '';

                            }


                            // -------------------------------------------------
                            // PUT TEMP PASSWORD INTO CURRENT PASSWORD
                            // -------------------------------------------------

                            const currentPasswordField =
                                document.getElementById(
                                    'current-password'
                                );


                            if (currentPasswordField) {

                                currentPasswordField.value =
                                    password;

                            }


                            console.log(
                                '[LOGIN] Temporary password placed in current password field'
                            );


                            // -------------------------------------------------
                            // STOP HERE
                            // DO NOT REDIRECT
                            // -------------------------------------------------

                            return;

                        }


                        // =================================================
                        // NORMAL LOGIN
                        // =================================================

                        console.log(
                            '[LOGIN] Normal login'
                        );


                        window.location.href =
                            getDashboardURL(
                                role
                            );

                    } catch (error) {

                        console.error(
                            '[LOGIN] ERROR:',
                            error
                        );


                        showError(
                            error.message ||
                            'Login failed. Please try again.'
                        );


                        if (passwordElement) {

                            passwordElement.value =
                                '';

                        }

                    }

                }
            );

        }


        // =====================================================
        // CHANGE PASSWORD
        // =====================================================

        if (changePasswordForm) {

            changePasswordForm.addEventListener(
                'submit',
                async function (e) {

                    e.preventDefault();


                    console.log(
                        '[CHANGE PASSWORD] Form submitted'
                    );


                    // =================================================
                    // GET VALUES
                    // =================================================

                    const currentPassword =
                        document
                            .getElementById(
                                'current-password'
                            )
                            ?.value || '';


                    const newPassword =
                        document
                            .getElementById(
                                'new-password'
                            )
                            ?.value || '';


                    const confirmNewPassword =
                        document
                            .getElementById(
                                'confirm-new-password'
                            )
                            ?.value || '';


                    // =================================================
                    // VALIDATION
                    // =================================================

                    if (
                        !currentPassword ||
                        !newPassword ||
                        !confirmNewPassword
                    ) {

                        showError(
                            'Please fill in all password fields',
                            'change-password-message'
                        );

                        return;

                    }


                    if (
                        newPassword.length < 6
                    ) {

                        showError(
                            'New password must be at least 6 characters',
                            'change-password-message'
                        );

                        return;

                    }


                    if (
                        newPassword !==
                        confirmNewPassword
                    ) {

                        showError(
                            'New passwords do not match',
                            'change-password-message'
                        );

                        return;

                    }


                    if (
                        currentPassword ===
                        newPassword
                    ) {

                        showError(
                            'New password must be different from the temporary password',
                            'change-password-message'
                        );

                        return;

                    }


                    // =================================================
                    // GET TOKEN
                    // =================================================

                    const token =
                        localStorage.getItem(
                            'token'
                        );


                    if (!token) {

                        showError(
                            'Your login session has expired. Please login again.',
                            'change-password-message'
                        );

                        return;

                    }


                    // =================================================
                    // CHANGE BUTTON
                    // =================================================

                    const changeButton =
                        document.getElementById(
                            'change-password-btn'
                        );


                    try {

                        if (changeButton) {

                            changeButton.disabled =
                                true;

                            changeButton.textContent =
                                'Changing...';

                        }


                        console.log(
                            '[CHANGE PASSWORD] Sending request'
                        );


                        // =================================================
                        // CHANGE PASSWORD REQUEST
                        // =================================================

                        const response =
                            await fetch(
                                `${API_CONFIG.AUTH_URL}/change-password`,
                                {
                                    method: 'POST',

                                    headers: {

                                        'Content-Type':
                                            'application/json',

                                        'Authorization':
                                            `Bearer ${token}`

                                    },

                                    body:
                                        JSON.stringify({
                                            currentPassword,
                                            newPassword
                                        })
                                }
                            );


                        // =================================================
                        // READ RESPONSE
                        // =================================================

                        let data = {};

                        try {

                            data =
                                await response.json();

                        } catch (jsonError) {

                            console.warn(
                                '[CHANGE PASSWORD] Response was not JSON'
                            );

                        }


                        console.log(
                            '[CHANGE PASSWORD] Server response:',
                            data
                        );


                        // =================================================
                        // CHECK RESPONSE
                        // =================================================

                        if (!response.ok) {

                            throw new Error(
                                data.message ||
                                data.msg ||
                                'Failed to change password'
                            );

                        }


                        // =================================================
                        // SUCCESS
                        // =================================================

                        showSuccess(
                            data.message ||
                            'Password changed successfully.',
                            'change-password-message'
                        );


                        console.log(
                            '[CHANGE PASSWORD] Password changed successfully'
                        );


                        // =================================================
                        // UPDATE LOCAL USER
                        // =================================================

                        const storedUser =
                            localStorage.getItem(
                                'user'
                            );


                        let user = null;


                        if (storedUser) {

                            try {

                                user =
                                    JSON.parse(
                                        storedUser
                                    );


                                user.mustChangePassword =
                                    false;


                                localStorage.setItem(
                                    'user',
                                    JSON.stringify(
                                        user
                                    )
                                );


                            } catch (parseError) {

                                console.warn(
                                    '[CHANGE PASSWORD] Could not update local user',
                                    parseError
                                );

                            }

                        }


                        // =================================================
                        // GET ROLE
                        // =================================================

                        const dashboardRole =
                            user?.role ||
                            data.role ||
                            'student';


                        // =================================================
                        // REDIRECT
                        // =================================================

                        setTimeout(
                            function () {

                                window.location.href =
                                    getDashboardURL(
                                        dashboardRole
                                    );

                            },
                            1200
                        );


                    } catch (error) {

                        console.error(
                            '[CHANGE PASSWORD] ERROR:',
                            error
                        );


                        showError(
                            error.message ||
                            'Failed to change password. Please try again.',
                            'change-password-message'
                        );


                        if (changeButton) {

                            changeButton.disabled =
                                false;

                            changeButton.textContent =
                                'Change Password';

                        }

                    }

                }
            );

        } else {

            console.error(
                '[LOGIN] change-password-form NOT FOUND'
            );

        }


        // =====================================================
        // SHOW REGISTER
        // =====================================================

        if (showRegisterLink) {

            showRegisterLink.addEventListener(
                'click',
                function (e) {

                    e.preventDefault();


                    showRegisterForm();


                    const error =
                        document.getElementById(
                            'error-message'
                        );


                    if (error) {

                        error.textContent =
                            '';

                        error.style.display =
                            'none';

                    }

                }
            );

        }


        // =====================================================
        // BACK TO LOGIN
        // =====================================================

        if (showLoginButton) {

            showLoginButton.addEventListener(
                'click',
                function (e) {

                    e.preventDefault();


                    showLoginForm();


                    const message =
                        document.getElementById(
                            'register-message'
                        );


                    if (message) {

                        message.textContent =
                            '';

                        message.style.display =
                            'none';

                    }

                }
            );

        }


        // =====================================================
        // ROLE SELECT
        // =====================================================

        if (
            roleSelect &&
            classGroup
        ) {

            roleSelect.addEventListener(
                'change',
                function () {

                    const classInput =
                        document.getElementById(
                            'class'
                        );


                    if (
                        this.value ===
                        'student'
                    ) {

                        classGroup.style.display =
                            'block';


                        if (classInput) {

                            classInput.setAttribute(
                                'required',
                                'required'
                            );

                        }

                    } else {

                        classGroup.style.display =
                            'none';


                        if (classInput) {

                            classInput.removeAttribute(
                                'required'
                            );

                            classInput.value =
                                '';

                        }

                    }

                }
            );

        }


        // =====================================================
        // REGISTER
        // =====================================================

        if (registerForm) {

            registerForm.addEventListener(
                'submit',
                async function (e) {

                    e.preventDefault();


                    const name =
                        document
                            .getElementById(
                                'register-name'
                            )
                            ?.value
                            ?.trim();


                    const email =
                        document
                            .getElementById(
                                'register-email'
                            )
                            ?.value
                            ?.trim();


                    const password =
                        document
                            .getElementById(
                                'register-password'
                            )
                            ?.value;


                    const confirmPassword =
                        document
                            .getElementById(
                                'confirm-password'
                            )
                            ?.value;


                    const role =
                        document
                            .getElementById(
                                'role'
                            )
                            ?.value;


                    /*
                     * IMPORTANT:
                     *
                     * Your current login.html does NOT contain
                     * register-school-code.
                     *
                     * Therefore we use the login school code.
                     */

                    const schoolCode =
                        document
                            .getElementById(
                                'school-code'
                            )
                            ?.value
                            ?.trim();


                    const studentClass =
                        role === 'student'
                            ? document
                                .getElementById(
                                    'class'
                                )
                                ?.value
                            : '';


                    // =================================================
                    // VALIDATION
                    // =================================================

                    if (!name) {

                        showError(
                            'Please enter your name',
                            'register-message'
                        );

                        return;

                    }


                    if (!email) {

                        showError(
                            'Please enter your email',
                            'register-message'
                        );

                        return;

                    }


                    if (!schoolCode) {

                        showError(
                            'Please enter the school code in the Login section first.',
                            'register-message'
                        );

                        return;

                    }


                    if (!password) {

                        showError(
                            'Please enter a password',
                            'register-message'
                        );

                        return;

                    }


                    if (
                        password.length < 6
                    ) {

                        showError(
                            'Password must be at least 6 characters',
                            'register-message'
                        );

                        return;

                    }


                    if (
                        password !==
                        confirmPassword
                    ) {

                        showError(
                            'Passwords do not match',
                            'register-message'
                        );

                        return;

                    }


                    if (!role) {

                        showError(
                            'Please select a role',
                            'register-message'
                        );

                        return;

                    }


                    if (
                        role === 'student' &&
                        !studentClass
                    ) {

                        showError(
                            'Please select a class',
                            'register-message'
                        );

                        return;

                    }


                    // =================================================
                    // REGISTER REQUEST
                    // =================================================

                    try {

                        const response =
                            await apiFetch(
                                `${API_CONFIG.AUTH_URL}/register`,
                                {
                                    method: 'POST',

                                    body:
                                        JSON.stringify({
                                            name,
                                            email,
                                            password,
                                            role,
                                            schoolCode,

                                            class:
                                                role === 'student'
                                                    ? studentClass
                                                    : undefined
                                        })
                                }
                            );


                        console.log(
                            '[REGISTER] RESPONSE:',
                            response
                        );


                        showSuccess(
                            'Registration successful! Please login.',
                            'register-message'
                        );


                        registerForm.reset();


                        setTimeout(
                            function () {

                                showLoginForm();

                            },
                            1500
                        );


                    } catch (error) {

                        console.error(
                            '[REGISTER] ERROR:',
                            error
                        );


                        showError(
                            error.message ||
                            'Registration failed. Please try again.',
                            'register-message'
                        );

                    }

                }
            );

        }

    }
);

