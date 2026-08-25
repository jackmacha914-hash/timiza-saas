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
            school: schoolId
        };

        if (role) {
            filter.role =
                String(role).toLowerCase().trim();
        } else {
            filter.role = {
                $in: ['student', 'teacher']
            };
        }

        if (status) {
            filter.status = status;
        }

        if (search?.trim()) {

            filter.$or = [
                {
                    name: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                },
                {
                    username: {
                        $regex: search.trim(),
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

        res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });

    } catch (err) {

        console.error(
            '[SCHOOL ACCOUNTS] GET ERROR:',
            err
        );

        res.status(500).json({
            success: false,
            message: 'Failed to load school accounts',
            error: err.message
        });
    }
};


// =====================================================
// CREATE SCHOOL ACCOUNT
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
            username,
            password,
            role,
            subject,
            studentClass
        } = req.body;

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

        const existing =
            await SchoolAccount.findOne({
                school: schoolId,
                email:
                    email.toLowerCase().trim()
            });

        if (existing) {
            return res.status(400).json({
                success: false,
                message:
                    'This email already exists in your school'
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const account =
            new SchoolAccount({

                school: schoolId,

                name: name.trim(),

                email:
                    email.toLowerCase().trim(),

                username:
                    username?.trim(),

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

                status: 'Active'
            });

        await account.save();

        res.status(201).json({

            success: true,

            message:
                'School account created successfully',

            data: {
                _id: account._id,
                name: account.name,
                email: account.email,
                username: account.username,
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

        res.status(500).json({
            success: false,
            message: 'Failed to create account',
            error: err.message
        });
    }
};


// =====================================================
// ACTIVATE
// =====================================================
exports.activateSchoolAccount = async (req, res) => {

    try {

        const account =
            await SchoolAccount.findOneAndUpdate(

                {
                    _id: req.params.id,
                    school: req.user.school,
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
            ).select('-password');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'School account not found'
            });
        }

        res.json({
            success: true,
            message: 'Account activated',
            data: account
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: 'Failed to activate account',
            error: err.message
        });
    }
};


// =====================================================
// SUSPEND
// =====================================================
exports.suspendSchoolAccount = async (req, res) => {

    try {

        const account =
            await SchoolAccount.findOneAndUpdate(

                {
                    _id: req.params.id,
                    school: req.user.school,
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
            ).select('-password');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'School account not found'
            });
        }

        res.json({
            success: true,
            message: 'Account suspended',
            data: account
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: 'Failed to suspend account',
            error: err.message
        });
    }
};


// =====================================================
// DELETE
// =====================================================
exports.deleteSchoolAccount = async (req, res) => {

    try {

        const account =
            await SchoolAccount.findOneAndDelete({

                _id: req.params.id,

                school: req.user.school,

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

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: err.message
        });
    }
};
