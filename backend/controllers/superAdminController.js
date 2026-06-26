const bcrypt = require("bcryptjs");

const School = require("../models/School");
const User = require("../models/User");

// Generate School Code
function generateSchoolCode(name) {

    const clean = name
        .replace(/[^a-zA-Z ]/g, "")
        .trim()
        .split(" ")
        .map(word => word.substring(0, 5).toUpperCase())
        .join("");

    return clean;
}

exports.createSchool = async (req, res) => {

    try {

        const {
            schoolName,
            adminName,
            adminEmail,
            adminPassword,
            phone
        } = req.body;

        if (
            !schoolName ||
            !adminName ||
            !adminEmail ||
            !adminPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Generate base code
        const baseCode = generateSchoolCode(schoolName);

        let counter = 1;
        let schoolCode;

        while (true) {

            schoolCode =
                baseCode +
                String(counter).padStart(3, "0");

            const exists = await School.findOne({
                code: schoolCode
            });

            if (!exists) break;

            counter++;
        }

        // Create School

        const school = await School.create({

            name: schoolName,

            code: schoolCode,

            slug: schoolName
                .toLowerCase()
                .replace(/\s+/g, "-"),

            phone,

            active: true

        });

        // Hash password

        const hashedPassword =
            await bcrypt.hash(adminPassword, 10);

        // Create Admin

        const admin = await User.create({

            school: school._id,

            name: adminName,

            email: adminEmail,

            password: hashedPassword,

            role: "admin",

            class: "",

            classAssigned: "",

            profile: {}

        });

        res.json({

            success: true,

            school,

            admin: {

                name: admin.name,

                email: admin.email

            }

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
