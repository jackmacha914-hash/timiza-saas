const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');


// ------------------ GET ALL / FILTER MEALS ------------------
router.get('/', async (req, res) => {
    try {

        const { className, mealType, date, term } = req.query;

        let filter = {};

        // Class filter
        if (className) {
            filter.className = className;
        }

        // Meal type filter
        if (mealType) {
            filter.mealType = mealType;
        }

        // Term filter (NEW)
        if (term) {
            filter.term = term;
        }

        // Date filter (safe same-day range)
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
        console.error("Meals GET error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// ------------------ CREATE MEAL ------------------
router.post('/', async (req, res) => {
    try {

        const meal = new Meal(req.body);

        await meal.save();

        res.status(201).json(meal);

    } catch (err) {
        console.error("Meals POST error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
