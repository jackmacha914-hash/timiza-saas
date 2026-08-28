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

    if (!element) return;

    element.textContent =
        message;

    element.style.display =
        'block';

    element.style.color =
        'red';
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

    if (!element) return;

    element.textContent =
        message;

    element.style.display =
        'block';

    element.style.color =
        'green';
}



/* =====================================================
HIDE ALL AUTH SCREENS
===================================================== */

function hideAllForms() {

```
const loginForm =
    document.getElementById('login-form');

const registerForm =
    document.getElementById('register-form');

const changePasswordContainer =
    document.getElementById(
        'change-password-container'
    );


// Hide Login
if (loginForm) {
    loginForm.style.display = 'none';
}


// Hide Register
if (registerForm) {
    registerForm.style.display = 'none';
}


// Hide CHANGE PASSWORD CONTAINER
if (changePasswordContainer) {
    changePasswordContainer.style.display = 'none';
}
```

}

/* =====================================================
SHOW LOGIN
===================================================== */

function showLoginForm() {

```
hideAllForms();


const loginForm =
    document.getElementById('login-form');

const formTitle =
    document.getElementById('form-title');


if (loginForm) {
    loginForm.style.display = 'block';
}


if (formTitle) {
    formTitle.style.display = 'block';
    formTitle.textContent = 'Login';
}
```

}

/* =====================================================
SHOW REGISTER
===================================================== */

function showRegisterForm() {

```
hideAllForms();


const registerForm =
    document.getElementById('register-form');

const formTitle =
    document.getElementById('form-title');


if (registerForm) {
    registerForm.style.display = 'block';
}


if (formTitle) {
    formTitle.style.display = 'block';
    formTitle.textContent = 'Create Account';
}
```

}

/* =====================================================
SHOW CHANGE PASSWORD
===================================================== */

function showChangePasswordForm() {

```
console.log(
    '[LOGIN] SHOWING CHANGE PASSWORD SCREEN'
);


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


/* ---------------------------------------------
   Make sure container exists
--------------------------------------------- */

if (!changePasswordContainer) {

    console.error(
        '[LOGIN] ERROR: change-password-container NOT FOUND'
    );

    alert(
        'Change Password container is missing from login.html'
    );

    return;

}


/* ---------------------------------------------
   SHOW PARENT CONTAINER
--------------------------------------------- */

changePasswordContainer.style.display =
    'block';


changePasswordContainer.style.visibility =
    'visible';


changePasswordContainer.style.opacity =
    '1';


/* ---------------------------------------------
   SHOW FORM
--------------------------------------------- */

if (changePasswordForm) {

    changePasswordForm.style.display =
        'block';

}


/* ---------------------------------------------
   Hide main page title
--------------------------------------------- */

if (formTitle) {

    formTitle.style.display =
        'none';

}


/* ---------------------------------------------
   Clear old message
--------------------------------------------- */

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


/* ---------------------------------------------
   Focus temporary password
--------------------------------------------- */

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
    '[LOGIN] Change Password UI displayed'
);
```

}




// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

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
        // LOGIN
        // =================================================

        if (loginForm) {

            loginForm.addEventListener(
                'submit',
                async (e) => {

                    e.preventDefault();


                    const email =
                        document
                            .getElementById(
                                'login-email'
                            )
                            ?.value
                            ?.trim();


                    const password =
                        document
                            .getElementById(
                                'login-password'
                            )
                            ?.value;


                    const schoolCode =
                        document
                            .getElementById(
                                'school-code'
                            )
                            ?.value
                            ?.trim();


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



                        // =================================
                        // SAVE TOKEN
                        // =================================

                        if (!response?.token) {

                            showError(
                                'No authentication token received'
                            );

                            return;

                        }


                        localStorage.setItem(
                            'token',
                            response.token
                        );



                        // =================================
                        // SAVE USER
                        // =================================

                        if (response.user) {

                            localStorage.setItem(
                                'user',
                                JSON.stringify(
                                    response.user
                                )
                            );

                        }



                        const role =
                            response.user?.role ||
                            response.role ||
                            'student';



                        /* ================================================
TEMPORARY PASSWORD DETECTED
================================================ */

const mustChangePassword =
response?.mustChangePassword === true ||
response?.user?.mustChangePassword === true;

console.log(
'[LOGIN] mustChangePassword:',
mustChangePassword
);

if (mustChangePassword) {

```
console.log(
    '[LOGIN] Temporary password detected'
);

console.log(
    '[LOGIN] User must change password'
);


/*
 * IMPORTANT:
 *
 * Do NOT redirect to the dashboard.
 *
 * Show the CHANGE PASSWORD CONTAINER.
 */

showChangePasswordForm();


/*
 * Clear login password field.
 */

const loginPasswordField =
    document.getElementById(
        'login-password'
    );


if (loginPasswordField) {

    loginPasswordField.value = '';

}


/*
 * Automatically put the temporary password
 * into the current-password field.
 */

const currentPasswordField =
    document.getElementById(
        'current-password'
    );


if (currentPasswordField) {

    currentPasswordField.value =
        password;

}


return;
```

}


                        // =================================
                        // NORMAL LOGIN
                        // =================================

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


                        const passwordField =
                            document.getElementById(
                                'login-password'
                            );


                        if (passwordField) {

                            passwordField.value =
                                '';

                        }

                    }

                }
            );

        }



        // =================================================
        // CHANGE PASSWORD
        // =================================================

        if (changePasswordForm) {

            changePasswordForm.addEventListener(
                'submit',
                async (e) => {

                    e.preventDefault();


                    const currentPassword =
                        document
                            .getElementById(
                                'current-password'
                            )
                            ?.value;


                    const newPassword =
                        document
                            .getElementById(
                                'new-password'
                            )
                            ?.value;


                    const confirmNewPassword =
                        document
                            .getElementById(
                                'confirm-new-password'
                            )
                            ?.value;



                    // =================================
                    // VALIDATION
                    // =================================

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



                    // =================================
                    // GET TOKEN
                    // =================================

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



                    try {

                        const changeButton =
                            document.getElementById(
                                'change-password-btn'
                            );


                        if (changeButton) {

                            changeButton.disabled =
                                true;

                            changeButton.innerHTML =
                                '<i class="fas fa-spinner fa-spin"></i> Changing...';

                        }



                        // =================================
                        // CHANGE PASSWORD REQUEST
                        // =================================

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



                        const data =
                            await response.json();



                        console.log(
                            '[CHANGE PASSWORD] RESPONSE:',
                            data
                        );



                        if (!response.ok) {

                            throw new Error(
                                data.message ||
                                data.msg ||
                                'Failed to change password'
                            );

                        }



                        // =================================
                        // SUCCESS
                        // =================================

                        showSuccess(
                            data.message ||
                            'Password changed successfully.',
                            'change-password-message'
                        );



                        // =================================
                        // UPDATE LOCAL USER
                        // =================================

                        const storedUser =
                            localStorage.getItem(
                                'user'
                            );


                        if (storedUser) {

                            try {

                                const user =
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

                            } catch (error) {

                                console.warn(
                                    'Could not update local user:',
                                    error
                                );

                            }

                        }



                        // =================================
                        // GET ROLE
                        // =================================

                        const user =
                            storedUser
                                ? JSON.parse(
                                    storedUser
                                )
                                : null;


                        const role =
                            user?.role ||
                            response.role ||
                            'student';



                        // =================================
                        // GO TO DASHBOARD
                        // =================================

                        setTimeout(
                            () => {

                                window.location.href =
                                    getDashboardURL(
                                        role
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


                        const changeButton =
                            document.getElementById(
                                'change-password-btn'
                            );


                        if (changeButton) {

                            changeButton.disabled =
                                false;

                            changeButton.innerHTML =
                                '<i class="fas fa-key"></i> Change Password';

                        }

                    }

                }
            );

        }



        // =================================================
        // SHOW REGISTER
        // =================================================

        if (showRegisterLink) {

            showRegisterLink.addEventListener(
                'click',
                (e) => {

                    e.preventDefault();

                    showRegisterForm();

                    const error =
                        document.getElementById(
                            'error-message'
                        );


                    if (error) {

                        error.textContent =
                            '';

                    }

                }
            );

        }



        // =================================================
        // BACK TO LOGIN
        // =================================================

        if (showLoginButton) {

            showLoginButton.addEventListener(
                'click',
                (e) => {

                    e.preventDefault();

                    showLoginForm();


                    const message =
                        document.getElementById(
                            'register-message'
                        );


                    if (message) {

                        message.textContent =
                            '';

                    }

                }
            );

        }



        // =================================================
        // ROLE SELECT
        // =================================================

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



        // =================================================
        // REGISTER
        // =================================================

        if (registerForm) {

            registerForm.addEventListener(
                'submit',
                async (e) => {

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


                    const schoolCode =
                        document
                            .getElementById(
                                'register-school-code'
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
                            'Please enter school code',
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
                            () => {

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
