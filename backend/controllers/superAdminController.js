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

exports.createSchool = async (req, res) => {
    try {

        const {
            schoolName,
            adminName,
            adminEmail,
            adminPassword
        } = req.body;

        if (
            !schoolName ||
            !adminName ||
            !adminEmail ||
            !adminPassword
        ) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        // Generate unique school code
        let schoolCode;

        do {
            schoolCode = generateSchoolCode(schoolName);
        } while (await School.findOne({ code: schoolCode }));

        // Create school
        const school = await School.create({

            name: schoolName,

            code: schoolCode,

            slug: schoolName
                .toLowerCase()
                .replace(/\s+/g, "-"),

            active: true

        });

        // Hash password
        const hashedPassword =
            await bcrypt.hash(adminPassword, 10);

        // Create admin
        const admin = await User.create({

            school: school._id,

            name: adminName,

            email: adminEmail,

            password: hashedPassword,

            role: "admin"

        });

        res.status(201).json({

            success: true,

            school,

            admin,

            loginCode: schoolCode

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });

    }
    };
    // LOAD SCHOOLS
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
