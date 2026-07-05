const express = require('express');
const router = express.Router();

const TransportFee = require('../models/TransportFee');
const { protect } = require('../middleware/auth');


// ======================================
// CREATE / UPDATE TRANSPORT FEE
// ======================================
router.post('/', protect, async (req, res) => {
    try {

        const { routeId, amount } = req.body;

        const fee = await TransportFee.findOneAndUpdate(
            {
                school: req.user.school,
                routeId
            },
            {
                school: req.user.school,
                routeId,
                amount
            },
            {
                new: true,
                upsert: true
            }
        );

        res.json(fee);

    } catch (err) {
        console.error('Transport Fee POST error:', err);
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
        }).populate('routeId', 'name');

        res.json(fees);

    } catch (err) {
        console.error('Transport Fee GET error:', err);
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
            message: 'Fee deleted successfully'
        });

    } catch (err) {
        console.error('Transport Fee DELETE error:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;

