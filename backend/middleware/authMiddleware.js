const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config();

const authenticateUser = async (req, res, next) => {
const authHeader = req.headers.authorization;

```
if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
) {
    return res.status(401).json({
        success: false,
        msg: 'No token, authorization denied'
    });
}

const token = authHeader.split(' ')[1];

try {
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    let userId;
    let schoolId;

    if (decoded.user) {
        userId =
            decoded.user.id ||
            decoded.user._id;
        schoolId = decoded.user.school;
    } else {
        userId = decoded.id;
        schoolId = decoded.school;
    }

    const user = await User.findOne({
        _id: userId,
        school: schoolId
    }).select('-password');

    if (!user) {
        return res.status(401).json({
            success: false,
            msg: 'User not found'
        });
    }

    req.user = {
        id: user._id,
        role: user.role,
        school: user.school,
        ...user.toObject()
    };

    next();
} catch (err) {
    if (
        err.name ===
        'TokenExpiredError'
    ) {
        return res.status(401).json({
            success: false,
            msg: 'Token expired'
        });
    }

    return res.status(401).json({
        success: false,
        msg: 'Invalid token'
    });
}
```

};

const authorizeRoles = (...roles) => {
const allowedRoles = roles
.flat()
.map(role =>
String(role)
.toLowerCase()
.trim()
);

```
return (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            msg: 'Unauthorized'
        });
    }

    const userRole = String(
        req.user.role
    )
        .toLowerCase()
        .trim();

    if (
        !allowedRoles.includes(
            userRole
        )
    ) {
        return res.status(403).json({
            success: false,
            msg: 'Access denied'
        });
    }

    next();
};
```

};

module.exports = {
authenticateUser,
authorizeRoles
};
