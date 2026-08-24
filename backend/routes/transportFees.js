const express = require('express');
const router = express.Router();

const TransportFee = require('../models/TransportFee');
const TransportRoute = require('../models/TransportRoute');
const { protect } = require('../middleware/auth');


// ======================================
// CREATE / UPDATE TRANSPORT FEE
// ======================================
router.post('/', protect, async (req, res) => {
    try {

        const { routeId, amount } = req.body;

        if (!routeId || amount === undefined || amount === null) {
            return res.status(400).json({
                error: 'Route and amount are required'
            });
        }

        if (Number(amount) < 0) {
            return res.status(400).json({
                error: 'Fee amount cannot be negative'
            });
        }


        // Make sure the route belongs to this school
        const route = await TransportRoute.findOne({
            _id: routeId,
            school: req.user.school
        });

        if (!route) {
            return res.status(404).json({
                error: 'Route not found for this school'
            });
        }


        const fee = await TransportFee.findOneAndUpdate(
            {
                school: req.user.school,
                routeId
            },
            {
                $set: {
                    school: req.user.school,
                    routeId,
                    amount: Number(amount)
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json(fee);

    } catch (err) {

        console.error(
            'Transport Fee POST error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================
// GET ALL TRANSPORT FEES
// ======================================
router.get('/', protect, async (req, res) => {
    try {

        const fees = await TransportFee.find({
            school: req.user.school
        })
        .populate('routeId', 'name');

        res.json(fees);

    } catch (err) {

        console.error(
            'Transport Fee GET error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================
// DELETE TRANSPORT FEE
// ======================================
router.delete('/:id', protect, async (req, res) => {
    try {

        const fee = await TransportFee.findOneAndDelete({
            _id: req.params.id,
            school: req.user.school
        });

        if (!fee) {
            return res.status(404).json({
                message: 'Transport fee not found'
            });
        }

        res.json({
            success: true,
            message: 'Fee deleted successfully'
        });

    } catch (err) {

        console.error(
            'Transport Fee DELETE error:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});


module.exports = router;
