// routes/accounts.js

const express = require("express");
const router = express.Router();

const Account = require("../models/Account");
const {
    authenticateUser,
    authorizeRoles
} = require("../middleware/authMiddleware");


// ========================================
// GET ALL ACCOUNTS
// ========================================

router.get(
    "/",
    authenticateUser,

    async (req, res) => {

        try {

            const {
                search,
                status,
                class: className,
                method,
                type,
                dateFrom,
                dateTo
            } = req.query;

            const filter = {

                school: req.user.school

            };

            if (search) {

                filter.$or = [

                    {
                        student:
                        {
                            $regex: search,
                            $options: "i"
                        }
                    },

                    {
                        class:
                        {
                            $regex: search,
                            $options: "i"
                        }
                    },

                    {
                        description:
                        {
                            $regex: search,
                            $options: "i"
                        }
                    }

                ];

            }

            if (status)
                filter.status = status;

            if (className)
                filter.class = {
                    $regex: className,
                    $options: "i"
                };

            if (method)
                filter.method = method;

            if (type)
                filter.type = type;

            if (dateFrom || dateTo) {

                filter.date = {};

                if (dateFrom)
                    filter.date.$gte = new Date(dateFrom);

                if (dateTo)
                    filter.date.$lte = new Date(dateTo);

            }

            const accounts =
                await Account.find(filter);

            res.json(accounts);

        } catch (err) {

            res.status(500).json({

                success: false,

                message: err.message

            });

        }

    }

);


// ========================================
// CREATE ACCOUNT
// ========================================

router.post(
    "/",

    authenticateUser,

    authorizeRoles("admin"),

    async (req, res) => {

        try {

            const account =
                await Account.create({

                    ...req.body,

                    school: req.user.school

                });

            res.status(201).json({

                success: true,

                account

            });

        } catch (err) {

            res.status(500).json({

                success: false,

                message: err.message

            });

        }

    }

);

module.exports = router;
