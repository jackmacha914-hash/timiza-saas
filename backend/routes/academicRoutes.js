const jwt = require("jsonwebtoken");

const User = require("../models/User");


// =====================================================
// PROTECT
// =====================================================
//
// Verifies the JWT token and attaches the authenticated
// user to req.user.
//
// =====================================================

const protect = async (req, res, next) => {

    try {

        let token = null;


        // -------------------------------------------------
        // GET TOKEN FROM AUTHORIZATION HEADER
        // -------------------------------------------------

        const authorization =
            req.headers.authorization;


        if (
            authorization &&
            authorization.startsWith("Bearer ")
        ) {

            token =
                authorization.split(" ")[1];

        }


        // -------------------------------------------------
        // NO TOKEN
        // -------------------------------------------------

        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Not authorized. No token provided."

            });

        }


        // -------------------------------------------------
        // VERIFY TOKEN
        // -------------------------------------------------

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // -------------------------------------------------
        // GET USER
        // -------------------------------------------------

        const user =
            await User.findById(decoded.id)
                .select("-password");


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        // -------------------------------------------------
        // ATTACH USER TO REQUEST
        // -------------------------------------------------

        req.user = user;


        // -------------------------------------------------
        // CONTINUE
        // -------------------------------------------------

        next();


    } catch (error) {

        console.error(
            "[AUTH PROTECT]",
            error
        );


        // JWT errors

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Not authorized. Invalid or expired token."

            });

        }


        // Other errors

        return res.status(500).json({

            success: false,

            message:
                "Authentication failed."

        });

    }

};


// =====================================================
// AUTHORIZE
// =====================================================
//
// Usage:
//
// authorize("admin")
//
// authorize("admin", "teacher")
//
// =====================================================

const authorize = (...roles) => {

    return (req, res, next) => {

        try {

            // ---------------------------------------------
            // USER MUST BE AUTHENTICATED
            // ---------------------------------------------

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Not authorized."

                });

            }


            // ---------------------------------------------
            // GET USER ROLE
            // ---------------------------------------------

            const userRole =
                String(
                    req.user.role || ""
                )
                    .trim()
                    .toLowerCase();


            // ---------------------------------------------
            // NORMALIZE ALLOWED ROLES
            // ---------------------------------------------

            const allowedRoles =
                roles.map(role =>
                    String(role)
                        .trim()
                        .toLowerCase()
                );


            // ---------------------------------------------
            // CHECK ROLE
            // ---------------------------------------------

            if (
                !allowedRoles.includes(userRole)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You do not have permission to perform this action."

                });

            }


            // ---------------------------------------------
            // AUTHORIZED
            // ---------------------------------------------

            next();


        } catch (error) {

            console.error(
                "[AUTH AUTHORIZE]",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Authorization failed."

            });

        }

    };

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    protect,
    authorize
};
