const API = "https://timiza-saas.onrender.com/api";

document
    .getElementById("createSchoolBtn")
    .addEventListener("click", createSchool);

loadSchools();

async function createSchool() {

    const schoolName =
        document.getElementById("schoolName").value;

    const adminName =
        document.getElementById("adminName").value;

    const adminEmail =
        document.getElementById("adminEmail").value;

    const adminPassword =
        document.getElementById("adminPassword").value;

    const response = await fetch(
        API + "/superadmin/create-school",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                schoolName,
                adminName,
                adminEmail,
                adminPassword
            })
        }
    );

    const data = await response.json();

    if (data.success) {

        alert("✅ School Created Successfully!");

        document.getElementById("schoolName").value = "";
        document.getElementById("adminName").value = "";
        document.getElementById("adminEmail").value = "";
        document.getElementById("adminPassword").value = "";

        loadSchools();

    } else {

        alert(data.message);

    }

}

async function loadSchools() {

    const response =
        await fetch(API + "/superadmin/schools");

    const schools =
        await response.json();

    const tbody =
        document.querySelector("#schoolsTable tbody");

    tbody.innerHTML = "";

    schools.forEach(school => {

        tbody.innerHTML += `

        <tr>

            <td>${school.name}</td>

            <td>${school.code}</td>

            <td>
                ${
                    school.active
                        ? "🟢 Active"
                        : "🔴 Suspended"
                }
            </td>

            <td>

                <button onclick="viewSchool('${school._id}')">
                    View
                </button>

                <button onclick="toggleSchool('${school._id}')">
                    ${
                        school.active
                            ? "Suspend"
                            : "Activate"
                    }
                </button>

            </td>

        </tr>

        `;

    });

}

async function toggleSchool(id) {

    await fetch(
        API + "/superadmin/schools/" + id + "/status",
        {
            method: "PATCH"
        }
    );

    loadSchools();

}

function viewSchool(id) {

    alert("School ID: " + id);

}
