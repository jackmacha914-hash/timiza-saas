// =====================================================
// CHANGE PASSWORD PAGE
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const form =
            document.getElementById(
                'change-password-form'
            );

        const message =
            document.getElementById(
                'change-password-message'
            );

        const button =
            document.getElementById(
                'change-password-btn'
            );


        // =================================================
        // CHECK LOGIN TOKEN
        // =================================================

        const token =
            localStorage.getItem('token');


        if (!token) {

            window.location.href =
                '/login.html';

            return;
        }


        // =================================================
        // SHOW MESSAGE
        // =================================================

        function showMessage(
            text,
            type = 'error'
        ) {

            if (!message) return;

            message.textContent =
                text;

            message.style.display =
                'block';

            if (type === 'success') {

                message.style.color =
                    'green';

            } else {

                message.style.color =
                    'red';

            }

        }


        // =================================================
        // SUBMIT
        // =================================================

        form.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();


                const currentPassword =
                    document
                        .getElementById(
                            'current-password'
                        )
                        .value
                        .trim();


                const newPassword =
                    document
                        .getElementById(
                            'new-password'
                        )
                        .value;


                const confirmPassword =
                    document
                        .getElementById(
                            'confirm-password'
                        )
                        .value;


                // =================================================
                // VALIDATION
                // =================================================

                if (
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                ) {

                    showMessage(
                        'Please fill in all password fields.'
                    );

                    return;
                }


                if (
                    newPassword.length < 6
                ) {

                    showMessage(
                        'New password must be at least 6 characters.'
                    );

                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    showMessage(
                        'New passwords do not match.'
                    );

                    return;
                }


                if (
                    currentPassword ===
                    newPassword
                ) {

                    showMessage(
                        'Your new password must be different from your temporary password.'
                    );

                    return;
                }


                // =================================================
                // DISABLE BUTTON
                // =================================================

                button.disabled =
                    true;

                button.textContent =
                    'Changing Password...';


                try {

                    // =================================================
                    // API REQUEST
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
                                        newPassword,
                                        confirmPassword
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        '[CHANGE PASSWORD] Response:',
                        data
                    );


                    // =================================================
                    // ERROR
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

                    showMessage(
                        'Password changed successfully. Redirecting...',
                        'success'
                    );


                    // Update stored user
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

                        } catch (err) {

                            console.warn(
                                '[CHANGE PASSWORD] Could not update stored user:',
                                err
                            );

                        }

                    }


                    // =================================================
                    // GET USER ROLE
                    // =================================================

                    let role =
                        'student';


                    try {

                        const user =
                            JSON.parse(
                                localStorage.getItem(
                                    'user'
                                )
                            );

                        role =
                            user?.role ||
                            'student';

                    } catch (err) {

                        console.warn(
                            '[CHANGE PASSWORD] Could not read user role'
                        );

                    }


                    // =================================================
                    // REDIRECT
                    // =================================================

                    setTimeout(
                        () => {

                            switch (role) {

                                case 'superadmin':

                                    window.location.href =
                                        '/superadmin.html';

                                    break;


                                case 'admin':

                                    window.location.href =
                                        '/index.html';

                                    break;


                                case 'teacher':

                                    window.location.href =
                                        '/teacher.html';

                                    break;


                                case 'student':

                                    window.location.href =
                                        '/student.html';

                                    break;


                                default:

                                    window.location.href =
                                        '/login.html';

                            }

                        },
                        1200
                    );


                } catch (error) {

                    console.error(
                        '[CHANGE PASSWORD] Error:',
                        error
                    );


                    showMessage(
                        error.message ||
                        'Failed to change password. Please try again.'
                    );


                    button.disabled =
                        false;

                    button.textContent =
                        'Change Password';

                }

            }
        );

    }
);
