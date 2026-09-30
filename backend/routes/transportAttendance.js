const express = require('express');
const router = express.Router();

const TransportAttendance = require('../models/TransportAttendance');
const TransportAssignment = require('../models/TransportAssignment');
const { protect } = require('../middleware/auth');


// ============================================================
// GET STUDENTS FOR ATTENDANCE BY ROUTE
// ============================================================
router.get('/route/:routeId', protect, async (req, res) => {
    try {
        const assignments = await TransportAssignment.find({
            school: req.user.school,
            routeId: req.params.routeId
        })
        .populate('studentId', 'name')
        .populate('routeId', 'name')
        .populate('busId', 'number');

        res.json(assignments);

    } catch (err) {
        console.error(
            'Transport attendance route error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


// ============================================================
// SAVE TRANSPORT ATTENDANCE - BULK
// ============================================================
router.post('/', protect, async (req, res) => {

    const {
        date,
        routeId,
        records
    } = req.body;

    if (!date || !routeId || !Array.isArray(records) || !records.length) {
        return res.status(400).json({
            message: 'Missing attendance data'
        });
    }

    try {

        // Make sure the route belongs to the logged-in school
        const routeExists = await TransportAssignment.exists({
            school: req.user.school,
            routeId: routeId
        });

        if (!routeExists) {
            return res.status(404).json({
                message: 'Route not found for this school'
            });
        }


        const operations = records.map(record => ({
            updateOne: {
                filter: {
                    school: req.user.school,
                    studentId: record.studentId,
                    routeId: routeId,
                    date: date
                },

                update: {
                    $set: {
                        school: req.user.school,
                        studentId: record.studentId,
                        routeId: routeId,
                        busId: record.busId,
                        date: date,
                        present: record.present
                    }
                },

                upsert: true
            }
        }));


        await TransportAttendance.bulkWrite(operations);


        res.json({
            success: true,
            message: 'Attendance saved successfully'
        });

    } catch (err) {

        console.error(
            'Save transport attendance error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


// ============================================================
// GET ATTENDANCE BY DATE & ROUTE
// ============================================================
router.get('/', protect, async (req, res) => {

    const {
        date,
        routeId
    } = req.query;

    try {

        const filter = {
            school: req.user.school
        };


        if (date) {
            filter.date = date;
        }

        if (routeId) {
            filter.routeId = routeId;
        }


        const attendance = await TransportAttendance.find(filter)
            .populate('studentId', 'name')
            .populate('routeId', 'name')
            .populate('busId', 'number');


        res.json(attendance);

    } catch (err) {

        console.error(
            'Get transport attendance error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


module.exports = router;
