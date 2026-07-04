```javascript
const express = require('express');
const router = express.Router();

const TransportAttendance = require('../models/TransportAttendance');
const TransportAssignment = require('../models/TransportAssignment');
const { protect } = require('../middleware/auth');

// ------------------------------------
// GET students for attendance (by route)
// ------------------------------------
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
        console.error('Transport attendance route error:', err);
        res.status(500).json({ error: err.message });
    }
});


// ------------------------------------
// SAVE attendance (bulk)
// ------------------------------------
router.post('/', protect, async (req, res) => {

    const { date, routeId, records } = req.body;

    if (!date || !routeId || !records?.length) {
        return res.status(400).json({
            message: 'Missing attendance data'
        });
    }

    try {

        const operations = records.map(r => ({
            updateOne: {
                filter: {
                    school: req.user.school,
                    studentId: r.studentId,
                    routeId,
                    date
                },
                update: {
                    school: req.user.school,
                    studentId: r.studentId,
                    routeId,
                    busId: r.busId,
                    date,
                    present: r.present
                },
                upsert: true
            }
        }));

        await TransportAttendance.bulkWrite(operations);

        res.json({
            message: 'Attendance saved successfully'
        });

    } catch (err) {
        console.error('Save transport attendance error:', err);
        res.status(500).json({
            error: err.message
        });
    }
});


// ------------------------------------
// GET attendance by date & route
// ------------------------------------
router.get('/', protect, async (req, res) => {

    const { date, routeId } = req.query;

    try {

        const filter = {
            school: req.user.school
        };

        if (date) filter.date = date;
        if (routeId) filter.routeId = routeId;

        const attendance = await TransportAttendance.find(filter)
            .populate('studentId', 'name')
            .populate('routeId', 'name')
            .populate('busId', 'number');

        res.json(attendance);

    } catch (err) {
        console.error('Get transport attendance error:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;
```
