const School = require('../models/School');

async function tenant(req, res, next) {
  try {
    let host = req.headers.host;

    if (!host) {
      return res.status(400).json({ message: "No host found" });
    }

    // remove port (localhost:5000)
    host = host.replace(':5000', '');

    console.log("Incoming host:", host);

    const parts = host.split('.');

    let slug = null;

    // CASE 1: subdomain exists (greenhill.timizaanalytics.com)
    if (
      parts.length >= 3 &&
      !host.includes('localhost') &&
      !host.includes('127.0.0.1')
    ) {
      slug = parts[0];
    }

    // CASE 2: main domain (superadmin)
    const mainDomains = [
      'timizaanalytics.com',
      'www.timizaanalytics.com',
      'timizaanalytics.vercel.app'
    ];

    if (mainDomains.includes(host)) {
      req.school = null;
      return next();
    }

    // CASE 3: no subdomain (fallback)
    if (!slug) {
      req.school = null;
      return next();
    }

    const school = await School.findOne({ slug });

    if (!school) {
      return res.status(404).json({
        message: "School not found"
      });
    }

    req.school = school;

    console.log("Tenant resolved:", school.name);

    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tenant error" });
  }
}

module.exports = tenant;
