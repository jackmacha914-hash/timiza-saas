const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Book = require('../models/Book');
const Fee = require('../models/Fee');

const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
    try {

        const school = req.user.school;

        if (!school) {
            return res.status(400).json({
                message: 'School not found in user token'
            });
        }

        const students = await User.countDocuments({
            school,
            role: 'student'
        });

        const teachers = await User.countDocuments({
            school,
            role: 'teacher'
        });

        const events = await Event.countDocuments({
            school
        });

        const clubs = await Club.countDocuments({
            school
        });

        const present = await Attendance.countDocuments({
            school,
            status: 'present'
        });

        const absent = await Attendance.countDocuments({
            school,
            status: 'absent'
        });

        const issued = await Book.countDocuments({
            school,
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
        console.error('Dashboard Stats Error:', error);

        res.status(500).json({
            message: 'Failed to load dashboard statistics'
        });
    }
});

module.exports = router;
