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

    return letters + numbers;
}


// =====================================================
// GENERATE TEMPORARY PASSWORD
// =====================================================

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
                    Math.random() * chars.length
                )
            );

    }

    return password;
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


        if (
            adminPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Temporary password must be at least 6 characters."

            });

        }


        // ---------------------------------------------
        // CHECK ADMIN EMAIL
        // ---------------------------------------------

        const existingAdmin =
            await User.findOne({
                email: adminEmail
            });


        if (existingAdmin) {

            return res.status(409).json({

                success: false,

                message:
                    "A user with this email already exists."

            });

        }


        // ---------------------------------------------
        // GENERATE UNIQUE SCHOOL CODE
        // ---------------------------------------------

        let schoolCode;

        do {

            schoolCode =
                generateSchoolCode(
                    schoolName
                );

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

                name:
                    schoolName,

                code:
                    schoolCode,

                slug:
                    schoolName
                        .toLowerCase()
                        .replace(
                            /\s+/g,
                            "-"
                        ),

                active:
                    true,

                subscription: {

                    plan:
                        subscriptionType,

                    status:
                        "Active",

                    startDate:
                        startDate,

                    endDate:
                        endDate

                }

            });


        // ---------------------------------------------
        // HASH ADMIN PASSWORD
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

                mustChangePassword:
                    true,

                passwordResetAt:
                    null

            });


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            success:
                true,

            message:
                "School and school admin created successfully.",

            loginCode:
                school.code,

            // IMPORTANT:
            // Returned once so Super Admin can give
            // the temporary password to the admin.

            temporaryPassword:
                adminPassword,

            school:
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

};


// =====================================================
// LIST ALL SCHOOLS WITH SCHOOL ADMIN
// =====================================================

exports.getSchools = async (req, res) => {

    try {

        const schools =
            await School.find()
                .sort({
                    createdAt: -1
                })
                .lean();


        // ---------------------------------------------
        // FIND ADMIN FOR EACH SCHOOL
        // ---------------------------------------------

        const schoolsWithAdmins =
            await Promise.all(

                schools.map(
                    async function (school) {

                        const admin =
                            await User.findOne({

                                school:
                                    school._id,

                                role:
                                    "admin"

                            })
                            .select(
                                "_id name email role mustChangePassword"
                            )
                            .lean();


                        return {

                            ...school,

                            admin:
                                admin || null

                        };

                    }
                )

            );


        return res.json(
            schoolsWithAdmins
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
                "Failed to load schools.",

            error:
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

                success:
                    false,

                message:
                    "School not found."

            });

        }


        school.active =
            !school.active;


        await school.save();


        return res.json({

            success:
                true,

            active:
                school.active

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

};


// =====================================================
// SUPER ADMIN RESET SCHOOL ADMIN PASSWORD
// =====================================================
//
// The Super Admin does NOT enter the new password.
//
// The system generates a temporary password.
//
// The temporary password is returned once.
//
// The school admin must change it after login.
// =====================================================

exports.resetSchoolAdminPassword = async (req, res) => {

    try {

        const schoolId =
            req.params.id;

        const adminId =
            req.params.adminId;


        // ---------------------------------------------
        // FIND SCHOOL
        // ---------------------------------------------

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


        // ---------------------------------------------
        // FIND ADMIN
        // ---------------------------------------------

        const admin =
            await User.findOne({

                _id:
                    adminId,

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
                    "School admin not found."

            });

        }


        // ---------------------------------------------
        // GENERATE TEMPORARY PASSWORD
        // ---------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();


        // ---------------------------------------------
        // HASH TEMPORARY PASSWORD
        // ---------------------------------------------

        admin.password =
            await bcrypt.hash(
                temporaryPassword,
                10
            );


        // ---------------------------------------------
        // FORCE PASSWORD CHANGE
        // ---------------------------------------------

        admin.mustChangePassword =
            true;


        admin.passwordResetAt =
            new Date();


        await admin.save();


        // ---------------------------------------------
        // LOG RESET
        // ---------------------------------------------

        console.log(
            "[SUPERADMIN] SCHOOL ADMIN PASSWORD RESET:",
            {

                school:
                    school.name,

                schoolId:
                    school._id,

                admin:
                    admin.email,

                adminId:
                    admin._id

            }
        );


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.json({

            success:
                true,

            message:
                "School admin password reset successfully. The admin must change the temporary password after login.",

            temporaryPassword:
                temporaryPassword,

            user: {

                id:
                    admin._id,

                name:
                    admin.name,

                email:
                    admin.email,

                role:
                    admin.role,

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

            success:
                false,

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
                        $lt:
                            today
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

