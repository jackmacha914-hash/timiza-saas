const mongoose = require('mongoose');
const Discipline = require('../models/Discipline');
const User = require('../models/User');


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

        console.log("======================================");
        console.log("[DISCIPLINE CREATE]");
        console.log("User:", req.user);
        console.log("Body:", req.body);
        console.log("======================================");


        // ---------------------------------------------
        // REQUIRED FIELDS
        // ---------------------------------------------

        if (!student) {
            return res.status(400).json({
                message: "Student is required"
            });
        }

        if (!category) {
            return res.status(400).json({
                message: "Discipline category is required"
            });
        }

        if (!description) {
            return res.status(400).json({
                message: "Incident description is required"
            });
        }

        if (!incidentDate) {
            return res.status(400).json({
                message: "Incident date is required"
            });
        }


        // ---------------------------------------------
        // VALIDATE STUDENT ID
        // ---------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(student)) {

            return res.status(400).json({
                message: "Invalid student ID."
            });

        }


        // ---------------------------------------------
        // FIND STUDENT
        // ---------------------------------------------

        const studentUser = await User.findOne({
            _id: student,
            school: req.user.school
        });

        if (!studentUser) {

            return res.status(404).json({
                message: "Student not found in this school."
            });

        }


        // ---------------------------------------------
        // CREATE DISCIPLINE CASE
        // ---------------------------------------------

        const discipline = await Discipline.create({

            school: req.user.school,

            student: studentUser._id,

            admissionNumber:
                admissionNumber ||
                studentUser.admissionNumber,

            className,

            category,

            severity:
                severity || "low",

            description,

            incidentDate,

            reportedBy:
                req.user.name ||
                req.user.fullName ||
                req.user.email ||
                "Administrator",

            actionTaken,

            status:
                status || "reported",

            resolutionNotes

        });


        // ---------------------------------------------
        // POPULATE STUDENT
        // ---------------------------------------------

        const populated =
            await Discipline.findById(
                discipline._id
            ).populate(
                "student",
                "name fullName email admissionNumber"
            );


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            message:
                "Discipline case recorded successfully",

            discipline:
                populated

        });

    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "[DISCIPLINE CREATE ERROR]"
        );

        console.error(error);

        console.error(
            "======================================"
        );

        return res.status(500).json({

            message:
                "Failed to create discipline case",

            error:
                error.message

        });

    }

};

        // -------------------------------------------------
        // SCHOOL
        // -------------------------------------------------

        const schoolId =
            req.school?._id ||
            req.school ||
            req.user?.school;


        if (!schoolId) {

            return res.status(400).json({

                message:
                    'School could not be determined.'

            });

        }


        // -------------------------------------------------
        // STUDENT
        // -------------------------------------------------

        if (!student) {

            return res.status(400).json({

                message:
                    'Student is required.'

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(student)
        ) {

            return res.status(400).json({

                message:
                    'Invalid student ID.'

            });

        }


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (!category) {

            return res.status(400).json({

                message:
                    'Discipline category is required.'

            });

        }


        if (!description) {

            return res.status(400).json({

                message:
                    'Incident description is required.'

            });

        }


        if (!incidentDate) {

            return res.status(400).json({

                message:
                    'Incident date is required.'

            });

        }


        // -------------------------------------------------
        // CREATE
        // -------------------------------------------------

        const discipline =
            await Discipline.create({

                school:
                    schoolId,

                student:
                    student,

                admissionNumber:
                    admissionNumber || '',

                className:
                    className || '',

                category,

                severity:
                    severity || 'low',

                description,

                incidentDate,

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


        // -------------------------------------------------
        // POPULATE STUDENT
        // -------------------------------------------------

        const populated =
            await Discipline.findById(
                discipline._id
            ).populate(
                'student',
                'name fullName email admissionNumber'
            );


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

        console.error(
            error
        );

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
// GET DISCIPLINE CASES
// =====================================================

const getDisciplineCases = async (req, res) => {

    try {

        const cases =
            await Discipline.find({
                school: req.user.school
            })
            .populate(
                'student',
                'name fullName email admissionNumber'
            )
            .sort({
                createdAt: -1
            });


        res.json({
            discipline: cases
        });

    } catch (error) {

        console.error(
            '[DISCIPLINE GET]',
            error
        );

        res.status(500).json({

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

        const discipline =
            await Discipline.findOne({

                _id: req.params.id,

                school: req.user.school

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


        res.json({
            discipline
        });

    } catch (error) {

        console.error(
            '[DISCIPLINE GET ONE]',
            error
        );

        res.status(500).json({

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
                    _id: req.params.id,
                    school: req.user.school
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


        res.json({

            message:
                'Discipline case updated successfully',

            discipline

        });

    } catch (error) {

        console.error(
            '[DISCIPLINE UPDATE]',
            error
        );

        res.status(500).json({

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

        const discipline =
            await Discipline.findOneAndDelete({

                _id: req.params.id,

                school: req.user.school

            });


        if (!discipline) {

            return res.status(404).json({

                message:
                    'Discipline case not found'

            });

        }


        res.json({

            message:
                'Discipline case deleted successfully'

        });

    } catch (error) {

        console.error(
            '[DISCIPLINE DELETE]',
            error
        );

        res.status(500).json({

            message:
                'Failed to delete discipline case',

            error:
                error.message

        });

    }

};


module.exports = {

    createDisciplineCase,

    getDisciplineCases,

    getDisciplineCase,

    updateDisciplineCase,

    deleteDisciplineCase

};
