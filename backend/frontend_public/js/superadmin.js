const API="https://timiza-saas.onrender.com/api";

const button=document.getElementById("createSchoolBtn");

button.addEventListener("click",createSchool);

async function createSchool(){

    const schoolName=document.getElementById("schoolName").value;

    const adminName=document.getElementById("adminName").value;

    const adminEmail=document.getElementById("adminEmail").value;

    const adminPassword=document.getElementById("adminPassword").value;

    const response=await fetch(API+"/superadmin/create-school",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            schoolName,

            adminName,

            adminEmail,

            adminPassword

        })

    });

    const data=await response.json();

    alert(JSON.stringify(data,null,2));

}
