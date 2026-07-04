const express = require('express');
const router = express.Router();

const OtherCharge = require('../models/OtherCharge');
const auth = require('../middleware/auth');

// ------------------ GET ALL CHARGES (FILTERED) ------------------
router.get('/', auth, async (req, res) => {
    try {

        const { className, chargeType, date, search, term } = req.query;

        // Always filter by logged in school
        let filter = {
            school: req.user.school
        };

        // Class filter
        if (className) {
            filter.className = className;
        }

        // Charge type filter
        if (chargeType) {
            filter.chargeType = chargeType;
        }

        // Academic term filter
        if (term) {
            filter.term = term;
        }

        // Date filter
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            filter.date = {
                $gte: start,
                $lt: end
            };
        }

        // Student search
        if (search) {
            filter.studentName = {
                $regex: search,
                $options: "i"
            };
        }

        const charges = await OtherCharge.find(filter)
            .sort({ createdAt: -1 });

        res.json(charges);

    } catch (err) {
        console.error("Other Charges GET error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});


// ------------------ CREATE CHARGE ------------------
router.post('/', auth, async (req, res) => {
    try {

        const charge = new OtherCharge({
            req.body,
            school: req.user.school
        });

        await charge.save();

        res.status(201).json(charge);

    } catch (err) {
        console.error("Other Charges POST error:", err);

        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;

