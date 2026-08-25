const bcrypt = require('bcryptjs');
const User = require('../models/User');


// =====================================================
// HELPERS
// =====================================================

function getSchoolId(req) {
    return req.user?.school || req.user?.schoolId || null;
}

function normalizeRole(role) {
    return String(role || '').toLowerCase().trim();
}

function normalizeStatus(user) {
    // Existing User model does not appear to have
    // a status field, so treat users as Active unless
    // explicitly marked suspended/inactive.
    const value = String(user.status || '').toLowerCase().trim();

    if (
        value === 'suspended' ||
        value === 'inactive' ||
        value === 'disabled'
    ) {
        return 'Suspended';
    }

    return 'Active';
}

function serializeUser(user) {
    const role = normalizeRole(user.role);

    return {
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        role,

        // Student
        studentClass:
            user.studentClass ||
            user.classAssigned ||
            user.class ||
            '',

        // Teacher
        subject:
            user.subject ||
            user.profile?.specialization ||
            user.specialization ||
            '',

        status: normalizeStatus(user),

        school: user.school,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}


// =====================================================
// GET SCHOOL ACCOUNTS
// Existing User model
// Students + Teachers only
// =====================================================

exports.getSchoolAccounts = async (req, res) => {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(403).json({
                success: false,
                message: 'School not found'
            });

        }

        const {
            search,
            role,
            status
        } = req.query;


        // ---------------------------------------------
        // BASE FILTER
        // ---------------------------------------------

        const filter = {
            school: schoolId,

            role: {
                $in: ['student', 'teacher']
            }
        };


        // ---------------------------------------------
        // ROLE FILTER
        // ---------------------------------------------

        if (role) {

            const normalizedRole =
                normalizeRole(role);

            if (
                ['student', 'teacher']
                    .includes(normalizedRole)
            ) {

                filter.role =
                    normalizedRole;

            }
        }


        // ---------------------------------------------
        // STATUS FILTER
        // ---------------------------------------------

        if (status) {

            const normalizedStatus =
                String(status)
                    .toLowerCase()
                    .trim();

            if (
                normalizedStatus === 'active'
            ) {

                filter.$or = [
                    {
                        status: 'Active'
                    },
                    {
                        status: {
                            $exists: false
                        }
                    },
                    {
                        status: null
                    }
                ];

            } else if (
                normalizedStatus === 'suspended'
            ) {

                filter.status = {
                    $in: [
                        'Suspended',
                        'suspended',
                        'Inactive',
                        'inactive'
                    ]
                };
            }
        }


        // ---------------------------------------------
        // SEARCH
        // ---------------------------------------------

        if (search?.trim()) {

            const searchValue =
                search.trim();

            const searchFilter = [
                {
                    name: {
                        $regex: searchValue,
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: searchValue,
                        $options: 'i'
                    }
                }
            ];

            // If status already created $or,
            // combine everything safely.
            if (filter.$or) {

                const existingStatusFilter =
                    filter.$or;

                delete filter.$or;

                filter.$and = [
                    {
                        $or: existingStatusFilter
                    },
                    {
                        $or: searchFilter
                    }
                ];

            } else {

                filter.$or =
                    searchFilter;

            }
        }


        console.log(
            '================================='
        );

        console.log(
            '[MANAGEMENT USERS] GET'
        );

        console.log(
            '[MANAGEMENT USERS] School:',
            schoolId
        );

        console.log(
            '[MANAGEMENT USERS] Query:',
            req.query
        );

        console.log(
            '[MANAGEMENT USERS] Filter:',
            JSON.stringify(filter)
        );


        // ---------------------------------------------
        // QUERY EXISTING USER COLLECTION
        // ---------------------------------------------

        const users =
            await User
                .find(filter)
                .select('-password')
                .sort({
                    createdAt: -1
                })
                .lean();


        const accounts =
            users.map(
                serializeUser
            );


        console.log(
            `[MANAGEMENT USERS] Found ${accounts.length}`
        );


        return res.json({

            success: true,

            count:
                accounts.length,

            data:
                accounts

        });

    } catch (err) {

        console.error(
            '[MANAGEMENT USERS] GET ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to load school users',

            error:
                err.message

        });
    }
};


// =====================================================
// CREATE SCHOOL USER
// Existing User model
// =====================================================

exports.createSchoolAccount = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({
                success: false,
                message: 'School not found'
            });

        }


        const {
            name,
            email,
            password,
            role,
            subject,
            studentClass
        } = req.body;


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Name, email, password and role are required'

            });

        }


        const normalizedRole =
            normalizeRole(role);


        if (
            !['student', 'teacher']
                .includes(normalizedRole)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Only students and teachers can be created'

            });

        }


        const normalizedEmail =
            String(email)
                .toLowerCase()
                .trim();


        // ---------------------------------------------
        // CHECK EXISTING USER
        // ---------------------------------------------

        const existing =
            await User.findOne({

                school: schoolId,

                email:
                    normalizedEmail

            });


        if (existing) {

            return res.status(400).json({

                success: false,

                message:
                    'This email already exists in your school'

            });

        }


        // ---------------------------------------------
        // HASH PASSWORD
        // ---------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ---------------------------------------------
        // CREATE USER
        // ---------------------------------------------

        const userData = {

            school:
                schoolId,

            name:
                name.trim(),

            email:
                normalizedEmail,

            password:
                hashedPassword,

            role:
                normalizedRole,

            status:
                'Active',

            class:
                normalizedRole === 'student'
                    ? (studentClass || '')
                    : '',

            classAssigned:
                normalizedRole === 'student'
                    ? (studentClass || '')
                    : '',

            profile: {

                health: {
                    allergies: [],
                    medicalConditions: [],
                    medications: []
                },

                class:
                    normalizedRole === 'student'
                        ? (studentClass || '')
                        : '',

                subjects:
                    normalizedRole === 'teacher'
                        ? (
                            subject
                                ? [subject]
                                : []
                        )
                        : []
            }

        };


        const user =
            new User(userData);


        await user.save();


        console.log(
            '[MANAGEMENT USERS] CREATED:',
            {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                school: user.school
            }
        );


        return res.status(201).json({

            success: true,

            message:
                'User created successfully',

            data:
                serializeUser(
                    user.toObject()
                )

        });

    } catch (err) {

        console.error(
            '[MANAGEMENT USERS] CREATE ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to create user',

            error:
                err.message

        });

    }
};


// =====================================================
// ACTIVATE USER
// =====================================================

exports.activateSchoolAccount =
async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({
                success: false,
                message: 'School not found'
            });

        }


        const user =
            await User.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    school:
                        schoolId,

                    role: {
                        $in: [
                            'student',
                            'teacher'
                        ]
                    }
                },

                {
                    $set: {
                        status:
                            'Active'
                    }
                },

                {
                    new: true
                }

            )
            .select('-password')
            .lean();


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    'User not found'

            });

        }


        return res.json({

            success: true,

            message:
                'Account activated',

            data:
                serializeUser(user)

        });

    } catch (err) {

        console.error(
            '[MANAGEMENT USERS] ACTIVATE ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to activate account',

            error:
                err.message

        });

    }
};


// =====================================================
// SUSPEND USER
// =====================================================

exports.suspendSchoolAccount =
async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({
                success: false,
                message: 'School not found'
            });

        }


        const user =
            await User.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    school:
                        schoolId,

                    role: {
                        $in: [
                            'student',
                            'teacher'
                        ]
                    }
                },

                {
                    $set: {
                        status:
                            'Suspended'
                    }
                },

                {
                    new: true
                }

            )
            .select('-password')
            .lean();


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    'User not found'

            });

        }


        return res.json({

            success: true,

            message:
                'Account suspended',

            data:
                serializeUser(user)

        });

    } catch (err) {

        console.error(
            '[MANAGEMENT USERS] SUSPEND ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to suspend account',

            error:
                err.message

        });

    }
};


// =====================================================
// DELETE USER
// =====================================================

exports.deleteSchoolAccount =
async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({
                success: false,
                message: 'School not found'
            });

        }


        const user =
            await User.findOneAndDelete({

                _id:
                    req.params.id,

                school:
                    schoolId,

                role: {
                    $in: [
                        'student',
                        'teacher'
                    ]
                }

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    'User not found'

            });

        }


        console.log(
            '[MANAGEMENT USERS] DELETED:',
            user._id
        );


        return res.json({

            success: true,

            message:
                'User deleted successfully'

        });

    } catch (err) {

        console.error(
            '[MANAGEMENT USERS] DELETE ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to delete user',

            error:
                err.message

        });

    }
};
