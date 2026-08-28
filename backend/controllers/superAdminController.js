const School = require("../models/School");
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// =====================================================
// GENERATE SCHOOL CODE
// =====================================================

function generateSchoolCode(name) {

    const letters = name
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase()
        .substring(0, 4);

    const numbers =
        Math.floor(100 + Math.random() * 900);

    // Avoid template literals completely
    return letters + numbers;
}


// =====================================================
// CREATE SCHOOL
// =====================================================

exports.createSchool = async (req, res) => {

    try {

        const {
            schoolName,
            adminName,
            adminEmail,
            adminPassword,
            subscriptionType = "Trial"
        } = req.body;


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !schoolName ||
            !adminName ||
            !adminEmail ||
            !adminPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required."

            });

        }


        // ---------------------------------------------
        // GENERATE UNIQUE SCHOOL CODE
        // ---------------------------------------------

        let schoolCode;

        do {

            schoolCode =
                generateSchoolCode(schoolName);

        } while (
            await School.findOne({
                code: schoolCode
            })
        );


        // ---------------------------------------------
        // SUBSCRIPTION DATES
        // ---------------------------------------------

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

                break;
        }


        // ---------------------------------------------
        // CREATE SCHOOL
        // ---------------------------------------------

        const school =
            await School.create({

                name: schoolName,

                code: schoolCode,

                slug: schoolName
                    .toLowerCase()
                    .replace(/\s+/g, "-"),

                active: true,

                subscription: {

                    plan: subscriptionType,

                    status: "Active",

                    startDate,

                    endDate

                }

            });


        // ---------------------------------------------
        // HASH ADMIN TEMPORARY PASSWORD
        // ---------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                adminPassword,
                10
            );


        // ---------------------------------------------
        // CREATE SCHOOL ADMIN
        // ---------------------------------------------

        const admin =
            await User.create({

                school: school._id,

                name: adminName,

                email: adminEmail,

                password: hashedPassword,

                role: "admin",

                // IMPORTANT:
                // Admin must change the temporary
                // password on first login.

                mustChangePassword: true,

                passwordResetAt: null

            });


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "School and school admin created successfully.",

            loginCode:
                school.code,

            school,

            admin: {

                id: admin._id,

                name: admin.name,

                email: admin.email,

                role: admin.role,

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

            success: false,

            message:
                err.message

        });

    }

};


// =====================================================
// LIST ALL SCHOOLS
// =====================================================

exports.getSchools = async (req, res) => {

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

            success: false,

            message:
                err.message

        });

    }

};


// =====================================================
// SUSPEND / ACTIVATE SCHOOL
// =====================================================

exports.toggleSchoolStatus = async (req, res) => {

    try {

        const school =
            await School.findById(
                req.params.id
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found"

            });

        }


        school.active =
            !school.active;


        await school.save();


        return res.json({

            success: true,

            active:
                school.active

        });


    } catch (err) {

        console.error(
            "[SUPERADMIN] TOGGLE SCHOOL ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


// =====================================================
// SUPER ADMIN RESET SCHOOL ADMIN PASSWORD
// =====================================================
//
// This is intentionally different from the normal
// change-password endpoint.
//
// The school admin does NOT reset their own password.
// Only Super Admin can reset it.
//
// After reset:
//
// mustChangePassword = true
//
// The new password becomes a temporary password.
// The school admin must change it after login.
// =====================================================

exports.resetSchoolAdminPassword = async (req, res) => {

    try {

        const schoolId =
            req.params.id;


        const {
            newPassword
        } = req.body;


        // ---------------------------------------------
        // VALIDATE PASSWORD
        // ---------------------------------------------

        if (
            !newPassword ||
            typeof newPassword !== "string"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Temporary password is required."

            });

        }


        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Temporary password must be at least 6 characters."

            });

        }


        // ---------------------------------------------
        // FIND SCHOOL
        // ---------------------------------------------

        const school =
            await School.findById(
                schoolId
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        // ---------------------------------------------
        // FIND SCHOOL ADMIN
        // ---------------------------------------------

        const admin =
            await User.findOne({

                school: school._id,

                role: "admin"

            });


        if (!admin) {

            return res.status(404).json({

                success: false,

                message:
                    "School admin not found."

            });

        }


        // ---------------------------------------------
        // HASH TEMPORARY PASSWORD
        // ---------------------------------------------

        admin.password =
            await bcrypt.hash(
                newPassword,
                10
            );


        // ---------------------------------------------
        // FORCE PASSWORD CHANGE
        // ---------------------------------------------

        admin.mustChangePassword =
            true;


        // Store when the reset happened

        admin.passwordResetAt =
            new Date();


        await admin.save();


        console.log(
            "[SUPERADMIN] SCHOOL ADMIN PASSWORD RESET:",
            {
                school:
                    school.name,

                schoolId:
                    school._id,

                admin:
                    admin.email
            }
        );


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.json({

            success: true,

            message:
                "School admin password reset successfully. The admin must change the temporary password after login.",

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
                    admin.email,

                mustChangePassword:
                    true

            }

        });


    } catch (err) {

        console.error(
            "[SUPERADMIN] RESET PASSWORD ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to reset school admin password.",

            error:
                err.message

        });

    }

};


// =====================================================
// AUTO EXPIRE SUBSCRIPTIONS
// =====================================================

exports.checkExpiredSubscriptions = async () => {

    try {

        const today =
            new Date();


        await School.updateMany(

            {
                "subscription.endDate":
                    {
                        $lt: today
                    },

                active:
                    true
            },

            {
                $set:
                    {
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
            "[SUPERADMIN] SUBSCRIPTION CHECK ERROR:",
            err
        );

    }

};

