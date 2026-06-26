const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

// User Registration with Validation
exports.registerUser = [
check('name').notEmpty().withMessage('Name is required'),
check('email').isEmail().withMessage('Invalid email'),
check('password')
.isLength({ min: 6 })
.withMessage('Password must be at least 6 characters'),


async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    console.log(
        'Registration request body:',
        JSON.stringify(req.body, null, 2)
    );

    const {
        name,
        email,
        password,
        role = 'student',
        profile = {},
        schoolCode
    } = req.body;

    try {
        // Validate school
        const school = await School.findOne({
            code: schoolCode,
            active: true
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'Invalid school code'
            });
        }

        // Check if user already exists within this school
        let user = await User.findOne({
            email,
            school: school._id
        });

        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate class for students
        if (role === 'student' && !req.body.class) {
            return res.status(400).json({
                success: false,
                message:
                    'Class is required for student registration'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare user data
        const userData = {
            school: school._id,
            name,
            email,
            password: hashedPassword,
            role,
            profile: { ...profile }
        };

        // Handle class assignment
        if (req.body.class) {
            const classValue = req.body.class.trim();

            console.log('Processing class:', classValue);

            if (
                !/^(Grade\s\d{1,2}|Form\s[1-4]|Pre-Primary 1 \(PP1\)|Pre-Primary 2 \(PP2\))$/i.test(
                    classValue
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid class format. Please use format 'Grade X', 'Form X', 'PP1' or 'PP2'"
                });
            }

            const formattedClass = classValue
                .toLowerCase()
                .split(' ')
                .map(
                    word =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1)
                )
                .join(' ');

            userData.class = formattedClass;
            userData.classAssigned = formattedClass;
            userData.profile.class = formattedClass;

            console.log(
                'Formatted class:',
                formattedClass
            );
        }

        console.log(
            'Creating user with data:',
            JSON.stringify(
                {
                    school: school.name,
                    name,
                    email,
                    role,
                    class: userData.class,
                    profileClass:
                        userData.profile?.class
                },
                null,
                2
            )
        );

        const newUser = new User(userData);

        await newUser.save();

        const payload = {
            id: newUser._id,
            role: newUser.role,
            school: newUser.school,
            class: newUser.class
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            role: newUser.role,
            class: newUser.class,
            school: school.name
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            msg: 'Server error'
        });
    }
}


];


// User Login
exports.loginUser = async (req, res) => {
    console.log('=== Login Request ===');
    console.log(
        'Request body:',
        JSON.stringify(req.body, null, 2)
    );

    const { email, password, schoolCode } = req.body;

    if (!email || !password || !schoolCode) {
        return res.status(400).json({
            success: false,
            msg: 'Email, password and school code are required'
        });
    }

    try {
        console.log('=== LOGIN DEBUG ===');
console.log('Received schoolCode:', schoolCode);
        const schools = await School.find({});
console.log('Schools in database:', schools);

const allSchools = await School.find({});
console.log(
    'Schools in database:',
    allSchools.map(s => ({
        name: s.name,
        code: s.code,
        active: s.active
    }))
);

const school = await School.findOne({
    code: schoolCode,
    active: true
});

console.log('Matched school:', school);

        if (!school) {
            return res.status(404).json({
                success: false,
                msg: 'Invalid school code'
            });
        }

        console.log("School ID:", school._id);

const users = await User.find({ school: school._id });

console.log(
    "Users in this school:",
    users.map(u => ({
        email: u.email,
        role: u.role
    }))
);

const user = await User.findOne({
    school: school._id,
    email: {
        $regex: new RegExp("^" + email + "$", "i")
    }
});

console.log("Matched user:", user);

        if (!user) {
            return res.status(401).json({
                success: false,
                msg: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );
        console.log("Password match:", isMatch);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                msg: 'Invalid email or password'
            });
        }

        const payload = {
            id: user._id,
            role: user.role,
            school: user.school
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            school: user.school,
            class: user.class
        };

        res.json({
            success: true,
            msg: 'Login successful',
            token,
            role: user.role,
            user: userData
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            msg: 'Server error'
        });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                msg: 'User not found'
            });
        }

        res.json(user);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            msg: 'Server error'
        });
    }
};
