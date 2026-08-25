const bcrypt = require('bcryptjs');
const SchoolAccount = require('../models/SchoolAccount');


// =====================================================
// GET SCHOOL ACCOUNTS
// Students + Teachers only
// =====================================================
exports.getSchoolAccounts = async (req, res) => {
    try {

        const schoolId = req.user?.school;

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
                String(role).toLowerCase().trim();

            if (['student', 'teacher'].includes(normalizedRole)) {
                filter.role = normalizedRole;
            }
        }

        // ---------------------------------------------
        // STATUS FILTER
        // ---------------------------------------------
        if (status) {
            filter.status =
                String(status).trim();
        }

        // ---------------------------------------------
        // SEARCH
        // No username
        // ---------------------------------------------
        if (search?.trim()) {

            const searchValue = search.trim();

            filter.$or = [
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
        }

        const accounts =
            await SchoolAccount
                .find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .lean();

        return res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] GET ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to load school accounts',
            error: err.message
        });
    }
};


// =====================================================
// CREATE SCHOOL ACCOUNT
// Students + Teachers only
// =====================================================
exports.createSchoolAccount = async (req, res) => {
    try {

        const schoolId = req.user?.school;

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
            String(role).toLowerCase().trim();

        // ---------------------------------------------
        // ONLY STUDENTS AND TEACHERS
        // ---------------------------------------------
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
            email.toLowerCase().trim();

        // ---------------------------------------------
        // CHECK EXISTING ACCOUNT
        // ONLY INSIDE CURRENT SCHOOL
        // ---------------------------------------------
        const existing =
            await SchoolAccount.findOne({
                school: schoolId,
                email: normalizedEmail
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
            await bcrypt.hash(password, 10);

        // ---------------------------------------------
        // CREATE ACCOUNT
        // ---------------------------------------------
        const account =
            new SchoolAccount({

                school: schoolId,

                name: name.trim(),

                email: normalizedEmail,

                password: hashedPassword,

                role: normalizedRole,

                subject:
                    normalizedRole === 'teacher'
                        ? subject || ''
                        : '',

                studentClass:
                    normalizedRole === 'student'
                        ? studentClass || ''
                        : '',

                // New accounts are active by default
                status: 'Active'
            });

        await account.save();

        console.log(
            '[SCHOOL ACCOUNTS] Created:',
            {
                id: account._id,
                name: account.name,
                email: account.email,
                role: account.role,
                school: account.school,
                status: account.status
            }
        );

        return res.status(201).json({

            success: true,

            message:
                'School account created successfully',

            data: {
                _id: account._id,
                name: account.name,
                email: account.email,
                role: account.role,
                subject: account.subject,
                studentClass: account.studentClass,
                status: account.status,
                school: account.school
            }

        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] CREATE ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to create account',
            error: err.message
        });
    }
};


// =====================================================
// ACTIVATE SCHOOL ACCOUNT
// =====================================================
exports.activateSchoolAccount = async (req, res) => {

    try {

        const schoolId = req.user?.school;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: 'School not found'
            });
        }

        const account =
            await SchoolAccount.findOneAndUpdate(

                {
                    _id: req.params.id,

                    school: schoolId,

                    role: {
                        $in: ['student', 'teacher']
                    }
                },

                {
                    $set: {
                        status: 'Active'
                    }
                },

                {
                    new: true
                }
            )
            .select('-password')
            .lean();

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'School account not found'
            });
        }

        console.log(
            '[SCHOOL ACCOUNTS] Activated:',
            account._id
        );

        return res.json({
            success: true,
            message: 'Account activated',
            data: account
        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] ACTIVATE ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to activate account',
            error: err.message
        });
    }
};


// =====================================================
// SUSPEND SCHOOL ACCOUNT
// =====================================================
exports.suspendSchoolAccount = async (req, res) => {

    try {

        const schoolId = req.user?.school;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: 'School not found'
            });
        }

        const account =
            await SchoolAccount.findOneAndUpdate(

                {
                    _id: req.params.id,

                    school: schoolId,

                    role: {
                        $in: ['student', 'teacher']
                    }
                },

                {
                    $set: {
                        status: 'Suspended'
                    }
                },

                {
                    new: true
                }
            )
            .select('-password')
            .lean();

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'School account not found'
            });
        }

        console.log(
            '[SCHOOL ACCOUNTS] Suspended:',
            account._id
        );

        return res.json({
            success: true,
            message: 'Account suspended',
            data: account
        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] SUSPEND ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to suspend account',
            error: err.message
        });
    }
};


// =====================================================
// DELETE SCHOOL ACCOUNT
// Students + Teachers only
// =====================================================
exports.deleteSchoolAccount = async (req, res) => {

    try {

        const schoolId = req.user?.school;

        if (!schoolId) {
            return res.status(403).json({
                success: false,
                message: 'School not found'
            });
        }

        const account =
            await SchoolAccount.findOneAndDelete({

                _id: req.params.id,

                school: schoolId,

                role: {
                    $in: ['student', 'teacher']
                }

            });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'School account not found'
            });
        }

        console.log(
            '[SCHOOL ACCOUNTS] Deleted:',
            account._id
        );

        return res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] DELETE ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: err.message
        });
    }
};
