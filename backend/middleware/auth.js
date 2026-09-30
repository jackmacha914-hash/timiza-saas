const jwt = require('jsonwebtoken');
const config = require('config');

/**
 * =====================================================
 * AUTHENTICATION MIDDLEWARE
 * =====================================================
 */
const protect = (req, res, next) => {

    // Allow CORS preflight requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    let token = req.header('x-auth-token');

    // Support Authorization: Bearer <token>
    if (!token) {
        const authHeader = req.header('Authorization');

        if (authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else {
                token = authHeader;
            }
        }
    }

    // No token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token, authorization denied'
        });
    }

    try {

        const jwtSecret =
            process.env.JWT_SECRET ||
            config.get('jwtSecret');

        if (!jwtSecret) {
            console.error('[AUTH] JWT secret is missing');

            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        console.log('[AUTH] JWT decoded:', decoded);

        let userId = null;
        let role = null;
        let school = null;

        /**
         * ---------------------------------------------
         * TOKEN FORMAT 1
         * { user: { id, role, school } }
         * ---------------------------------------------
         */
        if (decoded.user) {

            userId =
                decoded.user.id ||
                decoded.user._id;

            role =
                decoded.user.role;

            school =
                decoded.user.school;
        }

        /**
         * ---------------------------------------------
         * TOKEN FORMAT 2
         * { id, role, school }
         * ---------------------------------------------
         */
        else if (decoded.id) {

            userId = decoded.id;
            role = decoded.role;
            school = decoded.school;
        }

        /**
         * ---------------------------------------------
         * TOKEN FORMAT 3
         * { userId, role, school }
         * ---------------------------------------------
         */
        else if (decoded.userId) {

            userId = decoded.userId;
            role = decoded.role;
            school = decoded.school;
        }

        /**
         * ---------------------------------------------
         * INVALID TOKEN
         * ---------------------------------------------
         */
        else {

            console.error(
                '[AUTH] Invalid JWT payload:',
                decoded
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        /**
         * =================================================
         * SCHOOL IS REQUIRED
         * =================================================
         *
         * This is important for your SaaS.
         *
         * A user without a school MUST NOT be allowed
         * through protected school routes.
         */
        if (!school) {

            console.error(
                '[AUTH] User authenticated but NO SCHOOL:',
                {
                    userId,
                    role,
                    decoded
                }
            );

            return res.status(403).json({
                success: false,
                message: 'User is not assigned to a school'
            });
        }

        /**
         * Create normalized authenticated user
         */
        req.user = {
            id: userId,
            role: role,
            school: school
        };

        /**
         * IMPORTANT DEBUG LOG
         *
         * After deployment, this should show something like:
         *
         * [AUTH] User:
         * {
         *   id: '...',
         *   role: 'admin',
         *   school: 'schoolA'
         * }
         */
        console.log('[AUTH] Authenticated user:', {
            id: req.user.id,
            role: req.user.role,
            school: req.user.school
        });

        next();

    } catch (err) {

        console.error('[AUTH ERROR]', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please log in again.'
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};


/**
 * =====================================================
 * ROLE AUTHORIZATION
 * =====================================================
 */
const authorize = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const userRole = String(
            req.user.role || ''
        )
            .toLowerCase()
            .trim();

        const allowedRoles = (
            Array.isArray(roles[0])
                ? roles[0]
                : roles
        )
            .map(role =>
                String(role)
                    .toLowerCase()
                    .trim()
            )
            .filter(Boolean);

        if (!allowedRoles.includes(userRole)) {

            return res.status(403).json({
                success: false,
                message:
                    `User role '${req.user.role}' is not authorized`
            });
        }

        next();
    };
};


module.exports = {
    protect,
    authorize
};
