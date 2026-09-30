document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // LOGIN
    // =====================================================

    const loginForm =
        document.getElementById("login-form");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                const email =
                    document.getElementById(
                        "login-email"
                    ).value.trim();


                const password =
                    document.getElementById(
                        "login-password"
                    ).value;


                // -------------------------------------------------
                // SCHOOL CODE
                // -------------------------------------------------
                //
                // IMPORTANT:
                // Your backend requires schoolCode.
                //
                // This looks for an input with:
                //
                // id="login-school-code"
                //
                // If your school-code input has a different ID,
                // tell me that ID and I will adjust it.
                // -------------------------------------------------

                const schoolCodeElement =
                    document.getElementById(
                        "login-school-code"
                    );


                const schoolCode =
                    schoolCodeElement
                        ? schoolCodeElement.value.trim()
                        : "";


                const errorElement =
                    document.getElementById(
                        "login-error-message"
                    );


                // -------------------------------------------------
                // VALIDATION
                // -------------------------------------------------

                if (!email) {

                    if (errorElement) {
                        errorElement.innerText =
                            "Email is required.";
                    }

                    return;
                }


                if (!password) {

                    if (errorElement) {
                        errorElement.innerText =
                            "Password is required.";
                    }

                    return;
                }


                if (!schoolCode) {

                    if (errorElement) {
                        errorElement.innerText =
                            "School code is required.";
                    }

                    return;
                }


                // Clear previous error

                if (errorElement) {
                    errorElement.innerText = "";
                }


                try {

                    // -------------------------------------------------
                    // LOGIN REQUEST
                    // -------------------------------------------------

                    const response =
                        await fetch(
                            "http://localhost:5000/api/auth/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        email,
                                        password,
                                        schoolCode
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        "[LOGIN] Response:",
                        data
                    );


                    // -------------------------------------------------
                    // LOGIN FAILED
                    // -------------------------------------------------

                    if (!response.ok) {

                        if (errorElement) {

                            errorElement.innerText =
                                data.msg ||
                                data.message ||
                                "Login failed!";

                        }

                        return;
                    }


                    // -------------------------------------------------
                    // SAVE TOKEN
                    // -------------------------------------------------

                    localStorage.setItem(
                        "token",
                        data.token
                    );


                    // -------------------------------------------------
                    // SAVE USER INFORMATION
                    // -------------------------------------------------

                    if (data.user) {

                        localStorage.setItem(
                            "user",
                            JSON.stringify(data.user)
                        );

                    }


                    // -------------------------------------------------
                    // CHECK FOR TEMPORARY PASSWORD
                    // -------------------------------------------------
                    //
                    // Your backend sends:
                    //
                    // mustChangePassword: true
                    //
                    // when an administrator has reset the user's
                    // password.
                    // -------------------------------------------------

                    const mustChangePassword =
                        data.mustChangePassword === true ||
                        data.user?.mustChangePassword === true;


                    console.log(
                        "[LOGIN] Must change password:",
                        mustChangePassword
                    );


                    // -------------------------------------------------
                    // FORCE PASSWORD CHANGE
                    // -------------------------------------------------

                    if (mustChangePassword) {

                        alert(
                            "You are using a temporary password. " +
                            "Please change your password before continuing."
                        );


                        // Go to password-change page

                        window.location.href =
                            "change-password.html";


                        return;
                    }


                    // -------------------------------------------------
                    // NORMAL LOGIN
                    // -------------------------------------------------

                    alert(
                        "Login successful!"
                    );


                    window.location.href =
                        "dashboard.html";

                } catch (error) {

                    console.error(
                        "[LOGIN] Error:",
                        error
                    );


                    if (errorElement) {

                        errorElement.innerText =
                            "Something went wrong. Please try again.";

                    }

                }

            }
        );

    }


    // =====================================================
    // REGISTER
    // =====================================================

    const registerForm =
        document.getElementById(
            "register-form"
        );


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                const name =
                    document.getElementById(
                        "register-name"
                    ).value.trim();


                const email =
                    document.getElementById(
                        "register-email"
                    ).value.trim();


                const password =
                    document.getElementById(
                        "register-password"
                    ).value;


                const role =
                    document.getElementById(
                        "register-role"
                    ).value;


                const errorElement =
                    document.getElementById(
                        "register-error-message"
                    );


                try {

                    const response =
                        await fetch(
                            "http://localhost:5000/api/auth/register",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        name,
                                        email,
                                        password,
                                        role
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (response.ok) {

                        alert(
                            "Registration successful! You can now login."
                        );


                        toggleForms();

                    } else {

                        if (errorElement) {

                            errorElement.innerText =
                                data.errors
                                    ? data.errors[0].msg
                                    : data.msg ||
                                      data.message ||
                                      "Registration failed!";

                        }

                    }

                } catch (error) {

                    console.error(
                        "Registration Error:",
                        error
                    );


                    if (errorElement) {

                        errorElement.innerText =
                            "Something went wrong!";

                    }

                }

            }
        );

    }

});


// =====================================================
// TOGGLE LOGIN / REGISTER
// =====================================================

function toggleForms() {

    const loginContainer =
        document.getElementById(
            "login-container"
        );


    const registerContainer =
        document.getElementById(
            "register-container"
        );


    if (
        !loginContainer ||
        !registerContainer
    ) {
        return;
    }


    loginContainer.style.display =
        loginContainer.style.display === "none"
            ? "block"
            : "none";


    registerContainer.style.display =
        registerContainer.style.display === "none"
            ? "block"
            : "none";

}

