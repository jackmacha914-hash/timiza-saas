const mongoose = require('mongoose');
const Discipline = require('../models/Discipline');
const User = require('../models/User');


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
            id: req.user?._id || req.user?.id,
            role: req.user?.role,
            school: req.user?.school
        });
        console.log('Body:', req.body);
        console.log('======================================');


        // =================================================
        // SCHOOL
        // =================================================

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


        if (!schoolId) {

            return res.status(400).json({
                message: 'School could not be determined.'
            });

        }


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (!student) {

            return res.status(400).json({
                message: 'Student is required.'
            });

        }


        if (!category) {

            return res.status(400).json({
                message: 'Discipline category is required.'
            });

        }


        if (!description) {

            return res.status(400).json({
                message: 'Incident description is required.'
            });

        }


        if (!incidentDate) {

            return res.status(400).json({
                message: 'Incident date is required.'
            });

        }


        // =================================================
        // VALIDATE STUDENT ID
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(student)
        ) {

            return res.status(400).json({

                message:
                    'Invalid student ID.'

            });

        }


        // =================================================
        // FIND STUDENT
        // =================================================

        const studentUser =
            await User.findOne({

                _id: student,

                school: schoolId,

                role: 'student'

            });


        if (!studentUser) {

            return res.status(404).json({

                message:
                    'Student not found in this school.'

            });

        }


        // =================================================
        // DETERMINE STUDENT CLASS
        // =================================================

        const actualClass =
            studentUser.className ||
            studentUser.class ||
            studentUser.form ||
            '';


        // =================================================
        // VERIFY CLASS
        // =================================================

        if (
            className &&
            actualClass &&
            String(actualClass)
                .trim()
                .toLowerCase()
            !==
            String(className)
                .trim()
                .toLowerCase()
        ) {

            return res.status(400).json({

                message:
                    'Selected student does not belong to the selected class.'

            });

        }


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
                    studentUser.admissionNumber ||
                    admissionNumber ||
                    '',

                className:
                    actualClass ||
                    className ||
                    '',

                category,

                severity:
                    severity || 'low',

                description:
                    description.trim(),

                incidentDate:
                    new Date(incidentDate),

                reportedBy:
                    req.user?.name ||
                    req.user?.fullName ||
                    req.user?.email ||
                    'Administrator',

                actionTaken:
                    actionTaken?.trim() ||
                    '',

                status:
                    status || 'reported',

                resolutionNotes:
                    resolutionNotes?.trim() ||
                    ''

            });


        // =================================================
        // POPULATE STUDENT
        // =================================================

        const populated =
            await Discipline.findById(
                discipline._id
            ).populate(
                'student',
                'name fullName email admissionNumber className class'
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

        // =================================================
        // SCHOOL
        // =================================================

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


        if (!schoolId) {

            return res.status(400).json({
                message: 'School could not be determined.'
            });

        }


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (!student) {

            return res.status(400).json({
                message: 'Student is required.'
            });

        }


        if (!category) {

            return res.status(400).json({
                message: 'Discipline category is required.'
            });

        }


        if (!description) {

            return res.status(400).json({
                message: 'Incident description is required.'
            });

        }


        if (!incidentDate) {

            return res.status(400).json({
                message: 'Incident date is required.'
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
                student.trim();


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
                    className || '',

                category,

                severity:
                    severity || 'low',

                description:

                    description.trim(),

                incidentDate:

                    new Date(incidentDate),

                reportedBy:

                    req.user?.name ||
                    req.user?.fullName ||
                    req.user?.email ||
                    'Administrator',

                actionTaken:
                    actionTaken || '',

                status:
                    status || 'reported',

                resolutionNotes:
                    resolutionNotes || ''

            });


        // =================================================
        // POPULATE STUDENT
        // =================================================

        const populated =
            await Discipline.findById(
                discipline._id
            ).populate(
                'student',
                'name fullName email admissionNumber'
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

const getDisciplineCases = async (req, res) => {

    try {

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


        const cases =
            await Discipline.find({
                school: schoolId
            })
            .populate(
                'student',
                'name fullName email admissionNumber'
            )
            .sort({
                createdAt: -1
            });


        return res.json({

            discipline:
                cases

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET]',
            error
        );


        return res.status(500).json({

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

const getDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


        const discipline =
            await Discipline.findOne({

                _id:
                    req.params.id,

                school:
                    schoolId

            }).populate(
                'student',
                'name fullName email admissionNumber'
            );


        if (!discipline) {

            return res.status(404).json({

                message:
                    'Discipline case not found'

            });

        }


        return res.json({

            discipline

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET ONE]',
            error
        );


        return res.status(500).json({

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

const updateDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


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


        if (
            updates.status === 'resolved'
        ) {

            updates.resolvedAt =
                new Date();

        }


        const discipline =
            await Discipline.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    school:
                        schoolId
                },

                updates,

                {
                    new: true,
                    runValidators: true
                }

            ).populate(
                'student',
                'name fullName email admissionNumber'
            );


        if (!discipline) {

            return res.status(404).json({

                message:
                    'Discipline case not found'

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

const deleteDisciplineCase = async (req, res) => {

    try {

        const schoolId =
            req.user?.school ||
            req.school?._id ||
            req.school;


        const discipline =
            await Discipline.findOneAndDelete({

                _id:
                    req.params.id,

                school:
                    schoolId

            });


        if (!discipline) {

            return res.status(404).json({

                message:
                    'Discipline case not found'

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

            message:
                'Failed to delete discipline case',

            error:
                error.message

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

    deleteDisciplineCase

};
