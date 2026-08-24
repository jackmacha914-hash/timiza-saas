const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const TransportPayment = require("../models/TransportPayment");
const Route = require("../models/Route");
const User = require("../models/User");
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


        // ---------------------------------
        // VALIDATION
        // ---------------------------------

        if (
            !studentId ||
            !routeId ||
            amount === undefined ||
            amount === null ||
            !term ||
            !year ||
            !method
        ) {
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


        const paymentAmount = Number(amount);
        const paymentYear = Number(year);


        if (paymentAmount <= 0) {
            return res.status(400).json({
                error: "Payment amount must be greater than zero"
            });
        }


        if (!Number.isInteger(paymentYear)) {
            return res.status(400).json({
                error: "Invalid payment year"
            });
        }


        // ---------------------------------
        // VERIFY STUDENT BELONGS TO SCHOOL
        // ---------------------------------

        const student = await User.findOne({
            _id: studentId,
            school: req.user.school,
            role: "student"
        });

        if (!student) {
            return res.status(404).json({
                error: "Student not found for this school"
            });
        }


        // ---------------------------------
        // VERIFY ROUTE BELONGS TO SCHOOL
        // ---------------------------------

        const route = await Route.findOne({
            _id: routeId,
            school: req.user.school
        });

        if (!route) {
            return res.status(404).json({
                error: "Route not found for this school"
            });
        }


        // ---------------------------------
        // GET TRANSPORT FEE
        // ---------------------------------

        const transportFee = Number(route.transportfee || 0);


        // ---------------------------------
        // GET PREVIOUS PAYMENTS
        // ---------------------------------

        const previousPayments =
            await TransportPayment.aggregate([
                {
                    $match: {
                        school: req.user.school,
                        studentId:
                            new mongoose.Types.ObjectId(studentId),
                        routeId:
                            new mongoose.Types.ObjectId(routeId),
                        term,
                        year: paymentYear
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


        const totalPaidBefore =
            previousPayments[0]?.totalPaid || 0;


        // ---------------------------------
        // CALCULATE BALANCE
        // ---------------------------------

        const totalPaid =
            totalPaidBefore + paymentAmount;

        const newBalance =
            transportFee - totalPaid;


        let status = "Unpaid";

        if (newBalance <= 0) {
            status = "Paid";
        } else if (totalPaid > 0) {
            status = "Partial";
        }


        // ---------------------------------
        // CREATE PAYMENT
        // ---------------------------------

        const payment =
            await TransportPayment.create({

                school: req.user.school,

                studentId,

                routeId,

                amount: paymentAmount,

                term,

                year: paymentYear,

                method,

                balance: newBalance,

                status

            });


        res.status(201).json({
            success: true,
            message: "Transport payment recorded successfully",
            payment
        });


    } catch (err) {

        console.error(
            "Transport Payment POST error:",
            err
        );

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


        if (studentId) {

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    error: "Invalid student ID"
                });
            }

            filter.studentId = studentId;
        }


        if (routeId) {

            if (!mongoose.Types.ObjectId.isValid(routeId)) {
                return res.status(400).json({
                    error: "Invalid route ID"
                });
            }

            filter.routeId = routeId;
        }


        if (term) {
            filter.term = term;
        }


        if (year) {
            filter.year = Number(year);
        }


        const payments =
            await TransportPayment.find(filter)
                .populate("studentId", "name")
                .populate("routeId", "name")
                .sort({
                    createdAt: -1
                });


        res.json(payments);


    } catch (err) {

        console.error(
            "Transport Payment GET error:",
            err
        );

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

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: "Invalid payment ID"
            });
        }


        const payment =
            await TransportPayment.findOneAndDelete({

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

            message:
                "Payment deleted successfully"

        });


    } catch (err) {

        console.error(
            "Transport Payment DELETE error:",
            err
        );

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;
