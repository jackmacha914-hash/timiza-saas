const API =
    "https://timiza-saas.onrender.com/api";


// =====================================================
// GET SUPERADMIN TOKEN
// =====================================================

function getToken() {

    return localStorage.getItem("token");

}


// =====================================================
// AUTH HEADERS
// =====================================================

function getAuthHeaders() {

    const token =
        getToken();

    return {

        "Content-Type":
            "application/json",

        "Authorization":
            "Bearer " + token

    };

}


// =====================================================
// CHECK TOKEN
// =====================================================

function checkAuthentication() {

    const token =
        getToken();

    if (!token) {

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "/login.html";

        return false;

    }

    return true;

}


// =====================================================
// CREATE SCHOOL BUTTON
// =====================================================

const createSchoolBtn =
    document.getElementById(
        "createSchoolBtn"
    );


if (createSchoolBtn) {

    createSchoolBtn.addEventListener(
        "click",
        createSchool
    );

}


// =====================================================
// LOAD SCHOOLS
// =====================================================

loadSchools();


// =====================================================
// CREATE SCHOOL
// =====================================================

async function createSchool() {

    if (!checkAuthentication()) {
        return;
    }


    const schoolName =
        document
            .getElementById("schoolName")
            .value
            .trim();


    const adminName =
        document
            .getElementById("adminName")
            .value
            .trim();


    const adminEmail =
        document
            .getElementById("adminEmail")
            .value
            .trim();


    const adminPassword =
        document
            .getElementById("adminPassword")
            .value
            .trim();


    if (
        !schoolName ||
        !adminName ||
        !adminEmail ||
        !adminPassword
    ) {

        alert(
            "Please fill in all fields."
        );

        return;

    }


    if (
        adminPassword.length < 6
    ) {

        alert(
            "Temporary password must be at least 6 characters."
        );

        return;

    }


    try {

        const response =
            await fetch(
                API +
                "/superadmin/create-school",
                {

                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            schoolName:
                                schoolName,

                            adminName:
                                adminName,

                            adminEmail:
                                adminEmail,

                            adminPassword:
                                adminPassword

                        })

                }
            );


        if (
            response.status === 401
        ) {

            alert(
                "Your Superadmin session has expired. Please login again."
            );

            window.location.href =
                "/login.html";

            return;

        }


        if (
            response.status === 403
        ) {

            alert(
                "Only the Superadmin can create schools."
            );

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.msg ||
                "Failed to create school."
            );

        }


        if (data.success) {

            alert(

                "SCHOOL CREATED SUCCESSFULLY\n\n" +

                "School: " +
                data.school.name +
                "\n\n" +

                "School Code: " +
                data.school.code +
                "\n\n" +

                "Admin Name: " +
                data.admin.name +
                "\n\n" +

                "Admin Email: " +
                data.admin.email +
                "\n\n" +

                "Temporary Password:\n" +
                adminPassword +
                "\n\n" +

                "The school admin must change this password after login."

            );


            document
                .getElementById("schoolName")
                .value = "";


            document
                .getElementById("adminName")
                .value = "";


            document
                .getElementById("adminEmail")
                .value = "";


            document
                .getElementById("adminPassword")
                .value = "";


            loadSchools();

        }


    } catch (error) {

        console.error(
            "[SUPERADMIN] CREATE SCHOOL ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to create school."
        );

    }

}


// =====================================================
// LOAD SCHOOLS
// =====================================================

async function loadSchools() {

    if (!checkAuthentication()) {
        return;
    }


    try {

        const response =
            await fetch(
                API +
                "/superadmin/schools",
                {

                    method:
                        "GET",

                    headers:
                        getAuthHeaders()

                }
            );


        if (
            response.status === 401
        ) {

            alert(
                "Your Superadmin session has expired. Please login again."
            );

            window.location.href =
                "/login.html";

            return;

        }


        if (
            response.status === 403
        ) {

            alert(
                "Only the Superadmin can access schools."
            );

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load schools."
            );

        }


        const schools =
            Array.isArray(data)
                ? data
                : data.schools || [];


        const tbody =
            document.querySelector(
                "#schoolsTable tbody"
            );


        if (!tbody) {

            console.error(
                "schoolsTable tbody not found"
            );

            return;

        }


        tbody.innerHTML = "";


        if (
            schools.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="text-align:center;"
                    >
                        No schools found.
                    </td>

                </tr>

            `;

            return;

        }


        schools.forEach(
            school => {

                const subscription =
                    school.subscription || {};


                const admin =
                    school.admin || null;


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            school.name
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            school.code
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            subscription.plan ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            subscription.status ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${
                            subscription.endDate
                                ? new Date(
                                    subscription.endDate
                                  ).toLocaleDateString()
                                : "-"
                        }
                    </td>


                    <td>
                        ${
                            school.createdAt
                                ? new Date(
                                    school.createdAt
                                  ).toLocaleDateString()
                                : "-"
                        }
                    </td>


                    <td>

                        ${
                            school.active
                                ? "🟢 Active"
                                : "🔴 Suspended"
                        }

                    </td>


                    <td>

                        ${
                            admin
                                ? `
                                    <strong>
                                        ${escapeHtml(
                                            admin.name
                                        )}
                                    </strong>

                                    <br>

                                    <small>
                                        ${escapeHtml(
                                            admin.email
                                        )}
                                    </small>
                                  `
                                : `
                                    <span>
                                        No admin found
                                    </span>
                                  `
                        }

                    </td>


                    <td>

                        ${
                            admin
                                ? `
                                    <button
                                        type="button"
                                        onclick="resetSchoolAdminPassword(
                                            '${escapeJs(school._id)}',
                                            '${escapeJs(admin._id)}',
                                            '${escapeJs(admin.name)}',
                                            '${escapeJs(admin.email)}'
                                        )"
                                    >
                                        🔐 Reset Password
                                    </button>
                                  `
                                : ""
                        }


                        <button
                            type="button"
                            onclick="viewSchool(
                                '${escapeJs(school._id)}'
                            )"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            onclick="toggleSchool(
                                '${escapeJs(school._id)}'
                            )"
                        >

                            ${
                                school.active
                                    ? "Suspend"
                                    : "Activate"
                            }

                        </button>

                    </td>

                `;


                tbody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "[SUPERADMIN] LOAD SCHOOLS ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to load schools."
        );

    }

}

// =====================================================
// RESET SCHOOL ADMIN PASSWORD MODAL
// =====================================================

async function resetSchoolAdminPassword(
    schoolId,
    adminId,
    adminName,
    adminEmail
) {

    if (!checkAuthentication()) {
        return;
    }


    // -------------------------------------------------
    // REMOVE OLD MODAL IF IT EXISTS
    // -------------------------------------------------

    const oldModal =
        document.getElementById(
            "resetPasswordModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


    // -------------------------------------------------
    // CREATE MODAL
    // -------------------------------------------------

    const modal =
        document.createElement("div");

    modal.id =
        "resetPasswordModal";

    modal.innerHTML = `

        <div class="reset-modal-overlay">

            <div class="reset-modal-box">

                <div class="reset-modal-header">

                    <div>

                        <h2>
                            🔐 Reset Admin Password
                        </h2>

                        <p>
                            Create a temporary password
                            for this school administrator.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="reset-modal-close"
                        id="closeResetPasswordModal"
                    >
                        ×
                    </button>

                </div>


                <div class="reset-admin-info">

                    <div>

                        <span>
                            School Admin
                        </span>

                        <strong>
                            ${escapeHtml(adminName)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Email
                        </span>

                        <strong>
                            ${escapeHtml(adminEmail)}
                        </strong>

                    </div>

                </div>


                <form
                    id="resetPasswordForm"
                >

                    <div class="reset-form-group">

                        <label
                            for="newTemporaryPassword"
                        >
                            Temporary Password
                        </label>


                        <input
                            type="text"
                            id="newTemporaryPassword"
                            name="newTemporaryPassword"
                            minlength="6"
                            autocomplete="off"
                            placeholder="Enter temporary password"
                            required
                        />


                        <small>
                            Minimum 6 characters.
                            The admin will be required
                            to change it after login.
                        </small>

                    </div>


                    <div
                        id="resetPasswordError"
                        class="reset-password-error"
                        style="display:none;"
                    ></div>


                    <div class="reset-modal-actions">

                        <button
                            type="button"
                            id="cancelResetPassword"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            id="confirmResetPassword"
                        >
                            🔐 Reset Password
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // -------------------------------------------------
    // MODAL ELEMENTS
    // -------------------------------------------------

    const closeButton =
        document.getElementById(
            "closeResetPasswordModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelResetPassword"
        );


    const form =
        document.getElementById(
            "resetPasswordForm"
        );


    const passwordInput =
        document.getElementById(
            "newTemporaryPassword"
        );


    const errorBox =
        document.getElementById(
            "resetPasswordError"
        );


    const resetButton =
        document.getElementById(
            "confirmResetPassword"
        );


    // -------------------------------------------------
    // CLOSE MODAL
    // -------------------------------------------------

    function closeModal() {

        const currentModal =
            document.getElementById(
                "resetPasswordModal"
            );

        if (currentModal) {

            currentModal.remove();

        }

    }


    closeButton.addEventListener(
        "click",
        closeModal
    );


    cancelButton.addEventListener(
        "click",
        closeModal
    );


    // -------------------------------------------------
    // CLOSE WHEN CLICKING OUTSIDE
    // -------------------------------------------------

    const overlay =
        modal.querySelector(
            ".reset-modal-overlay"
        );


    overlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target === overlay
            ) {

                closeModal();

            }

        }
    );


    // -------------------------------------------------
    // FOCUS PASSWORD
    // -------------------------------------------------

    setTimeout(
        function() {

            passwordInput.focus();

        },
        100
    );


    // -------------------------------------------------
    // SUBMIT RESET
    // -------------------------------------------------

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const newPassword =
                passwordInput.value.trim();


            // -----------------------------------------
            // VALIDATE
            // -----------------------------------------

            if (
                !newPassword
            ) {

                errorBox.textContent =
                    "Please enter a temporary password.";

                errorBox.style.display =
                    "block";

                passwordInput.focus();

                return;

            }


            if (
                newPassword.length < 6
            ) {

                errorBox.textContent =
                    "Temporary password must be at least 6 characters.";

                errorBox.style.display =
                    "block";

                passwordInput.focus();

                return;

            }


            // -----------------------------------------
            // DISABLE BUTTON
            // -----------------------------------------

            resetButton.disabled =
                true;

            resetButton.textContent =
                "Resetting...";


            errorBox.style.display =
                "none";


            try {

                // -------------------------------------
                // SEND TO BACKEND
                // -------------------------------------

                const response =
                    await fetch(

                        API +
                        "/superadmin/schools/" +
                        encodeURIComponent(
                            schoolId
                        ) +
                        "/admin/" +
                        encodeURIComponent(
                            adminId
                        ) +
                        "/reset-password",

                        {

                            method:
                                "PATCH",

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify({

                                    newPassword:
                                        newPassword

                                })

                        }

                    );


                // -------------------------------------
                // AUTH ERROR
                // -------------------------------------

                if (
                    response.status === 401
                ) {

                    closeModal();

                    alert(
                        "Your Superadmin session has expired. Please login again."
                    );

                    window.location.href =
                        "/login.html";

                    return;

                }


                // -------------------------------------
                // PERMISSION ERROR
                // -------------------------------------

                if (
                    response.status === 403
                ) {

                    errorBox.textContent =
                        "Only the Superadmin can reset school admin passwords.";

                    errorBox.style.display =
                        "block";

                    resetButton.disabled =
                        false;

                    resetButton.textContent =
                        "🔐 Reset Password";

                    return;

                }


                // -------------------------------------
                // READ RESPONSE
                // -------------------------------------

                const data =
                    await response.json();


                // -------------------------------------
                // BACKEND ERROR
                // -------------------------------------

                if (
                    !response.ok
                ) {

                    throw new Error(

                        data.message ||
                        data.msg ||
                        "Failed to reset password."

                    );

                }


                // -------------------------------------
                // SUCCESS
                // -------------------------------------

                if (
                    data.success
                ) {

                    closeModal();


                    showPasswordResetSuccessModal({

                        adminName:
                            data.admin
                                ? data.admin.name
                                : adminName,

                        adminEmail:
                            data.admin
                                ? data.admin.email
                                : adminEmail,

                        temporaryPassword:
                            newPassword

                    });

                }


            } catch (error) {

                console.error(
                    "[SUPERADMIN] RESET PASSWORD ERROR:",
                    error
                );


                errorBox.textContent =
                    error.message ||
                    "Failed to reset password.";


                errorBox.style.display =
                    "block";


                resetButton.disabled =
                    false;


                resetButton.textContent =
                    "🔐 Reset Password";

            }

        }
    );

}


// =====================================================
// PASSWORD RESET SUCCESS MODAL
// =====================================================

function showPasswordResetSuccessModal(
    details
) {

    const oldModal =
        document.getElementById(
            "passwordResetSuccessModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement("div");


    modal.id =
        "passwordResetSuccessModal";


    modal.innerHTML = `

        <div class="reset-modal-overlay">

            <div class="reset-modal-box success-modal">

                <div class="success-icon">
                    ✓
                </div>


                <h2>
                    Password Reset Successful
                </h2>


                <p>
                    A new temporary password has been
                    created for the school administrator.
                </p>


                <div class="temporary-password-box">

                    <span>
                        Temporary Password
                    </span>


                    <strong id="temporaryPasswordValue">
                        ${escapeHtml(
                            details.temporaryPassword
                        )}
                    </strong>

                </div>


                <div class="reset-success-info">

                    <strong>
                        ${escapeHtml(
                            details.adminName
                        )}
                    </strong>


                    <span>
                        ${escapeHtml(
                            details.adminEmail
                        )}
                    </span>

                </div>


                <div class="reset-warning">

                    ⚠️ The school admin must change
                    this password after logging in.

                </div>


                <div class="reset-modal-actions">

                    <button
                        type="button"
                        id="copyTemporaryPassword"
                    >
                        📋 Copy Password
                    </button>


                    <button
                        type="button"
                        id="closeSuccessModal"
                    >
                        Done
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // -------------------------------------------------
    // CLOSE
    // -------------------------------------------------

    document
        .getElementById(
            "closeSuccessModal"
        )
        .addEventListener(
            "click",
            function() {

                modal.remove();

            }
        );


    // -------------------------------------------------
    // COPY PASSWORD
    // -------------------------------------------------

    document
        .getElementById(
            "copyTemporaryPassword"
        )
        .addEventListener(
            "click",
            async function() {

                try {

                    await navigator.clipboard.writeText(
                        details.temporaryPassword
                    );


                    this.textContent =
                        "✓ Copied";


                } catch (error) {

                    console.error(
                        "COPY PASSWORD ERROR:",
                        error
                    );

                    alert(
                        "Unable to copy password. Please copy it manually."
                    );

                }

            }
        );


    // -------------------------------------------------
    // CLOSE OUTSIDE
    // -------------------------------------------------

    const overlay =
        modal.querySelector(
            ".reset-modal-overlay"
        );


    overlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target === overlay
            ) {

                modal.remove();

            }

        }
    );

}


// =====================================================
// TOGGLE SCHOOL
// =====================================================

async function toggleSchool(
    id
) {

    if (!checkAuthentication()) {
        return;
    }


    try {

        const response =
            await fetch(

                API +
                "/superadmin/schools/" +
                encodeURIComponent(
                    id
                ) +
                "/status",

                {

                    method:
                        "PATCH",

                    headers:
                        getAuthHeaders()

                }

            );


        if (
            response.status === 401
        ) {

            alert(
                "Your session has expired."
            );

            window.location.href =
                "/login.html";

            return;

        }


        if (
            response.status === 403
        ) {

            alert(
                "Only the Superadmin can change school status."
            );

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to update school status."
            );

        }


        loadSchools();


    } catch (error) {

        console.error(
            "[SUPERADMIN] STATUS ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to update school status."
        );

    }

}


// =====================================================
// VIEW SCHOOL
// =====================================================

function viewSchool(
    id
) {

    alert(
        "School ID: " +
        id
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// ESCAPE JAVASCRIPT STRING
// =====================================================

function escapeJs(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );

}


// =====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.resetSchoolAdminPassword =
    resetSchoolAdminPassword;

window.toggleSchool =
    toggleSchool;

window.viewSchool =
    viewSchool;

