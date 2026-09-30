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
// CHECK AUTHENTICATION
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
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

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


        createResetPasswordModal();


        loadSchools();

    }
);


// =====================================================
// CREATE SCHOOL
// =====================================================

async function createSchool() {

    if (!checkAuthentication()) {
        return;
    }


    const schoolNameElement =
        document.getElementById(
            "schoolName"
        );

    const adminNameElement =
        document.getElementById(
            "adminName"
        );

    const adminEmailElement =
        document.getElementById(
            "adminEmail"
        );

    const adminPasswordElement =
        document.getElementById(
            "adminPassword"
        );


    if (
        !schoolNameElement ||
        !adminNameElement ||
        !adminEmailElement ||
        !adminPasswordElement
    ) {

        alert(
            "Create school form elements were not found."
        );

        return;

    }


    const schoolName =
        schoolNameElement.value.trim();

    const adminName =
        adminNameElement.value.trim();

    const adminEmail =
        adminEmailElement.value.trim();

    const adminPassword =
        adminPasswordElement.value.trim();


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
                (
                    data.school?.name ||
                    schoolName
                ) +
                "\n\n" +

                "School Code: " +
                (
                    data.school?.code ||
                    "-"
                ) +
                "\n\n" +

                "Admin Name: " +
                (
                    data.admin?.name ||
                    adminName
                ) +
                "\n\n" +

                "Admin Email: " +
                (
                    data.admin?.email ||
                    adminEmail
                ) +
                "\n\n" +

                "Temporary Password:\n" +
                adminPassword +
                "\n\n" +

                "The school admin must change this password after login."

            );


            schoolNameElement.value =
                "";

            adminNameElement.value =
                "";

            adminEmailElement.value =
                "";

            adminPasswordElement.value =
                "";


            await loadSchools();

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
                data.msg ||
                "Failed to load schools."
            );

        }


        const schools =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.schools)
                        ? data.schools
                        : []
                );


        const tbody =
            document.querySelector(
                "#schoolsTable tbody"
            );


        if (!tbody) {

            console.error(
                "[SUPERADMIN] schoolsTable tbody not found."
            );

            return;

        }


        tbody.innerHTML =
            "";


        if (
            schools.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="
                            text-align:center;
                            padding:30px;
                        "
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


                const schoolId =
                    school._id ||
                    school.id ||
                    "";


                const adminId =
                    admin
                        ? (
                            admin._id ||
                            admin.id ||
                            ""
                          )
                        : "";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            school.name || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            school.code || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            subscription.plan || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            subscription.status || "-"
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
                                            admin.name || "-"
                                        )}
                                    </strong>

                                    <br>

                                    <small>
                                        ${escapeHtml(
                                            admin.email || "-"
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
                            admin && adminId
                                ? `

                                    <button
                                        type="button"
                                        class="reset-password-button"
                                        data-school-id="${escapeHtml(
                                            schoolId
                                        )}"
                                        data-admin-id="${escapeHtml(
                                            adminId
                                        )}"
                                        data-admin-name="${escapeHtml(
                                            admin.name || ""
                                        )}"
                                        data-admin-email="${escapeHtml(
                                            admin.email || ""
                                        )}"
                                    >
                                        🔐 Reset Password
                                    </button>

                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="view-school-button"
                            data-school-id="${escapeHtml(
                                schoolId
                            )}"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="toggle-school-button"
                            data-school-id="${escapeHtml(
                                schoolId
                            )}"
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


        // -------------------------------------------------
        // RESET PASSWORD BUTTONS
        // -------------------------------------------------

        document
            .querySelectorAll(
                ".reset-password-button"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            openResetPasswordModal(

                                button.dataset.schoolId,

                                button.dataset.adminId,

                                button.dataset.adminName,

                                button.dataset.adminEmail

                            );

                        }
                    );

                }
            );


        // -------------------------------------------------
        // VIEW BUTTONS
        // -------------------------------------------------

        document
            .querySelectorAll(
                ".view-school-button"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            viewSchool(
                                button.dataset.schoolId
                            );

                        }
                    );

                }
            );


        // -------------------------------------------------
        // TOGGLE BUTTONS
        // -------------------------------------------------

        document
            .querySelectorAll(
                ".toggle-school-button"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            toggleSchool(
                                button.dataset.schoolId
                            );

                        }
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
// RESET PASSWORD MODAL STATE
// =====================================================

let resetPasswordSchoolId =
    null;

let resetPasswordAdminId =
    null;

let resetPasswordAdminName =
    null;

let resetPasswordAdminEmail =
    null;


// =====================================================
// CREATE RESET PASSWORD MODAL
// =====================================================

function createResetPasswordModal() {

    let modal =
        document.getElementById(
            "resetPasswordModal"
        );


    if (modal) {

        return modal;

    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "resetPasswordModal";


    modal.style.display =
        "none";


    modal.innerHTML = `

        <div
            id="resetPasswordOverlay"
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,0.60);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:999999;
                padding:20px;
                box-sizing:border-box;
            "
        >

            <div
                role="dialog"
                aria-modal="true"
                style="
                    background:#ffffff;
                    width:100%;
                    max-width:480px;
                    border-radius:16px;
                    padding:28px;
                    box-sizing:border-box;
                    box-shadow:0 25px 80px rgba(0,0,0,0.30);
                "
            >

                <!-- ============================= -->
                <!-- RESET VIEW -->
                <!-- ============================= -->

                <div id="resetPasswordResetView">

                    <div
                        style="
                            width:52px;
                            height:52px;
                            border-radius:50%;
                            background:#eff6ff;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:25px;
                            margin-bottom:15px;
                        "
                    >
                        🔐
                    </div>


                    <h2
                        style="
                            margin:0 0 8px 0;
                            font-size:22px;
                        "
                    >
                        Reset Admin Password
                    </h2>


                    <p
                        id="resetPasswordAdminInfo"
                        style="
                            color:#555;
                            line-height:1.6;
                            margin:0 0 22px 0;
                        "
                    >
                    </p>


                    <div
                        style="
                            background:#f8fafc;
                            border:1px solid #e2e8f0;
                            border-radius:10px;
                            padding:14px;
                            margin-bottom:22px;
                            color:#475569;
                            line-height:1.5;
                            font-size:14px;
                        "
                    >
                        A secure temporary password will be
                        generated automatically.
                        <br><br>
                        The admin will be required to change
                        the password after logging in.
                    </div>


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
                                padding:11px 18px;
                                border:1px solid #cbd5e1;
                                background:#fff;
                                border-radius:8px;
                                cursor:pointer;
                                font-size:14px;
                            "
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            id="confirmResetPasswordBtn"
                            style="
                                padding:11px 18px;
                                border:none;
                                background:#2563eb;
                                color:#fff;
                                border-radius:8px;
                                cursor:pointer;
                                font-size:14px;
                                font-weight:600;
                            "
                        >
                            Generate & Reset Password
                        </button>

                    </div>


                    <div
                        id="resetPasswordError"
                        style="
                            display:none;
                            color:#dc2626;
                            background:#fef2f2;
                            border:1px solid #fecaca;
                            padding:11px;
                            border-radius:8px;
                            margin-top:15px;
                            font-size:14px;
                            line-height:1.4;
                        "
                    >
                    </div>

                </div>


                <!-- ============================= -->
                <!-- SUCCESS VIEW -->
                <!-- ============================= -->

                <div
                    id="resetPasswordSuccessView"
                    style="
                        display:none;
                    "
                >

                    <div
                        style="
                            width:56px;
                            height:56px;
                            border-radius:50%;
                            background:#dcfce7;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:28px;
                            margin-bottom:15px;
                        "
                    >
                        ✓
                    </div>


                    <h2
                        style="
                            margin:0 0 8px 0;
                            font-size:22px;
                        "
                    >
                        Password Reset Successful
                    </h2>


                    <p
                        id="resetPasswordSuccessInfo"
                        style="
                            color:#555;
                            line-height:1.5;
                            margin:0 0 20px 0;
                        "
                    >
                    </p>


                    <label
                        style="
                            display:block;
                            font-weight:600;
                            margin-bottom:8px;
                        "
                    >
                        Temporary Password
                    </label>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            margin-bottom:12px;
                        "
                    >

                        <input
                            id="generatedTemporaryPassword"
                            type="text"
                            readonly
                            style="
                                flex:1;
                                min-width:0;
                                box-sizing:border-box;
                                padding:13px;
                                border:2px solid #2563eb;
                                border-radius:9px;
                                background:#eff6ff;
                                font-size:17px;
                                font-weight:700;
                                letter-spacing:0.5px;
                            "
                        >


                        <button
                            type="button"
                            id="copyTemporaryPasswordBtn"
                            style="
                                padding:10px 15px;
                                border:none;
                                background:#2563eb;
                                color:#fff;
                                border-radius:9px;
                                cursor:pointer;
                                font-weight:600;
                                white-space:nowrap;
                            "
                        >
                            📋 Copy
                        </button>

                    </div>


                    <div
                        id="copyPasswordMessage"
                        style="
                            display:none;
                            color:#15803d;
                            font-size:14px;
                            margin-bottom:15px;
                            font-weight:600;
                        "
                    >
                        ✓ Password copied to clipboard
                    </div>


                    <div
                        style="
                            background:#fff7ed;
                            border:1px solid #fed7aa;
                            color:#9a3412;
                            border-radius:10px;
                            padding:13px;
                            font-size:14px;
                            line-height:1.5;
                            margin-bottom:20px;
                        "
                    >
                        ⚠️ Give this temporary password to
                        the school admin securely.
                        <br><br>
                        The admin must change it after login.
                    </div>


                    <button
                        type="button"
                        id="closeResetSuccessBtn"
                        style="
                            width:100%;
                            padding:12px;
                            border:none;
                            background:#111827;
                            color:#fff;
                            border-radius:9px;
                            cursor:pointer;
                            font-size:15px;
                            font-weight:600;
                        "
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


    document
        .getElementById(
            "closeResetSuccessBtn"
        )
        .addEventListener(
            "click",
            closeResetPasswordModal
        );


    document
        .getElementById(
            "copyTemporaryPasswordBtn"
        )
        .addEventListener(
            "click",
            copyGeneratedPassword
        );


    document
        .getElementById(
            "resetPasswordOverlay"
        )
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target.id ===
                    "resetPasswordOverlay"
                ) {

                    closeResetPasswordModal();

                }

            }
        );


    return modal;

}


// =====================================================
// OPEN RESET PASSWORD MODAL
// =====================================================

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


    const resetView =
        document.getElementById(
            "resetPasswordResetView"
        );


    const successView =
        document.getElementById(
            "resetPasswordSuccessView"
        );


    const info =
        document.getElementById(
            "resetPasswordAdminInfo"
        );


    const errorBox =
        document.getElementById(
            "resetPasswordError"
        );


    const button =
        document.getElementById(
            "confirmResetPasswordBtn"
        );


    if (
        !modal ||
        !resetView ||
        !successView ||
        !info ||
        !errorBox ||
        !button
    ) {

        console.error(
            "[SUPERADMIN] Reset password modal elements not found."
        );

        return;

    }


    resetView.style.display =
        "block";

    successView.style.display =
        "none";


    info.innerHTML =

        "Admin: <strong>" +
        escapeHtml(
            adminName || "-"
        ) +
        "</strong><br>" +

        "Email: " +
        escapeHtml(
            adminEmail || "-"
        );


    errorBox.textContent =
        "";

    errorBox.style.display =
        "none";


    button.disabled =
        false;

    button.textContent =
        "Generate & Reset Password";


    modal.style.display =
        "block";

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
//
// IMPORTANT:
//
// The frontend does NOT ask for a password.
//
// The backend generates the temporary password.
//
// Request:
//
// PATCH
// /superadmin/schools/:schoolId/admin/:adminId/reset-password
//
// No request body is required.
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
            "[SUPERADMIN] Missing school ID or admin ID."
        );

        return;

    }


    const errorBox =
        document.getElementById(
            "resetPasswordError"
        );


    const confirmButton =
        document.getElementById(
            "confirmResetPasswordBtn"
        );


    if (
        !errorBox ||
        !confirmButton
    ) {

        console.error(
            "[SUPERADMIN] Reset password modal controls not found."
        );

        return;

    }


    const confirmed =
        confirm(

            "Reset the password for " +
            resetPasswordAdminName +
            "?\n\n" +

            "A secure temporary password will be generated automatically.\n\n" +

            "The admin will be required to change it after login."

        );


    if (!confirmed) {
        return;
    }


    confirmButton.disabled =
        true;

    confirmButton.textContent =
        "Generating Password...";

    errorBox.style.display =
        "none";


    try {

        const url =

            API +
            "/superadmin/schools/" +
            encodeURIComponent(
                resetPasswordSchoolId
            ) +
            "/admin/" +
            encodeURIComponent(
                resetPasswordAdminId
            ) +
            "/reset-password";


        console.log(
            "[SUPERADMIN] Reset password request:",
            url
        );


        const response =
            await fetch(
                url,
                {

                    method:
                        "PATCH",

                    headers:
                        getAuthHeaders()

                }
            );


        // -------------------------------------------------
        // AUTH ERROR
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


        // -------------------------------------------------
        // PERMISSION ERROR
        // -------------------------------------------------

        if (
            response.status === 403
        ) {

            errorBox.textContent =
                "Only the Superadmin can reset school admin passwords.";

            errorBox.style.display =
                "block";

            return;

        }


        // -------------------------------------------------
        // READ RESPONSE
        // -------------------------------------------------

        let data = {};


        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "The server returned an invalid response."
            );

        }


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
        // GET GENERATED PASSWORD
        // -------------------------------------------------

        const generatedPassword =
            data.temporaryPassword ||
            data.tempPassword ||
            data.password;


        if (!generatedPassword) {

            throw new Error(
                "Password was reset, but the server did not return the temporary password."
            );

        }


        // -------------------------------------------------
        // SHOW SUCCESS VIEW INSIDE SAME MODAL
        // -------------------------------------------------

        showResetPasswordSuccess(
            generatedPassword,
            data.user
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
            "Generate & Reset Password";

    }

}


// =====================================================
// SHOW RESET PASSWORD SUCCESS
// =====================================================

function showResetPasswordSuccess(
    temporaryPassword,
    user
) {

    const resetView =
        document.getElementById(
            "resetPasswordResetView"
        );


    const successView =
        document.getElementById(
            "resetPasswordSuccessView"
        );


    const successInfo =
        document.getElementById(
            "resetPasswordSuccessInfo"
        );


    const passwordInput =
        document.getElementById(
            "generatedTemporaryPassword"
        );


    const copyMessage =
        document.getElementById(
            "copyPasswordMessage"
        );


    if (
        !resetView ||
        !successView ||
        !successInfo ||
        !passwordInput
    ) {

        console.error(
            "[SUPERADMIN] Success modal elements not found."
        );

        return;

    }


    const adminName =
        user?.name ||
        resetPasswordAdminName ||
        "-";


    const adminEmail =
        user?.email ||
        resetPasswordAdminEmail ||
        "-";


    resetView.style.display =
        "none";


    successView.style.display =
        "block";


    successInfo.innerHTML =

        "Password for <strong>" +
        escapeHtml(
            adminName
        ) +
        "</strong> has been reset successfully." +

        "<br>" +

        "<small>" +
        escapeHtml(
            adminEmail
        ) +
        "</small>";


    passwordInput.value =
        temporaryPassword;


    if (copyMessage) {

        copyMessage.style.display =
            "none";

    }


    passwordInput.focus();

    passwordInput.select();

}


// =====================================================
// COPY GENERATED PASSWORD
// =====================================================

async function copyGeneratedPassword() {

    const passwordInput =
        document.getElementById(
            "generatedTemporaryPassword"
        );


    const copyButton =
        document.getElementById(
            "copyTemporaryPasswordBtn"
        );


    const copyMessage =
        document.getElementById(
            "copyPasswordMessage"
        );


    if (
        !passwordInput ||
        !passwordInput.value
    ) {

        return;

    }


    const password =
        passwordInput.value;


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                password
            );

        } else {

            passwordInput.removeAttribute(
                "readonly"
            );

            passwordInput.select();

            document.execCommand(
                "copy"
            );

            passwordInput.setAttribute(
                "readonly",
                "readonly"
            );

        }


        if (copyButton) {

            copyButton.textContent =
                "✓ Copied";

        }


        if (copyMessage) {

            copyMessage.style.display =
                "block";

        }


        setTimeout(
            function () {

                if (copyButton) {

                    copyButton.textContent =
                        "📋 Copy";

                }

            },
            2000
        );


    } catch (error) {

        console.error(
            "[SUPERADMIN] COPY PASSWORD ERROR:",
            error
        );


        // Fallback: select the password
        passwordInput.focus();
        passwordInput.select();


        if (copyButton) {

            copyButton.textContent =
                "Select & Copy";

        }

    }

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


    if (!id) {

        alert(
            "School ID is missing."
        );

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
                data.msg ||
                "Failed to update school status."
            );

        }


        await loadSchools();


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

    if (!id) {

        alert(
            "School ID is missing."
        );

        return;

    }


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
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.openResetPasswordModal =
    openResetPasswordModal;

window.closeResetPasswordModal =
    closeResetPasswordModal;

window.submitResetPassword =
    submitResetPassword;

window.copyGeneratedPassword =
    copyGeneratedPassword;

window.toggleSchool =
    toggleSchool;

window.viewSchool =
    viewSchool;

window.loadSchools =
    loadSchools;

window.createSchool =
    createSchool;


// =====================================================
// IMPORTANT
// =====================================================
//
// THIS IS FRONTEND CODE.
//
// DO NOT PUT:
//
// exports.resetSchoolAdminPassword
//
// require(...)
// bcrypt
// School
// User
//
// IN THIS FILE.
//
// Those belong ONLY in your Node/Express backend.
//
// The frontend now sends:
//
// PATCH
// /api/superadmin/schools/:schoolId/admin/:adminId/reset-password
//
// WITHOUT a password.
//
// The backend must generate:
//
// temporaryPassword
//
// and return:
//
// {
//     success: true,
//     temporaryPassword: "...",
//     user: {
//         name: "...",
//         email: "...",
//         mustChangePassword: true
//     }
// }
//
// =====================================================

