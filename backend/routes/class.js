const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

// =====================================================
// ALL CLASS ROUTES REQUIRE AUTHENTICATION
// =====================================================

router.use(protect);


// =====================================================
// GET ALL CLASSES FOR CURRENT SCHOOL
// GET /api/classes
// =====================================================

router.get('/', async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(400).json({
                success: false,
                message: 'School not found in authenticated user'
            });
        }

        const classes = await Class.find({
            school: req.user.school
        })
        .sort({
            level: 1,
            name: 1
        });

        res.json(classes);

    } catch (err) {

        console.error('GET CLASSES ERROR:', err);

        res.status(500).json({
            success: false,
            message: 'Failed to load classes',
            error: err.message
        });
    }
});


// =====================================================
// GET CLASSES BELONGING TO CURRENT TEACHER
// GET /api/classes/my-classes
// =====================================================

router.get('/my-classes', async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(400).json({
                success: false,
                message: 'School not found in authenticated user'
            });
        }

        const query = {
            school: req.user.school
        };

        // Teachers only see classes assigned to them.
        if (req.user.role === 'teacher') {
            query.teacherInCharge = req.user.id;
        }

        const classes = await Class.find(query)
            .sort({
                level: 1,
                name: 1
            });

        res.json(classes);

    } catch (err) {

        console.error('GET MY CLASSES ERROR:', err);

        res.status(500).json({
            success: false,
            message: 'Failed to load teacher classes',
            error: err.message
        });
    }
});


// =====================================================
// CREATE CLASS
// POST /api/classes
// =====================================================

router.post(
    '/',
    [
        body('name')
            .notEmpty()
            .withMessage('Class name is required'),

        body('level')
            .isIn([
                'Pre-School',
                'Primary',
                'Elementary',
                'Middle School',
                'High School'
            ])
            .withMessage('Invalid class level'),

        body('capacity')
            .isNumeric()
            .withMessage('Capacity must be a number'),

        body('academicYear')
            .notEmpty()
            .withMessage('Academic year is required')
    ],
    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {

            if (!req.user || !req.user.school) {
                return res.status(400).json({
                    success: false,
                    message: 'School not found in authenticated user'
                });
            }

            const {
                name,
                level,
                section = '',
                capacity = 30,
                teacherInCharge = null,
                roomNumber = '',
                academicYear,
                notes = ''
            } = req.body;


            // ---------------------------------------------
            // CHECK DUPLICATE WITHIN THIS SCHOOL ONLY
            // ---------------------------------------------

            const existingClass = await Class.findOne({
                school: req.user.school,
                name: name.trim(),
                academicYear
            });

            if (existingClass) {
                return res.status(400).json({
                    success: false,
                    errors: [
                        {
                            msg: 'A class with this name already exists for the selected academic year'
                        }
                    ]
                });
            }


            // ---------------------------------------------
            // CREATE CLASS
            // ---------------------------------------------

            const newClass = new Class({

                school: req.user.school,

                name: name.trim(),

                level,

                section,

                capacity,

                teacherInCharge: teacherInCharge || null,

                roomNumber,

                academicYear,

                notes,

                studentCount: 0
            });


            await newClass.save();


            res.status(201).json({
                success: true,
                message: 'Class created successfully',
                class: newClass
            });

        } catch (err) {

            console.error('CREATE CLASS ERROR:', err);

            if (err.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'A similar class already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create class',
                error: err.message
            });
        }
    }
);


// =====================================================
// GET SINGLE CLASS
// GET /api/classes/:id
// =====================================================

router.get('/:id', async (req, res) => {
    try {

        const classObj = await Class.findOne({
            _id: req.params.id,
            school: req.user.school
        });

        if (!classObj) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json(classObj);

    } catch (err) {

        console.error('GET CLASS ERROR:', err);

        res.status(500).json({
            success: false,
            message: 'Failed to load class',
            error: err.message
        });
    }
});


// =====================================================
// UPDATE CLASS
// PUT /api/classes/:id
// =====================================================

router.put(
    '/:id',
    [
        body('name')
            .notEmpty()
            .withMessage('Class name is required'),

        body('level')
            .isIn([
                'Pre-School',
                'Primary',
                'Elementary',
                'Middle School',
                'High School'
            ])
            .withMessage('Invalid class level'),

        body('capacity')
            .isNumeric()
            .withMessage('Capacity must be a number'),

        body('academicYear')
            .notEmpty()
            .withMessage('Academic year is required')
    ],
    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {

            const classObj = await Class.findOne({
                _id: req.params.id,
                school: req.user.school
            });

            if (!classObj) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }


            const {
                name,
                level,
                section = '',
                capacity = 30,
                teacherInCharge = null,
                roomNumber = '',
                academicYear,
                notes = ''
            } = req.body;


            // ---------------------------------------------
            // DUPLICATE CHECK WITHIN SAME SCHOOL
            // ---------------------------------------------

            const duplicate = await Class.findOne({
                school: req.user.school,
                _id: {
                    $ne: req.params.id
                },
                name: name.trim(),
                academicYear
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'A class with this name already exists for this academic year'
                });
            }


            classObj.name = name.trim();
            classObj.level = level;
            classObj.section = section;
            classObj.capacity = capacity;
            classObj.teacherInCharge = teacherInCharge || null;
            classObj.roomNumber = roomNumber;
            classObj.academicYear = academicYear;
            classObj.notes = notes;


            await classObj.save();


            res.json({
                success: true,
                message: 'Class updated successfully',
                class: classObj
            });

        } catch (err) {

            console.error('UPDATE CLASS ERROR:', err);

            res.status(500).json({
                success: false,
                message: 'Failed to update class',
                error: err.message
            });
        }
    }
);


// =====================================================
// DELETE CLASS
// DELETE /api/classes/:id
// =====================================================

router.delete('/:id', async (req, res) => {
    try {

        const classObj = await Class.findOne({
            _id: req.params.id,
            school: req.user.school
        });

        if (!classObj) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }


        if (classObj.studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a class that has students'
            });
        }


        await Class.findByIdAndDelete(classObj._id);


        res.json({
            success: true,
            message: 'Class deleted successfully'
        });

    } catch (err) {

        console.error('DELETE CLASS ERROR:', err);

        res.status(500).json({
            success: false,
            message: 'Failed to delete class',
            error: err.message
        });
    }
});


module.exports = router;
