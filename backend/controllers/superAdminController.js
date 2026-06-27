const School = require("../models/School");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

function generateSchoolCode(name) {
    const letters = name
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase()
        .substring(0, 4);

    const numbers = Math.floor(100 + Math.random() * 900);

    return `${letters}${numbers}`;
}

// ========================================
// CREATE SCHOOL
// ========================================

exports.createSchool = async (req, res) => {

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
            !adminEmail ||
            !adminPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        let schoolCode;

        do {

            schoolCode = generateSchoolCode(schoolName);

        } while (
            await School.findOne({ code: schoolCode })
        );

        const startDate = new Date();
        const endDate = new Date();

        switch (subscriptionType) {

            case "Basic":
                endDate.setMonth(endDate.getMonth() + 12);
                break;

            case "Premium":
                endDate.setMonth(endDate.getMonth() + 12);
                break;

            case "Enterprise":
                endDate.setMonth(endDate.getMonth() + 12);
                break;

            default:
                // Trial
                endDate.setDate(endDate.getDate() + 30);

        }

        const school = await School.create({

            name: schoolName,

            code: schoolCode,

            slug: schoolName
                .toLowerCase()
                .replace(/\s+/g, "-"),

            subscriptionType,

            subscriptionStart: startDate,

            subscriptionEnd: endDate,

            active: true

        });

        const hashedPassword =
            await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({

            school: school._id,

            name: adminName,

            email: adminEmail,

            password: hashedPassword,

            role: "admin"

        });

        res.status(201).json({

            success: true,

            loginCode: school.code,

            school,

            admin

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};


// ========================================
// LIST ALL SCHOOLS
// ========================================

exports.getSchools = async (req, res) => {

    try {

        const schools = await School.find()
            .sort({ createdAt: -1 });

        res.json(schools);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};


// ========================================
// SUSPEND / ACTIVATE
// ========================================

exports.toggleSchoolStatus = async (req, res) => {

    try {

        const school =
            await School.findById(req.params.id);

        if (!school) {

            return res.status(404).json({

                message: "School not found"

            });

        }

        school.active = !school.active;

        await school.save();

        res.json({

            success: true,

            active: school.active

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};


// ========================================
// AUTO EXPIRE SUBSCRIPTIONS
// ========================================

exports.checkExpiredSubscriptions = async () => {

    const today = new Date();

    await School.updateMany(

        {
            subscriptionEnd: { $lt: today },
            active: true
        },

        {
            $set: {
                active: false
            }
        }

    );

};
