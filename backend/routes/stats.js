const express = require('express');
const router = express.Router();

// Auth
const { protect } = require('../middleware/auth');

// Models
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Book = require('../models/Book');
const Fee = require('../models/Fee');

router.get('/', protect, async (req, res) => {
    try {

        const school = req.user.school;

        // Always isolate by school
        const schoolFilter = { school };

        const students = await User.countDocuments({
            ...schoolFilter,
            role: 'student'
        });

        const teachers = await User.countDocuments({
            ...schoolFilter,
            role: 'teacher'
        });

        const events = await Event.countDocuments(schoolFilter);

        const clubs = await Club.countDocuments(schoolFilter);

        const present = await Attendance.countDocuments({
            ...schoolFilter,
            status: 'present'
        });

        const absent = await Attendance.countDocuments({
            ...schoolFilter,
            status: 'absent'
        });

        const issued = await Book.countDocuments({
            ...schoolFilter,
            status: 'issued'
        });

        const feesAgg = await Fee.aggregate([
            {
                $match: {
                    school
                }
            },
            {
                $group: {
                    _id: null,
                    paid: {
                        $sum: '$paidAmount'
                    },
                    balance: {
                        $sum: '$balance'
                    }
                }
            }
        ]);

        const paid = feesAgg[0]?.paid || 0;
        const balance = feesAgg[0]?.balance || 0;

        res.json({
            students,
            teachers,
            events,
            clubs,
            attendance: {
                present,
                absent
            },
            library: {
                issued
            },
            fees: {
                paid,
                balance
            }
        });

    } catch (error) {

        console.error('Dashboard stats error:', error);

        res.status(500).json({
            message: error.message
        });

    }
});

module.exports = router;
