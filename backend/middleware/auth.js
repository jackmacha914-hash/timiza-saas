const jwt = require('jsonwebtoken');
const config = require('config');

/**

* Middleware to verify JWT token
  */
  const protect = (req, res, next) => {
  if (req.method === 'OPTIONS') {
  return next();
  }

console.log('Auth middleware - Headers:', req.headers);

let token = req.header('x-auth-token');

if (!token && req.header('Authorization')) {
const authHeader = req.header('Authorization');

```
if (authHeader.startsWith('Bearer ')) {
  token = authHeader.split(' ')[1];
} else {
  token = authHeader;
}
```

}

if (!token) {
return res.status(401).json({
success: false,
msg: 'No token, authorization denied'
});
}

try {
const jwtSecret =
process.env.JWT_SECRET ||
config.get('jwtSecret');

```
if (!jwtSecret) {
  return res.status(500).json({
    success: false,
    message: 'Server configuration error'
  });
}

const decoded = jwt.verify(token, jwtSecret);

if (!decoded) {
  return res.status(401).json({
    success: false,
    message: 'Invalid token'
  });
}

/**
 * Normalize payload
 */

if (decoded.user) {
  req.user = {
    id: decoded.user.id || decoded.user._id,
    role: decoded.user.role,
    school: decoded.user.school,
    ...decoded.user
  };
} else if (decoded.id) {
  req.user = {
    id: decoded.id,
    role: decoded.role,
    school: decoded.school,
    ...decoded
  };
} else if (decoded.userId) {
  req.user = {
    id: decoded.userId,
    role: decoded.role,
    school: decoded.school,
    ...decoded
  };
} else {
  throw new Error(
    'Invalid token format'
  );
}

console.log(
  '[AUTH] Authenticated user:',
  req.user
);

next();
```

} catch (err) {
console.error(
'[AUTH ERROR]',
err
);

```
if (err.name === 'TokenExpiredError') {
  return res.status(401).json({
    success: false,
    message:
      'Token has expired. Please log in again.'
  });
}

if (err.name === 'JsonWebTokenError') {
  return res.status(401).json({
    success: false,
    message:
      'Invalid token. Please log in again.'
  });
}

return res.status(401).json({
  success: false,
  message: 'Authentication failed'
});
```

}
};

/**

* Role Authorization
  */
  const authorize = (...roles) => {
  return (req, res, next) => {
  if (!req.user) {
  return res.status(401).json({
  success: false,
  msg: 'Not authorized'
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

  if (
  !allowedRoles.includes(userRole)
  ) {
  return res.status(403).json({
  success: false,
  msg: `User role '${req.user.role}' is not authorized`
  });
  }

  next();
  };
  };

module.exports = {
protect,
authorize
};
