
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const TransportPayment = require("../models/TransportPayment");
const Route = require("../models/Route");
const { protect } = require("../middleware/auth");

// =====================================
// CREATE PAYMENT
// =====================================
router.post("/", protect, async (req, res) => {
    try {

        const {
            studentId,
            routeId,
            amount,
            term,
            year,
            method
        } = req.body;

        if (!studentId || !routeId || !amount || !term || !year || !method) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(routeId)
        ) {
            return res.status(400).json({
                error: "Invalid student or route ID"
            });
        }

        // Get route for THIS SCHOOL ONLY
        const route = await Route.findOne({
            _id: routeId,
            school: req.user.school
        });

        if (!route) {
            return res.status(404).json({
                error: "Route not found"
            });
        }

        const transportFee = route.transportfee || 0;

        // Previous payments for same school
        const previousPayments = await TransportPayment.aggregate([
            {
                $match: {
                    school: req.user.school,
                    studentId: new mongoose.Types.ObjectId(studentId),
                    routeId: new mongoose.Types.ObjectId(routeId),
                    term,
                    year: Number(year)
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaid: {
                        $sum: "$amount"
                    }
                }
            }
        ]);

        const totalPaidBefore = previousPayments[0]?.totalPaid || 0;

        const newBalance =
            transportFee - (totalPaidBefore + Number(amount));

        let status = "Unpaid";

        if (newBalance <= 0) {
            status = "Paid";
        } else if (totalPaidBefore > 0 || Number(amount) > 0) {
            status = "Partial";
        }

        const payment = await TransportPayment.create({
            school: req.user.school,
            studentId,
            routeId,
            amount: Number(amount),
            term,
            year: Number(year),
            method,
            balance: newBalance,
            status
        });

        res.status(201).json(payment);

    } catch (err) {
        console.error("Transport Payment POST error:", err);

        res.status(500).json({
            error: err.message
        });
    }
});


// =====================================
// GET PAYMENTS
// =====================================
router.get("/", protect, async (req, res) => {

    try {

        const {
            studentId,
            routeId,
            term,
            year
        } = req.query;

        const filter = {
            school: req.user.school
        };

        if (studentId) filter.studentId = studentId;
        if (routeId) filter.routeId = routeId;
        if (term) filter.term = term;
        if (year) filter.year = Number(year);

        const payments = await TransportPayment.find(filter)
            .sort({
                createdAt: -1
            });

        res.json(payments);

    } catch (err) {

        console.error("Transport Payment GET error:", err);

        res.status(500).json({
            error: err.message
        });

    }

});


// =====================================
// DELETE PAYMENT
// =====================================
router.delete("/:id", protect, async (req, res) => {

    try {

        const payment = await TransportPayment.findOneAndDelete({
            _id: req.params.id,
            school: req.user.school
        });

        if (!payment) {
            return res.status(404).json({
                error: "Payment not found"
            });
        }

        res.json({
            success: true,
            message: "Payment deleted successfully"
        });

    } catch (err) {

        console.error("Transport Payment DELETE error:", err);

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;

