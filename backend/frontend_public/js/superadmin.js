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
                (data.school?.name || schoolName) +
                "\n\n" +

                "School Code: " +
                (data.school?.code || "-") +
                "\n\n" +

                "Admin Name: " +
                (data.admin?.name || adminName) +
                "\n\n" +

                "Admin Email: " +
                (data.admin?.email || adminEmail) +
                "\n\n" +

                "Temporary Password:\n" +
                adminPassword +
                "\n\n" +

                "The school admin must change this password after login."

            );


            schoolNameElement.value = "";
            adminNameElement.value = "";
            adminEmailElement.value = "";
            adminPasswordElement.value = "";


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
                                        data-school-id="${escapeHtml(schoolId)}"
                                        data-admin-id="${escapeHtml(adminId)}"
                                        data-admin-name="${escapeHtml(admin.name || "")}"
                                        data-admin-email="${escapeHtml(admin.email || "")}"
                                    >
                                        🔐 Reset Password
                                    </button>

                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="view-school-button"
                            data-school-id="${escapeHtml(schoolId)}"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="toggle-school-button"
                            data-school-id="${escapeHtml(schoolId)}"
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
        // ATTACH BUTTON EVENTS
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
                background:rgba(0,0,0,0.55);
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
                    max-width:450px;
                    border-radius:14px;
                    padding:25px;
                    box-sizing:border-box;
                    box-shadow:0 20px 60px rgba(0,0,0,0.30);
                "
            >

                <h2
                    style="
                        margin:0 0 8px 0;
                    "
                >
                    🔐 Reset Admin Password
                </h2>


                <p
                    id="resetPasswordAdminInfo"
                    style="
                        color:#555;
                        line-height:1.5;
                        margin:0 0 20px 0;
                    "
                >
                </p>


                <label
                    for="resetPasswordInput"
                    style="
                        display:block;
                        margin-bottom:7px;
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
                        font-size:15px;
                    "
                >


                <small
                    style="
                        display:block;
                        color:#777;
                        margin-bottom:20px;
                        line-height:1.4;
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
                        background:#fef2f2;
                        border:1px solid #fecaca;
                        padding:10px;
                        border-radius:8px;
                        margin-top:15px;
                        font-size:14px;
                        line-height:1.4;
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


    document
        .getElementById(
            "resetPasswordInput"
        )
        .addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    submitResetPassword();

                }


                if (
                    event.key === "Escape"
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


    if (
        !modal ||
        !info ||
        !passwordInput ||
        !errorBox
    ) {

        console.error(
            "[SUPERADMIN] Reset password modal elements not found."
        );

        return;

    }


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


    passwordInput.value =
        "";


    errorBox.textContent =
        "";

    errorBox.style.display =
        "none";


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
            "[SUPERADMIN] Missing school ID or admin ID."
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


    if (
        !passwordInput ||
        !errorBox ||
        !confirmButton
    ) {

        console.error(
            "[SUPERADMIN] Reset password form elements not found."
        );

        return;

    }


    const newPassword =
        passwordInput.value.trim();


    // -------------------------------------------------
    // VALIDATE
    // -------------------------------------------------

    if (!newPassword) {

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


    // -------------------------------------------------
    // CONFIRM
    // -------------------------------------------------

    const confirmed =
        confirm(

            "Reset the password for " +
            resetPasswordAdminName +
            "?\n\n" +

            "The temporary password you entered will be saved.\n\n" +

            "The admin will be required to change it after login."

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
        // SUCCESS
        // -------------------------------------------------

        closeResetPasswordModal();


        alert(

            "PASSWORD RESET SUCCESSFUL\n\n" +

            "School Admin:\n" +
            (
                data.user?.name ||
                resetPasswordAdminName
            ) +
            "\n\n" +

            "Email:\n" +
            (
                data.user?.email ||
                resetPasswordAdminEmail
            ) +
            "\n\n" +

            "NEW TEMPORARY PASSWORD:\n\n" +

            (
                data.temporaryPassword ||
                newPassword
            ) +
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
// MAKE FRONTEND FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.openResetPasswordModal =
    openResetPasswordModal;

window.closeResetPasswordModal =
    closeResetPasswordModal;

window.submitResetPassword =
    submitResetPassword;

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
// DO NOT PUT THIS IN THIS FILE:
//
// exports.resetSchoolAdminPassword = ...
//
// DO NOT PUT:
//
// require(...)
// bcrypt
// School
// User
//
// Those belong in the BACKEND controller.
//
// This browser file only sends:
//
// PATCH
// /superadmin/schools/:schoolId/admin/:adminId/reset-password
//
// with:
//
// {
//     newPassword: "..."
// }
//
// =====================================================
