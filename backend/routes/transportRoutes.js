const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { protect } = require('../middleware/auth');
const User = require('../models/User');

// ============================================================
// BUS SCHEMA
// ============================================================

const busSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    number: {
        type: String,
        required: true,
        trim: true
    },

    plate: {
        type: String,
        required: true,
        trim: true
    },

    capacity: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['Active', 'Maintenance'],
        default: 'Active'
    }

}, {
    timestamps: true
});

busSchema.index({
    school: 1,
    number: 1
});

busSchema.index({
    school: 1,
    plate: 1
});

const Bus =
    mongoose.models.Bus ||
    mongoose.model('Bus', busSchema);


// ============================================================
// ROUTE SCHEMA
// ============================================================

const routeSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    }

}, {
    timestamps: true
});

routeSchema.index({
    school: 1,
    name: 1
});

const Route =
    mongoose.models.Route ||
    mongoose.model('Route', routeSchema);


// ============================================================
// DRIVER SCHEMA
// ============================================================

const driverSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    license: {
        type: String,
        required: true,
        trim: true
    },

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    }

}, {
    timestamps: true
});

driverSchema.index({
    school: 1,
    license: 1
});

const Driver =
    mongoose.models.Driver ||
    mongoose.model('Driver', driverSchema);


// ============================================================
// STUDENT TRANSPORT ASSIGNMENT SCHEMA
// ============================================================

const studentTransportSchema = new mongoose.Schema({

    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    }

}, {
    timestamps: true
});

studentTransportSchema.index({
    school: 1,
    studentId: 1
});

const StudentTransport =
    mongoose.models.StudentTransport ||
    mongoose.model(
        'StudentTransport',
        studentTransportSchema
    );


// ============================================================
// BUS ROUTES
// ============================================================


// GET ALL BUSES FOR CURRENT SCHOOL
router.get('/buses', protect, async (req, res) => {

    try {

        const buses = await Bus.find({
            school: req.user.school
        }).sort({
            number: 1
        });

        res.json(buses);

    } catch (err) {

        console.error('GET buses error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// CREATE BUS
router.post('/buses', protect, async (req, res) => {

    try {

        const {
            number,
            plate,
            capacity,
            status
        } = req.body;


        if (!number || !plate || !capacity) {

            return res.status(400).json({
                error: 'Bus number, plate and capacity are required'
            });

        }


        const existingBus = await Bus.findOne({
            school: req.user.school,
            $or: [
                { number },
                { plate }
            ]
        });


        if (existingBus) {

            return res.status(400).json({
                error: 'A bus with this number or plate already exists in this school'
            });

        }


        const bus = new Bus({

            school: req.user.school,

            number,

            plate,

            capacity,

            status: status || 'Active'

        });


        await bus.save();


        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            bus
        });


    } catch (err) {

        console.error('POST bus error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// UPDATE BUS
router.put('/buses/:id', protect, async (req, res) => {

    try {

        const bus = await Bus.findOneAndUpdate(

            {
                _id: req.params.id,
                school: req.user.school
            },

            req.body,

            {
                new: true,
                runValidators: true
            }

        );


        if (!bus) {

            return res.status(404).json({
                error: 'Bus not found'
            });

        }


        res.json(bus);


    } catch (err) {

        console.error('PUT bus error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// DELETE BUS
router.delete('/buses/:id', protect, async (req, res) => {

    try {

        const bus = await Bus.findOneAndDelete({

            _id: req.params.id,

            school: req.user.school

        });


        if (!bus) {

            return res.status(404).json({
                error: 'Bus not found'
            });

        }


        res.json({
            success: true,
            message: 'Bus deleted successfully'
        });


    } catch (err) {

        console.error('DELETE bus error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// ============================================================
// ROUTE ROUTES
// ============================================================


// GET ALL ROUTES
router.get('/routes', protect, async (req, res) => {

    try {

        const routes = await Route.find({

            school: req.user.school

        })
        .populate('busId', 'number plate capacity status')
        .sort({
            name: 1
        });


        res.json(routes);


    } catch (err) {

        console.error('GET routes error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// CREATE ROUTE
router.post('/routes', protect, async (req, res) => {

    try {

        const {
            name,
            busId
        } = req.body;


        if (!name || !busId) {

            return res.status(400).json({
                error: 'Route name and bus are required'
            });

        }


        // Make sure bus belongs to this school
        const bus = await Bus.findOne({

            _id: busId,

            school: req.user.school

        });


        if (!bus) {

            return res.status(404).json({
                error: 'Bus not found for this school'
            });

        }


        const route = new Route({

            school: req.user.school,

            name,

            busId

        });


        await route.save();


        res.status(201).json({

            success: true,

            message: 'Route created successfully',

            route

        });


    } catch (err) {

        console.error('POST route error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// UPDATE ROUTE
router.put('/routes/:id', protect, async (req, res) => {

    try {

        const {
            name,
            busId
        } = req.body;


        if (busId) {

            const bus = await Bus.findOne({

                _id: busId,

                school: req.user.school

            });


            if (!bus) {

                return res.status(404).json({
                    error: 'Bus not found for this school'
                });

            }

        }


        const route = await Route.findOneAndUpdate(

            {
                _id: req.params.id,

                school: req.user.school

            },

            {
                ...(name !== undefined && { name }),
                ...(busId !== undefined && { busId })
            },

            {
                new: true,
                runValidators: true
            }

        );


        if (!route) {

            return res.status(404).json({
                error: 'Route not found'
            });

        }


        res.json(route);


    } catch (err) {

        console.error('PUT route error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// DELETE ROUTE
router.delete('/routes/:id', protect, async (req, res) => {

    try {

        const route = await Route.findOneAndDelete({

            _id: req.params.id,

            school: req.user.school

        });


        if (!route) {

            return res.status(404).json({
                error: 'Route not found'
            });

        }


        res.json({

            success: true,

            message: 'Route deleted successfully'

        });


    } catch (err) {

        console.error('DELETE route error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// ============================================================
// DRIVER ROUTES
// ============================================================


// GET ALL DRIVERS
router.get('/drivers', protect, async (req, res) => {

    try {

        const drivers = await Driver.find({

            school: req.user.school

        })
        .populate(
            'busId',
            'number plate'
        )
        .sort({
            name: 1
        });


        res.json(drivers);


    } catch (err) {

        console.error('GET drivers error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// CREATE DRIVER
router.post('/drivers', protect, async (req, res) => {

    try {

        const {
            name,
            license,
            busId
        } = req.body;


        if (!name || !license || !busId) {

            return res.status(400).json({
                error: 'Driver name, license and bus are required'
            });

        }


        const bus = await Bus.findOne({

            _id: busId,

            school: req.user.school

        });


        if (!bus) {

            return res.status(404).json({
                error: 'Bus not found for this school'
            });

        }


        const driver = new Driver({

            school: req.user.school,

            name,

            license,

            busId

        });


        await driver.save();


        res.status(201).json({

            success: true,

            message: 'Driver created successfully',

            driver

        });


    } catch (err) {

        console.error('POST driver error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// UPDATE DRIVER
router.put('/drivers/:id', protect, async (req, res) => {

    try {

        const {
            name,
            license,
            busId
        } = req.body;


        if (busId) {

            const bus = await Bus.findOne({

                _id: busId,

                school: req.user.school

            });


            if (!bus) {

                return res.status(404).json({
                    error: 'Bus not found for this school'
                });

            }

        }


        const driver = await Driver.findOneAndUpdate(

            {
                _id: req.params.id,

                school: req.user.school

            },

            {
                ...(name !== undefined && { name }),
                ...(license !== undefined && { license }),
                ...(busId !== undefined && { busId })
            },

            {
                new: true,
                runValidators: true
            }

        );


        if (!driver) {

            return res.status(404).json({
                error: 'Driver not found'
            });

        }


        res.json(driver);


    } catch (err) {

        console.error('PUT driver error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// DELETE DRIVER
router.delete('/drivers/:id', protect, async (req, res) => {

    try {

        const driver = await Driver.findOneAndDelete({

            _id: req.params.id,

            school: req.user.school

        });


        if (!driver) {

            return res.status(404).json({
                error: 'Driver not found'
            });

        }


        res.json({

            success: true,

            message: 'Driver deleted successfully'

        });


    } catch (err) {

        console.error('DELETE driver error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// ============================================================
// STUDENT TRANSPORT ASSIGNMENTS
// ============================================================


// GET ALL ASSIGNMENTS
router.get('/assignments', protect, async (req, res) => {

    try {

        const assignments =
            await StudentTransport.find({

                school: req.user.school

            })
            .populate(
                'studentId',
                'name email class'
            )
            .populate(
                'routeId',
                'name'
            )
            .populate(
                'busId',
                'number plate'
            );


        res.json(assignments);


    } catch (err) {

        console.error('GET assignments error:', err);

        res.status(500).json({
            error: err.message
        });

    }

});


// CREATE ASSIGNMENT
router.post('/assignments', protect, async (req, res) => {

    try {

        const {
            studentId,
            routeId,
            busId
        } = req.body;


        if (!studentId || !routeId || !busId) {

            return res.status(400).json({
                error: 'Student, route and bus are required'
            });

        }


        // Verify student belongs to school
        const student = await User.findOne({

            _id: studentId,

            school: req.user.school,

            role: 'student'

        });


        if (!student) {

            return res.status(404).json({
                error: 'Student not found for this school'
            });

        }


        // Verify route belongs to school
        const route = await Route.findOne({

            _id: routeId,

            school: req.user.school

        });


        if (!route) {

            return res.status(404).json({
                error: 'Route not found for this school'
            });

        }


        // Verify bus belongs to school
        const bus = await Bus.findOne({

            _id: busId,

            school: req.user.school

        });


        if (!bus) {

            return res.status(404).json({
                error: 'Bus not found for this school'
            });

        }


        const assignment = new StudentTransport({

            school: req.user.school,

            studentId,

            routeId,

            busId

        });


        await assignment.save();


        res.status(201).json({

            success: true,

            message: 'Student transport assigned successfully',

            assignment

        });


    } catch (err) {

        console.error(
            'POST assignment error:',
            err
        );

        res.status(500).json({
            error: err.message
        });

    }

});


// DELETE ASSIGNMENT
router.delete('/assignments/:id', protect, async (req, res) => {

    try {

        const assignment =
            await StudentTransport.findOneAndDelete({

                _id: req.params.id,

                school: req.user.school

            });


        if (!assignment) {

            return res.status(404).json({
                error: 'Transport assignment not found'
            });

        }


        res.json({

            success: true,

            message:
                'Transport assignment deleted successfully'

        });


    } catch (err) {

        console.error(
            'DELETE assignment error:',
            err
        );

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;
