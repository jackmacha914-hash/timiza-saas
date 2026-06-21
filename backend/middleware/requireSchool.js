module.exports = function requireSchool(req, res, next) {
  if (!req.school) {
    return res.status(403).json({
      message: "No school context. Access denied."
    });
  }
  next();
};
