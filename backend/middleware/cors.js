const corsMiddleware = (req, res, next) => {
const origin = req.headers.origin;

res.setHeader('Vary', 'Origin');

const allowedOrigins = [
'https://eagles-emulators-schools.onrender.com',
'http://localhost:3000',
'http://localhost:5173'
];

if (
!origin ||
allowedOrigins.includes(origin)
) {
if (origin) {
res.setHeader(
'Access-Control-Allow-Origin',
origin
);
}

```
res.setHeader(
  'Access-Control-Allow-Credentials',
  'true'
);

res.setHeader(
  'Access-Control-Allow-Methods',
  'GET,POST,PUT,PATCH,DELETE,OPTIONS'
);

res.setHeader(
  'Access-Control-Allow-Headers',
  'Content-Type,Authorization,x-auth-token,X-Requested-With,Cache-Control'
);
```

}

if (req.method === 'OPTIONS') {
return res.sendStatus(204);
}

next();
};

module.exports = corsMiddleware;
