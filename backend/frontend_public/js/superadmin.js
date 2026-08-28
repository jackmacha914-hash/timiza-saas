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
            `Bearer ${token}`

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

                            schoolName,

                            adminName,

                            adminEmail,

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

            /**
             * -----------------------------------------
             * Show school credentials
             * -----------------------------------------
             */
            alert(

                "✅ SCHOOL CREATED SUCCESSFULLY\n\n" +

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
                data.temporaryPassword +
                "\n\n" +

                "⚠️ The school admin must change this password after login."

            );


            /**
             * -----------------------------------------
             * Clear form
             * -----------------------------------------
             */
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
                                            '${school._id}',
                                            '${admin._id}',
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
                            onclick="viewSchool('${school._id}')"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            onclick="toggleSchool('${school._id}')"
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
// RESET SCHOOL ADMIN PASSWORD
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


    /**
     * -----------------------------------------
     * Confirm action
     * -----------------------------------------
     */
    const confirmed =
        confirm(

            "RESET SCHOOL ADMIN PASSWORD?\n\n" +

            "School Admin: " +
            adminName +
            "\n" +

            "Email: " +
            adminEmail +
            "\n\n" +

            "A new temporary password will be generated.\n\n" +

            "The admin will be forced to change it after login."

        );


    if (!confirmed) {
        return;
    }


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
                "Only the Superadmin can reset school admin passwords."
            );

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


        if (data.success) {

            /**
             * -----------------------------------------
             * SHOW NEW TEMPORARY PASSWORD
             * -----------------------------------------
             */
            alert(

                "🔐 PASSWORD RESET SUCCESSFUL\n\n" +

                "School Admin:\n" +
                data.user.name +
                "\n\n" +

                "Email:\n" +
                data.user.email +
                "\n\n" +

                "NEW TEMPORARY PASSWORD:\n\n" +

                data.temporaryPassword +
                "\n\n" +

                "⚠️ Give this password to the school admin.\n\n" +

                "They MUST change it after logging in."

            );

        }


    } catch (error) {

        console.error(
            "[SUPERADMIN] RESET PASSWORD ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to reset password."
        );

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

