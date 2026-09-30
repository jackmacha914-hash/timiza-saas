module.exports = function requireSchool(req, res, next) {
    // School comes from the authenticated user
    if (!req.user || !req.user.school) {
        return res.status(403).json({
            message: "No school context. Access denied."
        });
    }

    // Make it available as req.school if controllers use it
    req.school = req.user.school;

    next();
};
