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

function createResetPasswordModal() {

    if (document.getElementById("resetPasswordModal")) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "resetPasswordModal";

    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,0.55);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
            "
        >

            <div
                style="
                    background:#ffffff;
                    width:100%;
                    max-width:450px;
                    border-radius:12px;
                    padding:25px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.25);
                "
            >

                <h2
                    style="
                        margin-top:0;
                        margin-bottom:8px;
                    "
                >
                    🔐 Reset Admin Password
                </h2>


                <p
                    id="resetPasswordAdminInfo"
                    style="
                        color:#555;
                        margin-bottom:20px;
                    "
                >
                </p>


                <label
                    style="
                        display:block;
                        margin-bottom:6px;
                        font-weight:600;
                    "
                >
                    New Temporary Password
                </label>


                <input
                    id="resetPasswordInput"
                    type="password"
                    minlength="6"
                    autocomplete="new-password"
                    placeholder="Enter temporary password"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:12px;
                        border:1px solid #ccc;
                        border-radius:8px;
                        margin-bottom:8px;
                    "
                >


                <small
                    style="
                        display:block;
                        color:#777;
                        margin-bottom:20px;
                    "
                >
                    Minimum 6 characters. The admin will be
                    required to change it after login.
                </small>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:10px;
                    "
                >

                    <button
                        type="button"
                        id="cancelResetPasswordBtn"
                        style="
                            padding:10px 16px;
                            border:1px solid #ccc;
                            background:#fff;
                            border-radius:8px;
                            cursor:pointer;
                        "
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        id="confirmResetPasswordBtn"
                        style="
                            padding:10px 16px;
                            border:none;
                            background:#2563eb;
                            color:#fff;
                            border-radius:8px;
                            cursor:pointer;
                        "
                    >
                        Reset Password
                    </button>

                </div>


                <div
                    id="resetPasswordError"
                    style="
                        display:none;
                        color:#dc2626;
                        margin-top:15px;
                        font-size:14px;
                    "
                >
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "cancelResetPasswordBtn"
        )
        .addEventListener(
            "click",
            closeResetPasswordModal
        );


    document
        .getElementById(
            "confirmResetPasswordBtn"
        )
        .addEventListener(
            "click",
            submitResetPassword
        );

}


// =====================================================
// OPEN RESET PASSWORD MODAL
// =====================================================

let resetPasswordSchoolId =
    null;

let resetPasswordAdminId =
    null;

let resetPasswordAdminName =
    null;

let resetPasswordAdminEmail =
    null;


function openResetPasswordModal(
    schoolId,
    adminId,
    adminName,
    adminEmail
) {

    if (!checkAuthentication()) {
        return;
    }


    createResetPasswordModal();


    resetPasswordSchoolId =
        schoolId;

    resetPasswordAdminId =
        adminId;

    resetPasswordAdminName =
        adminName;

    resetPasswordAdminEmail =
        adminEmail;


    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    const info =
        document.getElementById(
            "resetPasswordAdminInfo"
        );


    const passwordInput =
        document.getElementById(
            "resetPasswordInput"
        );


    const errorBox =
        document.getElementById(
            "resetPasswordError"
        );


    info.innerHTML =
        "Admin: <strong>" +
        escapeHtml(adminName) +
        "</strong><br>" +
        "Email: " +
        escapeHtml(adminEmail);


    passwordInput.value =
        "";


    errorBox.style.display =
        "none";


    errorBox.textContent =
        "";


    modal.style.display =
        "block";


    setTimeout(
        function () {

            passwordInput.focus();

        },
        100
    );

}


// =====================================================
// CLOSE RESET PASSWORD MODAL
// =====================================================

function closeResetPasswordModal() {

    const modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    resetPasswordSchoolId =
        null;

    resetPasswordAdminId =
        null;

    resetPasswordAdminName =
        null;

    resetPasswordAdminEmail =
        null;

}


// =====================================================
// SUBMIT RESET PASSWORD
// =====================================================

async function submitResetPassword() {

    if (!checkAuthentication()) {
        return;
    }


    if (
        !resetPasswordSchoolId ||
        !resetPasswordAdminId
    ) {

        console.error(
            "[SUPERADMIN] Missing school/admin ID"
        );

        return;

    }


    const passwordInput =
        document.getElementById(
            "resetPasswordInput"
        );


    const errorBox =
        document.getElementById(
            "resetPasswordError"
        );


    const confirmButton =
        document.getElementById(
            "confirmResetPasswordBtn"
        );


    const newPassword =
        passwordInput.value.trim();


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!newPassword) {

        errorBox.textContent =
            "Please enter a temporary password.";

        errorBox.style.display =
            "block";

        passwordInput.focus();

        return;

    }


    if (newPassword.length < 6) {

        errorBox.textContent =
            "Temporary password must be at least 6 characters.";

        errorBox.style.display =
            "block";

        passwordInput.focus();

        return;

    }


    // -------------------------------------------------
    // CONFIRM
    // -------------------------------------------------

    const confirmed =
        confirm(

            "Reset the password for " +
            resetPasswordAdminName +
            "?\n\n" +

            "A new temporary password will be created.\n" +

            "The admin must change it after login."

        );


    if (!confirmed) {
        return;
    }


    // -------------------------------------------------
    // DISABLE BUTTON
    // -------------------------------------------------

    confirmButton.disabled =
        true;

    confirmButton.textContent =
        "Resetting...";


    errorBox.style.display =
        "none";


    try {

        const response =
            await fetch(

                API +
                "/superadmin/schools/" +
                encodeURIComponent(
                    resetPasswordSchoolId
                ) +
                "/admin/" +
                encodeURIComponent(
                    resetPasswordAdminId
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


        // -------------------------------------------------
        // AUTH ERRORS
        // -------------------------------------------------

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

            errorBox.textContent =
                "Only the Superadmin can reset school admin passwords.";

            errorBox.style.display =
                "block";

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.msg ||
                "Failed to reset password."
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Password reset failed."
            );

        }


        // -------------------------------------------------
        // CLOSE MODAL
        // -------------------------------------------------

        closeResetPasswordModal();


        // -------------------------------------------------
        // SHOW TEMPORARY PASSWORD
        // -------------------------------------------------

        alert(

            "PASSWORD RESET SUCCESSFUL\n\n" +

            "School Admin:\n" +
            data.user.name +
            "\n\n" +

            "Email:\n" +
            data.user.email +
            "\n\n" +

            "NEW TEMPORARY PASSWORD:\n\n" +

            data.temporaryPassword +
            "\n\n" +

            "Give this password to the school admin.\n\n" +

            "They MUST change it after logging in."

        );


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


    } finally {

        confirmButton.disabled =
            false;

        confirmButton.textContent =
            "Reset Password";

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
            function (school) {

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
                                        onclick="openResetPasswordModal(
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
// MAKE FRONTEND FUNCTIONS AVAILABLE
// =====================================================

window.openResetPasswordModal =
    openResetPasswordModal;

window.closeResetPasswordModal =
    closeResetPasswordModal;

window.submitResetPassword =
    submitResetPassword;


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

