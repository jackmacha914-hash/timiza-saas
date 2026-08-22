const mongoose = require('mongoose');
const Discipline = require('../models/Discipline');
const User = require('../models/User');


// =====================================================
// HELPERS
// =====================================================

const getSchoolId = (req) => {
    return (
        req.user?.school ||
        req.school?._id ||
        req.school
    );
};


const getUserId = (req) => {
    return (
        req.user?._id ||
        req.user?.id ||
        req.user?.userId
    );
};


const getUserRole = (req) => {
    return String(
        req.user?.role || ''
    )
        .toLowerCase()
        .trim();
};


// =====================================================
// CREATE DISCIPLINE CASE
// =====================================================

const createDisciplineCase = async (req, res) => {

    try {

        const {
            student,
            admissionNumber,
            className,
            category,
            severity,
            description,
            incidentDate,
            actionTaken,
            status,
            resolutionNotes
        } = req.body;


        console.log('======================================');
        console.log('[DISCIPLINE CREATE]');
        console.log('User:', {
            id: getUserId(req),
            role: getUserRole(req),
            school: getSchoolId(req),
            name: req.user?.name,
            email: req.user?.email
        });
        console.log('Body:', req.body);
        console.log('======================================');


        // =================================================
        // AUTHENTICATED USER
        // =================================================

        const userId = getUserId(req);
        const role = getUserRole(req);
        const schoolId = getSchoolId(req);


        if (!userId) {

            return res.status(401).json({
                success: false,
                message: 'Authenticated user could not be determined.'
            });

        }


        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }


        // =================================================
        // ONLY ADMIN + TEACHER
        // =================================================

        if (!['admin', 'teacher'].includes(role)) {

            return res.status(403).json({
                success: false,
                message:
                    'Only administrators and teachers can report discipline cases.'
            });

        }


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (!student) {

            return res.status(400).json({
                success: false,
                message: 'Student is required.'
            });

        }


        if (!category) {

            return res.status(400).json({
                success: false,
                message: 'Discipline category is required.'
            });

        }


        if (!description) {

            return res.status(400).json({
                success: false,
                message: 'Incident description is required.'
            });

        }


        if (!incidentDate) {

            return res.status(400).json({
                success: false,
                message: 'Incident date is required.'
            });

        }


        // =================================================
        // VERIFY REPORTING USER
        // =================================================

        const reportingUser = await User.findOne({
            _id: userId,
            school: schoolId
        }).select('_id name fullName email role');


        if (!reportingUser) {

            return res.status(403).json({
                success: false,
                message:
                    'Authenticated user does not belong to this school.'
            });

        }


        // =================================================
        // FIND STUDENT
        //
        // Accept:
        // 1. MongoDB ObjectId
        // 2. Admission number
        // 3. Student name
        // =================================================

        let studentUser = null;


        // -----------------------------------------------
        // CASE 1: MongoDB ID
        // -----------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(student)
        ) {

            studentUser =
                await User.findOne({
                    _id: student,
                    school: schoolId
                });

        }


        // -----------------------------------------------
        // CASE 2: Admission Number
        // -----------------------------------------------

        if (
            !studentUser &&
            admissionNumber
        ) {

            studentUser =
                await User.findOne({
                    school: schoolId,
                    admissionNumber:
                        admissionNumber.trim()
                });

        }


        // -----------------------------------------------
        // CASE 3: Student Name
        // -----------------------------------------------

        if (!studentUser) {

            const searchName =
                String(student).trim();


            studentUser =
                await User.findOne({
                    school: schoolId,
                    $or: [
                        {
                            name: searchName
                        },
                        {
                            fullName: searchName
                        }
                    ]
                });

        }


        // -----------------------------------------------
        // STUDENT NOT FOUND
        // -----------------------------------------------

        if (!studentUser) {

            return res.status(404).json({

                success: false,

                message:
                    'Student not found in this school. Please enter the student ID, admission number, or exact student name.'

            });

        }


        console.log(
            '[DISCIPLINE] Student resolved:',
            {
                id: studentUser._id,
                name:
                    studentUser.name ||
                    studentUser.fullName,
                admissionNumber:
                    studentUser.admissionNumber
            }
        );


        // =================================================
        // CREATE DISCIPLINE CASE
        // =================================================

        const discipline =
            await Discipline.create({

                school:
                    schoolId,

                student:
                    studentUser._id,

                admissionNumber:
                    admissionNumber ||
                    studentUser.admissionNumber ||
                    '',

                className:
                    className ||
                    studentUser.class ||
                    studentUser.classAssigned ||
                    '',

                category,

                severity:
                    severity || 'low',

                description:
                    String(description).trim(),

                incidentDate:
                    new Date(incidentDate),


                // =================================================
                // IMPORTANT
                //
                // Store ACTUAL USER ID.
                //
                // Do NOT store name/email here.
                // =================================================

                reportedBy:
                    reportingUser._id,


                // Keep role of person reporting
                reportedByRole:
                    role,


                actionTaken:
                    actionTaken || '',

                status:
                    status || 'reported',

                resolutionNotes:
                    resolutionNotes || ''

            });


        // =================================================
        // POPULATE RESPONSE
        // =================================================

        const populated =
            await Discipline.findById(
                discipline._id
            )
            .populate(
                'student',
                'name fullName email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name fullName email role'
            );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                'Discipline case recorded successfully',

            discipline:
                populated

        });


    } catch (error) {

        console.error(
            '======================================'
        );

        console.error(
            '[DISCIPLINE CREATE ERROR]'
        );

        console.error(error);

        console.error(
            '======================================'
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to create discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// GET ALL DISCIPLINE CASES
// =====================================================
//
// ADMIN:
//     All cases in their school
//
// TEACHER:
//     ONLY cases they personally reported
//
// =====================================================

const getDisciplineCases = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);

        const userId =
            getUserId(req);

        const role =
            getUserRole(req);


        // =================================================
        // AUTH CHECK
        // =================================================

        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }


        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    'Authenticated user could not be determined.'
            });

        }


        // =================================================
        // ROLE CHECK
        // =================================================

        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'You are not authorized to view discipline cases.'

            });

        }


        // =================================================
        // BASE FILTER
        // =================================================

        const filter = {

            school:
                schoolId

        };


        // =================================================
        // TEACHER SECURITY
        //
        // A teacher can ONLY see cases where
        // reportedBy === their actual User ID.
        // =================================================

        if (role === 'teacher') {

            filter.reportedBy =
                userId;

        }


        console.log(
            '[DISCIPLINE GET] User:',
            {
                id: userId,
                role,
                school: schoolId
            }
        );


        console.log(
            '[DISCIPLINE GET] SECURITY FILTER:',
            filter
        );


        // =================================================
        // FETCH
        // =================================================

        const cases =
            await Discipline.find(filter)
                .populate(
                    'student',
                    'name fullName email admissionNumber class classAssigned'
                )
                .populate(
                    'reportedBy',
                    'name fullName email role'
                )
                .sort({
                    createdAt: -1
                });


        return res.json({

            success: true,

            discipline:
                cases,

            count:
                cases.length,

            access:
                role === 'admin'
                    ? 'all_cases'
                    : 'own_reports'

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load discipline records',

            error:
                error.message

        });

    }

};


// =====================================================
// GET SINGLE CASE
// =====================================================
//
// ADMIN:
//     Any case in school
//
// TEACHER:
//     Only their own case
//
// =====================================================

const getDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);

        const userId =
            getUserId(req);

        const role =
            getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({

                success: false,

                message:
                    'Authentication information is incomplete.'

            });

        }


        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'You are not authorized to view discipline cases.'

            });

        }


        // =================================================
        // SECURITY FILTER
        // =================================================

        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        // Teacher can only access own case
        if (role === 'teacher') {

            filter.reportedBy =
                userId;

        }


        console.log(
            '[DISCIPLINE GET ONE] Filter:',
            filter
        );


        // =================================================
        // FIND
        // =================================================

        const discipline =
            await Discipline.findOne(
                filter
            )
            .populate(
                'student',
                'name fullName email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name fullName email role'
            );


        if (!discipline) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to view it.'

            });

        }


        return res.json({

            success: true,

            discipline

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET ONE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// UPDATE CASE
// =====================================================
//
// ADMIN:
//     Can update any case
//
// TEACHER:
//     Can update only cases they reported
//
// =====================================================

const updateDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);

        const userId =
            getUserId(req);

        const role =
            getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({

                success: false,

                message:
                    'Authentication information is incomplete.'

            });

        }


        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'You are not authorized to update discipline cases.'

            });

        }


        // =================================================
        // ALLOWED FIELDS
        // =================================================

        const allowedFields = [

            'category',
            'severity',
            'description',
            'incidentDate',
            'actionTaken',
            'status',
            'resolutionNotes'

        ];


        const updates = {};


        allowedFields.forEach(field => {

            if (
                req.body[field] !== undefined
            ) {

                updates[field] =
                    req.body[field];

            }

        });


        // =================================================
        // RESOLUTION DATE
        // =================================================

        if (
            updates.status === 'resolved'
        ) {

            updates.resolvedAt =
                new Date();

        }


        if (
            updates.status &&
            updates.status !== 'resolved'
        ) {

            updates.resolvedAt =
                null;

        }


        // =================================================
        // SECURITY FILTER
        // =================================================

        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        // Teacher can only update own case
        if (role === 'teacher') {

            filter.reportedBy =
                userId;

        }


        console.log(
            '[DISCIPLINE UPDATE] Filter:',
            filter
        );


        // =================================================
        // UPDATE
        // =================================================

        const discipline =
            await Discipline.findOneAndUpdate(

                filter,

                updates,

                {
                    new: true,
                    runValidators: true
                }

            )
            .populate(
                'student',
                'name fullName email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name fullName email role'
            );


        if (!discipline) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to update it.'

            });

        }


        return res.json({

            success: true,

            message:
                'Discipline case updated successfully',

            discipline

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE UPDATE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to update discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// DELETE CASE
// =====================================================
//
// ADMIN:
//     Can delete any case
//
// TEACHER:
//     Can delete only cases they reported
//
// =====================================================

const deleteDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);

        const userId =
            getUserId(req);

        const role =
            getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({

                success: false,

                message:
                    'Authentication information is incomplete.'

            });

        }


        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'You are not authorized to delete discipline cases.'

            });

        }


        // =================================================
        // SECURITY FILTER
        // =================================================

        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        // Teacher can only delete own case
        if (role === 'teacher') {

            filter.reportedBy =
                userId;

        }


        console.log(
            '[DISCIPLINE DELETE] Filter:',
            filter
        );


        // =================================================
        // DELETE
        // =================================================

        const discipline =
            await Discipline.findOneAndDelete(
                filter
            );


        if (!discipline) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to delete it.'

            });

        }


        return res.json({

            success: true,

            message:
                'Discipline case deleted successfully'

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE DELETE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to delete discipline case',

            error:
                error.message

        });

    }

};

// =====================================================
// GET MY DISCIPLINE CASES
// Student can only see their own discipline records
// =====================================================

const getMyDisciplineCases = async (req, res) => {

    try {

        const studentId = getUserId(req);
        const schoolId = getSchoolId(req);
        const role = getUserRole(req);

        // -----------------------------------------------
        // AUTH CHECK
        // -----------------------------------------------

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message: 'Authenticated student could not be determined.'
            });

        }

        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }

        // -----------------------------------------------
        // STUDENT ONLY
        // -----------------------------------------------

        if (role !== 'student') {

            return res.status(403).json({
                success: false,
                message: 'Only students can access their discipline records.'
            });

        }

        // -----------------------------------------------
        // FIND ONLY THIS STUDENT'S CASES
        // -----------------------------------------------

        const cases = await Discipline.find({
            school: schoolId,
            student: studentId
        })
        .populate(
            'reportedBy',
            'name fullName username email role'
        )
        .sort({
            incidentDate: -1,
            createdAt: -1
        });

        // -----------------------------------------------
        // RESPONSE
        // -----------------------------------------------

        return res.json({

            success: true,

            discipline: cases,

            count: cases.length

        });

    } catch (error) {

        console.error(
            '[STUDENT DISCIPLINE GET]',
            error
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to load your discipline records',

            error: error.message

        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createDisciplineCase,

    getDisciplineCases,

    getDisciplineCase,

    updateDisciplineCase,

    deleteDisciplineCase,

     getMyDisciplineCases

};
