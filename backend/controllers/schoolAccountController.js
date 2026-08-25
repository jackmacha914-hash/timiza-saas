const bcrypt = require('bcryptjs');
const User = require('../models/User');


// =====================================================
// COMMON SCHOOL / ROLE FILTER
// =====================================================

function getSchoolId(req) {
    return req.user?.school;
}

function allowedRoles() {
    return ['student', 'teacher'];
}


// =====================================================
// GET SCHOOL ACCOUNTS
// Uses existing User model
// Students + Teachers only
// NO USERNAME
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
                $in: allowedRoles()
            }

        };


        // ---------------------------------------------
        // ROLE FILTER
        // ---------------------------------------------

        if (role) {

            const normalizedRole =
                String(role)
                    .toLowerCase()
                    .trim();

            if (
                allowedRoles().includes(normalizedRole)
            ) {

                filter.role =
                    normalizedRole;

            }

        }


        // ---------------------------------------------
        // STATUS FILTER
        //
        // Existing User records may not have status.
        // Only apply status when explicitly requested.
        // ---------------------------------------------

        if (status) {

            const normalizedStatus =
                String(status)
                    .trim()
                    .toLowerCase();

            if (
                normalizedStatus === 'active'
            ) {

                filter.$or = [
                    {
                        status: 'Active'
                    },
                    {
                        status: 'active'
                    },
                    {
                        status: {
                            $exists: false
                        }
                    }
                ];

            } else if (
                normalizedStatus === 'suspended'
            ) {

                filter.$or = [
                    {
                        status: 'Suspended'
                    },
                    {
                        status: 'suspended'
                    }
                ];

            }

        }


        // ---------------------------------------------
        // SEARCH
        // Name + Email ONLY
        // NO USERNAME
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
            // combine filters safely.
            if (filter.$or) {

                const statusFilter =
                    filter.$or;

                delete filter.$or;

                filter.$and = [

                    {
                        $or: statusFilter
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


        // ---------------------------------------------
        // DEBUG
        // ---------------------------------------------

        console.log(
            '================================='
        );

        console.log(
            '[USER MANAGEMENT] GET USERS'
        );

        console.log(
            '[USER MANAGEMENT] School:',
            schoolId
        );

        console.log(
            '[USER MANAGEMENT] Query:',
            req.query
        );

        console.log(
            '[USER MANAGEMENT] Filter:',
            JSON.stringify(
                filter,
                null,
                2
            )
        );

        console.log(
            '================================='
        );


        // ---------------------------------------------
        // GET EXISTING USERS
        // ---------------------------------------------

        const users =
            await User
                .find(filter)
                .select('-password')
                .sort({
                    createdAt: -1
                })
                .lean();


        // ---------------------------------------------
        // NORMALIZE RESPONSE
        //
        // Your existing User model uses:
        //
        // student:
        //   class
        //   classAssigned
        //
        // teacher:
        //   profile.specialization
        //
        // User Management expects:
        //   studentClass
        //   subject
        //   status
        // ---------------------------------------------

        const accounts =
            users.map(user => {

                const role =
                    String(
                        user.role || ''
                    ).toLowerCase();


                const isSuspended =
                    String(
                        user.status || ''
                    ).toLowerCase()
                    === 'suspended';


                return {

                    _id: user._id,

                    name: user.name || '',

                    email: user.email || '',

                    role: role,

                    studentClass:
                        role === 'student'
                            ? (
                                user.studentClass ||
                                user.class ||
                                user.classAssigned ||
                                ''
                            )
                            : '',

                    subject:
                        role === 'teacher'
                            ? (
                                user.subject ||
                                user.specialization ||
                                user.profile?.specialization ||
                                ''
                            )
                            : '',

                    status:
                        isSuspended
                            ? 'Suspended'
                            : 'Active',

                    school: user.school,

                    createdAt:
                        user.createdAt,

                    updatedAt:
                        user.updatedAt

                };

            });


        console.log(
            `[USER MANAGEMENT] Found ${accounts.length} users`
        );


        console.log(
            '[USER MANAGEMENT] Users:',
            accounts.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentClass:
                    user.studentClass,
                subject:
                    user.subject,
                status:
                    user.status,
                school:
                    user.school
            }))
        );


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.json({

            success: true,

            count:
                accounts.length,

            data:
                accounts

        });


    } catch (err) {

        console.error(
            '[USER MANAGEMENT] GET ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to load school accounts',

            error:
                err.message

        });

    }

};



// =====================================================
// CREATE SCHOOL ACCOUNT
// Uses existing User model
// =====================================================

exports.createSchoolAccount = async (
    req,
    res
) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({

                success: false,

                message:
                    'School not found'

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
            String(role)
                .toLowerCase()
                .trim();


        if (
            !allowedRoles()
                .includes(normalizedRole)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Only students and teachers can be created'

            });

        }


        const normalizedEmail =
            email
                .toLowerCase()
                .trim();


        // ---------------------------------------------
        // CHECK EXISTING USER
        // CURRENT SCHOOL ONLY
        // ---------------------------------------------

        const existing =
            await User.findOne({

                school:
                    schoolId,

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
        // BUILD USER
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
                'Active'

        };


        // ---------------------------------------------
        // STUDENT
        // ---------------------------------------------

        if (
            normalizedRole === 'student'
        ) {

            userData.class =
                studentClass || '';

            userData.classAssigned =
                studentClass || '';

        }


        // ---------------------------------------------
        // TEACHER
        // ---------------------------------------------

        if (
            normalizedRole === 'teacher'
        ) {

            userData.profile = {

                specialization:
                    subject || '',

                class:
                    '',

                subjects:
                    []

            };

        }


        // ---------------------------------------------
        // CREATE
        // ---------------------------------------------

        const account =
            new User(userData);


        await account.save();


        console.log(
            '[USER MANAGEMENT] Created:',
            {
                id:
                    account._id,

                name:
                    account.name,

                email:
                    account.email,

                role:
                    account.role,

                school:
                    account.school
            }
        );


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                'School account created successfully',

            data: {

                _id:
                    account._id,

                name:
                    account.name,

                email:
                    account.email,

                role:
                    account.role,

                studentClass:
                    account.class ||
                    account.classAssigned ||
                    '',

                subject:
                    account.profile?.specialization ||
                    '',

                status:
                    account.status ||
                    'Active',

                school:
                    account.school

            }

        });


    } catch (err) {

        console.error(
            '[USER MANAGEMENT] CREATE ERROR:',
            err
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to create account',

            error:
                err.message

        });

    }

};



// =====================================================
// ACTIVATE
// =====================================================

exports.activateSchoolAccount =
async (
    req,
    res
) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({

                success: false,

                message:
                    'School not found'

            });

        }


        const account =
            await User.findOneAndUpdate(

                {

                    _id:
                        req.params.id,

                    school:
                        schoolId,

                    role: {
                        $in:
                            allowedRoles()
                    }

                },

                {

                    $set: {
                        status:
                            'Active'
                    }

                },

                {

                    new:
                        true

                }

            )
            .select('-password')
            .lean();


        if (!account) {

            return res.status(404).json({

                success: false,

                message:
                    'School account not found'

            });

        }


        return res.json({

            success:
                true,

            message:
                'Account activated',

            data:
                account

        });


    } catch (err) {

        console.error(
            '[USER MANAGEMENT] ACTIVATE ERROR:',
            err
        );

        return res.status(500).json({

            success:
                false,

            message:
                'Failed to activate account',

            error:
                err.message

        });

    }

};



// =====================================================
// SUSPEND
// =====================================================

exports.suspendSchoolAccount =
async (
    req,
    res
) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({

                success:
                    false,

                message:
                    'School not found'

            });

        }


        const account =
            await User.findOneAndUpdate(

                {

                    _id:
                        req.params.id,

                    school:
                        schoolId,

                    role: {
                        $in:
                            allowedRoles()
                    }

                },

                {

                    $set: {
                        status:
                            'Suspended'
                    }

                },

                {

                    new:
                        true

                }

            )
            .select('-password')
            .lean();


        if (!account) {

            return res.status(404).json({

                success:
                    false,

                message:
                    'School account not found'

            });

        }


        return res.json({

            success:
                true,

            message:
                'Account suspended',

            data:
                account

        });


    } catch (err) {

        console.error(
            '[USER MANAGEMENT] SUSPEND ERROR:',
            err
        );

        return res.status(500).json({

            success:
                false,

            message:
                'Failed to suspend account',

            error:
                err.message

        });

    }

};



// =====================================================
// DELETE
// =====================================================

exports.deleteSchoolAccount =
async (
    req,
    res
) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(403).json({

                success:
                    false,

                message:
                    'School not found'

            });

        }


        const account =
            await User.findOneAndDelete({

                _id:
                    req.params.id,

                school:
                    schoolId,

                role: {
                    $in:
                        allowedRoles()
                }

            });


        if (!account) {

            return res.status(404).json({

                success:
                    false,

                message:
                    'School account not found'

            });

        }


        return res.json({

            success:
                true,

            message:
                'Account deleted successfully'

        });


    } catch (err) {

        console.error(
            '[USER MANAGEMENT] DELETE ERROR:',
            err
        );

        return res.status(500).json({

            success:
                false,

            message:
                'Failed to delete account',

            error:
                err.message

        });

    }

};
