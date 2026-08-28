const School = require("../models/School");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// ========================================
// GENERATE SCHOOL CODE
// ========================================

function generateSchoolCode(name) {

```
const letters = name
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .substring(0, 4);

const numbers =
    Math.floor(100 + Math.random() * 900);

return `${letters}${numbers}`;
```

}

// ========================================
// GENERATE TEMPORARY PASSWORD
// ========================================
//
// Generates a random temporary password.
// Example: Tm7K9pQ2
//
// The Super Admin receives this password
// and gives it to the school administrator.
//

function generateTemporaryPassword() {

```
const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

const randomBytes =
    crypto.randomBytes(8);

let password = "";

for (let i = 0; i < 8; i++) {

    password +=
        characters[
            randomBytes[i] % characters.length
        ];

}

return password;
```

}

// ========================================
// CREATE SCHOOL
// ========================================

exports.createSchool = async (req, res) => {

```
try {

    const {
        schoolName,
        adminName,
        adminEmail,
        adminPassword,
        subscriptionType = "Trial"
    } = req.body;


    if (
        !schoolName ||
        !adminName ||
        !adminEmail
    ) {

        return res.status(400).json({

            success: false,

            message:
                "School name, admin name and admin email are required."

        });

    }


    // ========================================
    // TEMPORARY PASSWORD
    // ========================================
    //
    // If the Super Admin supplied a password,
    // keep supporting that.
    //
    // Otherwise generate one automatically.
    //

    const temporaryPassword =
        adminPassword ||
        generateTemporaryPassword();


    // ========================================
    // GENERATE UNIQUE SCHOOL CODE
    // ========================================

    let schoolCode;

    do {

        schoolCode =
            generateSchoolCode(schoolName);

    } while (
        await School.findOne({
            code: schoolCode
        })
    );


    // ========================================
    // SUBSCRIPTION DATES
    // ========================================

    const startDate =
        new Date();

    const endDate =
        new Date();


    switch (subscriptionType) {

        case "Basic":

            endDate.setMonth(
                endDate.getMonth() + 12
            );

            break;


        case "Premium":

            endDate.setMonth(
                endDate.getMonth() + 12
            );

            break;


        case "Enterprise":

            endDate.setMonth(
                endDate.getMonth() + 12
            );

            break;


        default:

            // Trial = 30 days

            endDate.setDate(
                endDate.getDate() + 30
            );

    }


    // ========================================
    // CREATE SCHOOL
    // ========================================

    const school =
        await School.create({

            name:
                schoolName,

            code:
                schoolCode,

            slug:
                schoolName
                    .toLowerCase()
                    .replace(/\s+/g, "-"),

            active:
                true,

            subscription: {

                plan:
                    subscriptionType,

                status:
                    "Active",

                startDate,

                endDate

            }

        });


    // ========================================
    // HASH TEMPORARY PASSWORD
    // ========================================

    const hashedPassword =
        await bcrypt.hash(
            temporaryPassword,
            10
        );


    // ========================================
    // CREATE SCHOOL ADMIN
    // ========================================

    const admin =
        await User.create({

            school:
                school._id,

            name:
                adminName,

            email:
                adminEmail,

            password:
                hashedPassword,

            role:
                "admin",

            // IMPORTANT
            // Admin MUST change this password
            // after first login.

            mustChangePassword:
                true,

            passwordResetAt:
                new Date()

        });


    // ========================================
    // RESPONSE
    // ========================================
    //
    // IMPORTANT:
    // We return the temporary password ONLY
    // to the Super Admin at creation time.
    //
    // The database stores only the bcrypt hash.
    //

    return res.status(201).json({

        success:
            true,

        message:
            "School created successfully.",

        loginCode:
            school.code,

        temporaryPassword,

        school,

        admin: {

            id:
                admin._id,

            name:
                admin.name,

            email:
                admin.email,

            role:
                admin.role,

            mustChangePassword:
                admin.mustChangePassword

        }

    });


} catch (err) {

    console.error(
        "[SUPERADMIN] CREATE SCHOOL ERROR:",
        err
    );


    return res.status(500).json({

        success:
            false,

        message:
            err.message

    });

}
```

};

// ========================================
// RESET SCHOOL ADMIN PASSWORD
// ========================================
//
// POST
// /api/superadmin/schools/:id/reset-admin-password
//
// :id = School ID
//
// ONLY THE SUPER ADMIN SHOULD BE ALLOWED
// TO CALL THIS ROUTE.
//
// The route should be protected with:
// authenticateUser
// authorizeRoles("superadmin")
//

exports.resetAdminPassword = async (req, res) => {

```
try {

    const schoolId =
        req.params.id;


    // ========================================
    // FIND SCHOOL
    // ========================================

    const school =
        await School.findById(
            schoolId
        );


    if (!school) {

        return res.status(404).json({

            success:
                false,

            message:
                "School not found."

        });

    }


    // ========================================
    // FIND SCHOOL ADMIN
    // ========================================

    const admin =
        await User.findOne({

            school:
                school._id,

            role:
                "admin"

        });


    if (!admin) {

        return res.status(404).json({

            success:
                false,

            message:
                "School administrator not found."

        });

    }


    // ========================================
    // GENERATE NEW TEMPORARY PASSWORD
    // ========================================

    const temporaryPassword =
        generateTemporaryPassword();


    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword =
        await bcrypt.hash(
            temporaryPassword,
            10
        );


    // ========================================
    // UPDATE ADMIN
    // ========================================

    admin.password =
        hashedPassword;


    // Force password change on next login

    admin.mustChangePassword =
        true;


    // Record when reset happened

    admin.passwordResetAt =
        new Date();


    await admin.save();


    // ========================================
    // LOG RESET
    // ========================================

    console.log(
        "[SUPERADMIN] ADMIN PASSWORD RESET:",
        {

            school:
                school.name,

            schoolId:
                school._id,

            admin:
                admin.email,

            adminId:
                admin._id,

            passwordResetAt:
                admin.passwordResetAt

        }
    );


    // ========================================
    // RESPONSE
    // ========================================
    //
    // The actual password is returned ONLY
    // to the authenticated Super Admin.
    //

    return res.json({

        success:
            true,

        message:
            "School admin password reset successfully.",

        school: {

            id:
                school._id,

            name:
                school.name,

            code:
                school.code

        },

        admin: {

            id:
                admin._id,

            name:
                admin.name,

            email:
                admin.email

        },

        temporaryPassword,

        mustChangePassword:
            true

    });


} catch (err) {

    console.error(
        "[SUPERADMIN] RESET ADMIN PASSWORD ERROR:",
        err
    );


    return res.status(500).json({

        success:
            false,

        message:
            "Failed to reset administrator password.",

        error:
            err.message

    });

}
```

};

// ========================================
// LIST ALL SCHOOLS
// ========================================

exports.getSchools = async (req, res) => {

```
try {

    const schools =
        await School.find()
            .sort({
                createdAt: -1
            });


    return res.json(
        schools
    );


} catch (err) {

    console.error(
        "[SUPERADMIN] GET SCHOOLS ERROR:",
        err
    );


    return res.status(500).json({

        success:
            false,

        message:
            err.message

    });

}
```

};

// ========================================
// SUSPEND / ACTIVATE SCHOOL
// ========================================

exports.toggleSchoolStatus = async (req, res) => {

```
try {

    const school =
        await School.findById(
            req.params.id
        );


    if (!school) {

        return res.status(404).json({

            success:
                false,

            message:
                "School not found"

        });

    }


    school.active =
        !school.active;


    // Keep subscription status synchronized

    if (school.active) {

        if (
            school.subscription?.endDate &&
            new Date(
                school.subscription.endDate
            ) < new Date()
        ) {

            school.subscription.status =
                "Expired";

        } else {

            school.subscription.status =
                "Active";

        }

    } else {

        school.subscription.status =
            "Suspended";

    }


    await school.save();


    return res.json({

        success:
            true,

        active:
            school.active,

        subscriptionStatus:
            school.subscription?.status

    });


} catch (err) {

    console.error(
        "[SUPERADMIN] TOGGLE SCHOOL ERROR:",
        err
    );


    return res.status(500).json({

        success:
            false,

        message:
            err.message

    });

}
```

};

// ========================================
// AUTO EXPIRE SUBSCRIPTIONS
// ========================================

exports.checkExpiredSubscriptions = async () => {

```
try {

    const today =
        new Date();


    await School.updateMany(

        {
            "subscription.endDate":
                {
                    $lt:
                        today
                },

            active:
                true
        },

        {
            $set: {

                active:
                    false,

                "subscription.status":
                    "Expired"

            }

        }

    );


    console.log(
        "[SUPERADMIN] Expired subscriptions checked."
    );


} catch (err) {

    console.error(
        "[SUPERADMIN] SUBSCRIPTION EXPIRY ERROR:",
        err
    );

}
```

};
