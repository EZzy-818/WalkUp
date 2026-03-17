const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
}

/**
 * Creates a short-lived access token (15 min) containing the user's id and role.
 * Used to authenticate individual API requests.
 *
 * @param {{ id: string, role: string }} user
 * @returns {string} signed JWT
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Creates a long-lived refresh token (7 days) containing only the user's id.
 * Used to obtain a new access token without re-authentication.
 *
 * @param {{ id: string }} user
 * @returns {string} signed JWT
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifies a refresh token and returns its decoded payload.
 * Throws if the token is invalid or expired.
 *
 * @param {string} token
 * @returns {{ sub: string, iat: number, exp: number }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
