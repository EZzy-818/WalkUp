const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/tokenService');

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;
const ALLOWED_ROLES = ['DINER', 'RESTAURANT_OWNER'];

/**
 * POST /api/auth/register
 * Body: { name, email, phone?, password, role? }
 * Returns: { success, data: { user, accessToken, refreshToken } }
 */
async function register(req, res) {
  const { name, email, phone, password, role = 'DINER' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'name, email, and password are required.' });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `role must be one of: ${ALLOWED_ROLES.join(', ')}.` });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, password_hash, role },
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, data: { user, accessToken, refreshToken } }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const { password_hash: _, ...safeUser } = user;

    return res.status(200).json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
}

/**
 * POST /api/auth/refresh-token
 * Body: { refreshToken }
 * Returns: { success, data: { accessToken } }
 */
async function refreshToken(req, res) {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'refreshToken is required.' });
  }

  try {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    const isTokenError = err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError';
    if (isTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
    }
    console.error('[refreshToken]', err);
    return res.status(500).json({ success: false, error: 'Token refresh failed. Please try again.' });
  }
}

module.exports = { register, login, refreshToken };
