const School = require('../models/School');

async function tenant(req, res, next) {
  try {
    let host = req.headers.host; 
    // example: greenhill.timizaanalytics.com

    if (!host) {
      return res.status(400).json({ message: "No host found" });
    }

    // remove port if localhost
    host = host.replace(':5000', '');

    let slug;

    // if subdomain exists
    const parts = host.split('.');

    if (parts.length > 2) {
      slug = parts[0]; // greenhill
    } else {
      slug = null;
    }

    if (!slug) {
      req.school = null;
      return next();
    }

    const school = await School.findOne({ slug });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    req.school = school;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tenant error" });
  }
}

module.exports = tenant;
