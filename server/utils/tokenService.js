const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/refreshTokenModel");

const SECRET_KEY = process.env.SECRET_KEY;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "30m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

/**
 * Token Service - Handles JWT access and refresh token generation/verification
 * Following Single Responsibility Principle
 */
const tokenService = {
  /**
   * Generate access token (short-lived)
   * @param {string} userId - User's MongoDB _id
   * @returns {string} JWT access token
   */
  generateAccessToken(userId) {
    return jwt.sign({ userId, type: "access" }, SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  },

  /**
   * Generate refresh token (long-lived)
   * @param {string} userId - User's MongoDB _id
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(userId) {
    const tokenId = crypto.randomBytes(16).toString("hex");
    return jwt.sign({ userId, tokenId, type: "refresh" }, SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  },

  /**
   * Generate both access and refresh tokens
   * @param {string} userId - User's MongoDB _id
   * @param {object} deviceInfo - Device information for security tracking
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async generateTokenPair(userId, deviceInfo = {}) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Calculate refresh token expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in database
    await RefreshToken.create({
      user: userId,
      token: refreshToken,
      expiresAt,
      deviceInfo,
    });

    return { accessToken, refreshToken };
  },

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {object|null} Decoded token or null if invalid
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.type !== "access") return null;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {object|null} Decoded token or null if invalid
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.type !== "refresh") return null;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  /**
   * Refresh tokens - validate refresh token and issue new pair
   * @param {string} refreshToken - Current refresh token
   * @param {object} deviceInfo - Device information
   * @returns {Promise<{accessToken: string, refreshToken: string}|null>}
   */
  async refreshTokens(refreshToken, deviceInfo = {}) {
    // Verify the JWT
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) return null;

    // Check if token exists and is valid in database
    const storedToken = await RefreshToken.findValidToken(refreshToken);
    if (!storedToken) return null;

    // Revoke the old refresh token
    await RefreshToken.revokeToken(refreshToken);

    // Generate new token pair
    return await this.generateTokenPair(decoded.userId, deviceInfo);
  },

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   * @param {string} userId - User's MongoDB _id
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.revokeAllForUser(userId);
  },

  /**
   * Revoke a specific refresh token
   * @param {string} token - Refresh token to revoke
   */
  async revokeToken(token) {
    await RefreshToken.revokeToken(token);
  },

  /**
   * Check if token is expired (without throwing)
   * @param {string} token - JWT token
   * @returns {boolean}
   */
  isTokenExpired(token) {
    try {
      jwt.verify(token, SECRET_KEY);
      return false;
    } catch (error) {
      return error.name === "TokenExpiredError";
    }
  },

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {object|null}
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  },
};

module.exports = tokenService;

