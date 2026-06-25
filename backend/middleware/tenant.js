```javascript
const School = require('../models/School');

async function tenant(req, res, next) {
  try {
    let host = req.headers.host;

    if (!host) {
      return res.status(400).json({
        message: "No host found"
      });
    }

    // Remove localhost port
    host = host.replace(':5000', '');

    console.log("Incoming host:", host);

    // Main SaaS domains
    const mainDomains = [
      'timizaanalytics.com',
      'www.timizaanalytics.com',
      'timizaanalytics.vercel.app',
      'timiza-saas.onrender.com',
      'localhost'
    ];

    // ====================================================
    // SCHOOL CODE MODE
    // ====================================================
    // We DO NOT identify schools using the domain.
    // The school will be identified during login using:
    //
    //    schoolCode + email + password
    //
    // After login, the authenticated user's JWT contains
    // the school ID, which will be used by protected routes.
    // ====================================================

    req.school = null;

    // Optional logging
    if (mainDomains.includes(host) || host.includes('localhost')) {
      console.log("Running in School Code mode.");
    }

    return next();

  } catch (err) {
    console.error("Tenant middleware error:", err);

    return res.status(500).json({
      message: "Tenant error"
    });
  }
}

module.exports = tenant;
```
