/**
 * @fileoverview JWT token utilities for authentication
 * @module utils/tokenUtils
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const ACCESS_TOKEN_SECRET = process.env.SECRET_KEY || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET_KEY || process.env.SECRET_KEY || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Generate access token for a user
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

/**
 * Generate refresh token for a user
 * @param {Object} user - User object
 * @param {string} [deviceInfo] - Device information
 * @returns {Object} Token and token hash
 */
const generateRefreshToken = (user, deviceInfo = 'unknown') => {
  const token = jwt.sign(
    {
      id: user._id,
      device: deviceInfo,
      type: 'refresh',
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );

  const tokenHash = hashToken(token);

  return { token, tokenHash };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

/**
 * Generate a random token (for email verification, password reset, etc.)
 * @returns {Object} Token and its hash
 */
const generateRandomToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Decode token without verification (for inspection)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

/**
 * Get token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null
 */
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  return extractBearerToken(authHeader);
};

/**
 * Get refresh token cookie options
 * @returns {Object} Cookie options
 */
const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  decodeToken,
  extractBearerToken,
  getTokenFromHeader,
  getRefreshTokenCookieOptions,
};

