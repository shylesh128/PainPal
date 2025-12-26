/**
 * @fileoverview Cryptographic utilities for tokens and codes
 * @module utils/cryptoUtils
 */

const crypto = require('crypto');

/**
 * Generate a random invite code
 * @param {number} [length=8] - Length of the invite code
 * @returns {string} Alphanumeric invite code
 */
const generateInviteCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
};

/**
 * Generate a secure random token
 * @param {number} [bytes=32] - Number of random bytes
 * @returns {string} Hex-encoded token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a string using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
const hashSHA256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random numeric OTP
 * @param {number} [length=6] - Length of the OTP
 * @returns {string} Numeric OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  
  return otp;
};

/**
 * Generate a URL-safe random string
 * @param {number} [length=32] - Length of the string
 * @returns {string} URL-safe base64 string
 */
const generateUrlSafeToken = (length = 32) => {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

module.exports = {
  generateInviteCode,
  generateSecureToken,
  hashSHA256,
  generateOTP,
  generateUrlSafeToken,
};


