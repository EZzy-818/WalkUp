const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;

if (!ACCESS_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables.');
}

/**
 * Verifies the Bearer token in the Authorization header.
 * On success, attaches the decoded payload to req.user and calls next().
 * On failure, responds 401 Unauthorized.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Access token has expired.'
      : 'Invalid access token.';
    return res.status(401).json({ success: false, error: message });
  }
}

module.exports = authenticate;
