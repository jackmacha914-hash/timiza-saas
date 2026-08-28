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
//
// FRONTEND ONLY
//
// Opens a proper modal instead of confirm()/alert().
//
// The modal:
// - Shows admin details
// - Generates temporary password
// - Allows password editing
// - Sends newPassword to backend
// - Shows the temporary password after success
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
    // GENERATE TEMPORARY PASSWORD
    // -------------------------------------------------

    function generateTemporaryPassword() {

        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

        let password = "";

        for (
            let i = 0;
            i < 10;
            i++
        ) {

            password +=
                chars.charAt(
                    Math.floor(
                        Math.random() *
                        chars.length
                    )
                );

        }

        return password;

    }


    const temporaryPassword =
        generateTemporaryPassword();


    // -------------------------------------------------
    // CREATE MODAL
    // -------------------------------------------------

    const modal =
        document.createElement("div");

    modal.id =
        "resetPasswordModal";


    modal.innerHTML = `

        <div
            id="resetPasswordOverlay"
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,0.65);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
            "
        >

            <div
                style="
                    width:100%;
                    max-width:480px;
                    background:#ffffff;
                    border-radius:16px;
                    padding:28px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.30);
                    font-family:Arial,sans-serif;
                "
            >

                <!-- HEADER -->

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:20px;
                    "
                >

                    <div>

                        <h2
                            style="
                                margin:0;
                                font-size:22px;
                                color:#111827;
                            "
                        >
                            🔐 Reset Admin Password
                        </h2>

                        <p
                            style="
                                margin:6px 0 0;
                                color:#6b7280;
                                font-size:14px;
                            "
                        >
                            Create a temporary password
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeResetPasswordModal"
                        style="
                            border:none;
                            background:transparent;
                            font-size:24px;
                            cursor:pointer;
                            color:#6b7280;
                        "
                    >
                        ×
                    </button>

                </div>


                <!-- ADMIN INFORMATION -->

                <div
                    style="
                        background:#f3f4f6;
                        border-radius:10px;
                        padding:15px;
                        margin-bottom:20px;
                    "
                >

                    <div
                        style="
                            font-size:13px;
                            color:#6b7280;
                            margin-bottom:5px;
                        "
                    >
                        School Admin
                    </div>

                    <strong
                        id="resetAdminName"
                        style="
                            display:block;
                            color:#111827;
                            font-size:16px;
                        "
                    >
                        ${escapeHtml(adminName)}
                    </strong>


                    <div
                        id="resetAdminEmail"
                        style="
                            margin-top:5px;
                            color:#6b7280;
                            font-size:14px;
                        "
                    >
                        ${escapeHtml(adminEmail)}
                    </div>

                </div>


                <!-- PASSWORD -->

                <label
                    for="resetTemporaryPassword"
                    style="
                        display:block;
                        font-weight:600;
                        color:#111827;
                        margin-bottom:8px;
                    "
                >
                    Temporary Password
                </label>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        margin-bottom:10px;
                    "
                >

                    <input
                        type="text"
                        id="resetTemporaryPassword"
                        value="${escapeHtml(temporaryPassword)}"
                        minlength="6"
                        autocomplete="off"
                        style="
                            flex:1;
                            box-sizing:border-box;
                            padding:13px;
                            border:1px solid #d1d5db;
                            border-radius:9px;
                            font-size:16px;
                            font-weight:600;
                            letter-spacing:1px;
                        "
                    />


                    <button
                        type="button"
                        id="generateResetPassword"
                        style="
                            padding:0 14px;
                            border:none;
                            border-radius:9px;
                            background:#e5e7eb;
                            color:#111827;
                            cursor:pointer;
                            font-weight:600;
                        "
                    >
                        Generate
                    </button>

                </div>


                <p
                    style="
                        margin:0 0 20px;
                        font-size:13px;
                        color:#6b7280;
                    "
                >
                    The admin will be required to change this
                    password after logging in.
                </p>


                <!-- ERROR -->

                <div
                    id="resetPasswordError"
                    style="
                        display:none;
                        background:#fee2e2;
                        color:#991b1b;
                        padding:12px;
                        border-radius:8px;
                        margin-bottom:15px;
                        font-size:14px;
                    "
                ></div>


                <!-- BUTTONS -->

                <div
                    style="
                        display:flex;
                        gap:10px;
                        justify-content:flex-end;
                    "
                >

                    <button
                        type="button"
                        id="cancelResetPassword"
                        style="
                            padding:12px 18px;
                            border:1px solid #d1d5db;
                            background:#ffffff;
                            border-radius:9px;
                            cursor:pointer;
                            font-weight:600;
                            color:#374151;
                        "
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        id="confirmResetPassword"
                        style="
                            padding:12px 18px;
                            border:none;
                            background:#2563eb;
                            color:#ffffff;
                            border-radius:9px;
                            cursor:pointer;
                            font-weight:600;
                        "
                    >
                        🔐 Reset Password
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // -------------------------------------------------
    // GET MODAL ELEMENTS
    // -------------------------------------------------

    const passwordInput =
        document.getElementById(
            "resetTemporaryPassword"
        );


    const generateButton =
        document.getElementById(
            "generateResetPassword"
        );


    const confirmButton =
        document.getElementById(
            "confirmResetPassword"
        );


    const cancelButton =
        document.getElementById(
            "cancelResetPassword"
        );


    const closeButton =
        document.getElementById(
            "closeResetPasswordModal"
        );


    const overlay =
        document.getElementById(
            "resetPasswordOverlay"
        );


    const errorBox =
        document.getElementById(
            "resetPasswordError"
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
    // GENERATE NEW PASSWORD
    // -------------------------------------------------

    generateButton.addEventListener(
        "click",
        function() {

            passwordInput.value =
                generateTemporaryPassword();

            errorBox.style.display =
                "none";

        }
    );


    // -------------------------------------------------
    // SUBMIT RESET
    // -------------------------------------------------

    confirmButton.addEventListener(
        "click",
        async function() {

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

                return;

            }


            if (
                newPassword.length < 6
            ) {

                errorBox.textContent =
                    "Temporary password must be at least 6 characters.";

                errorBox.style.display =
                    "block";

                return;

            }


            errorBox.style.display =
                "none";


            // -----------------------------------------
            // DISABLE BUTTON
            // -----------------------------------------

            confirmButton.disabled =
                true;

            confirmButton.textContent =
                "Resetting...";


            try {

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
                // SESSION EXPIRED
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
                // FORBIDDEN
                // -------------------------------------

                if (
                    response.status === 403
                ) {

                    throw new Error(
                        "Only the Superadmin can reset school admin passwords."
                    );

                }


                // -------------------------------------
                // READ RESPONSE
                // -------------------------------------

                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.message ||
                        data.msg ||
                        "Failed to reset password."
                    );

                }


                if (
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Password reset failed."
                    );

                }


                // -------------------------------------
                // SHOW SUCCESS MODAL
                // -------------------------------------

                modal.innerHTML = `

                    <div
                        style="
                            position:fixed;
                            inset:0;
                            background:rgba(0,0,0,0.65);
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            z-index:99999;
                            padding:20px;
                        "
                    >

                        <div
                            style="
                                width:100%;
                                max-width:480px;
                                background:#ffffff;
                                border-radius:16px;
                                padding:30px;
                                box-shadow:0 20px 60px rgba(0,0,0,0.30);
                                font-family:Arial,sans-serif;
                            "
                        >

                            <div
                                style="
                                    text-align:center;
                                    font-size:46px;
                                    margin-bottom:10px;
                                "
                            >
                                ✅
                            </div>


                            <h2
                                style="
                                    text-align:center;
                                    margin:0 0 8px;
                                    color:#111827;
                                "
                            >
                                Password Reset Successful
                            </h2>


                            <p
                                style="
                                    text-align:center;
                                    color:#6b7280;
                                    margin-bottom:24px;
                                "
                            >
                                The school admin must change this
                                password after login.
                            </p>


                            <div
                                style="
                                    background:#f3f4f6;
                                    border-radius:10px;
                                    padding:15px;
                                    margin-bottom:15px;
                                "
                            >

                                <div
                                    style="
                                        font-size:13px;
                                        color:#6b7280;
                                    "
                                >
                                    School Admin
                                </div>

                                <strong
                                    style="
                                        display:block;
                                        margin-top:4px;
                                        color:#111827;
                                    "
                                >
                                    ${escapeHtml(adminName)}
                                </strong>


                                <div
                                    style="
                                        margin-top:4px;
                                        color:#6b7280;
                                        font-size:14px;
                                    "
                                >
                                    ${escapeHtml(adminEmail)}
                                </div>

                            </div>


                            <div
                                style="
                                    background:#eff6ff;
                                    border:2px solid #2563eb;
                                    border-radius:10px;
                                    padding:18px;
                                    text-align:center;
                                    margin-bottom:20px;
                                "
                            >

                                <div
                                    style="
                                        font-size:13px;
                                        color:#1d4ed8;
                                        font-weight:600;
                                        margin-bottom:8px;
                                    "
                                >
                                    NEW TEMPORARY PASSWORD
                                </div>


                                <div
                                    style="
                                        font-size:24px;
                                        font-weight:700;
                                        letter-spacing:2px;
                                        color:#111827;
                                        word-break:break-all;
                                    "
                                >
                                    ${escapeHtml(newPassword)}
                                </div>

                            </div>


                            <button
                                type="button"
                                id="closeSuccessResetModal"
                                style="
                                    width:100%;
                                    padding:13px;
                                    border:none;
                                    background:#2563eb;
                                    color:#ffffff;
                                    border-radius:9px;
                                    cursor:pointer;
                                    font-weight:600;
                                    font-size:15px;
                                "
                            >
                                Done
                            </button>

                        </div>

                    </div>

                `;


                // -------------------------------------
                // SUCCESS CLOSE BUTTON
                // -------------------------------------

                const successClose =
                    document.getElementById(
                        "closeSuccessResetModal"
                    );


                successClose.addEventListener(
                    "click",
                    function() {

                        closeModal();

                        loadSchools();

                    }
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


                confirmButton.disabled =
                    false;


                confirmButton.textContent =
                    "🔐 Reset Password";

            }

        }
    );

}


// =====================================================
// MAKE RESET FUNCTION AVAILABLE TO HTML
// =====================================================

window.resetSchoolAdminPassword =
    resetSchoolAdminPassword;

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

