const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');

// ===============================
// GET ALL / FILTER MEALS
// ===============================
router.get('/', async (req, res) => {
    try {

        const { className, mealType, date, term } = req.query;

        const filter = {
            school: req.user.school
        };

        // Class filter
        if (className) {
            filter.className = className;
        }

        // Meal type filter
        if (mealType) {
            filter.mealType = mealType;
        }

        // Term filter
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

        const meals = await Meal.find(filter).sort({ createdAt: -1 });

        res.json(meals);

    } catch (err) {

        console.error("===== MEALS GET ERROR =====");
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// ===============================
// CREATE MEAL
// ===============================
router.post('/', async (req, res) => {

    try {

        console.log("Incoming meal request:");
        console.log(req.body);
        console.log("Logged in user:", req.user);

        const meal = new Meal({
            school: req.user.school,
            className: req.body.className,
            studentName: req.body.studentName,
            mealType: req.body.mealType,
            term: req.body.term,
            date: req.body.date,
            frequency: req.body.frequency,
            amount: req.body.amount,
            receiptNumber: req.body.receiptNumber
        });

        await meal.save();

        res.status(201).json({
            success: true,
            meal
        });

    } catch (err) {

        console.error("===== MEALS POST ERROR =====");
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }
});

module.exports = router;
