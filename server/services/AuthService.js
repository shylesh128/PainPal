/**
 * @fileoverview Authentication service handling registration, login, tokens, and password management
 * @module services/AuthService
 */

const User = require('../models/userModel');
const EmailService = require('./EmailService');
const AppError = require('../utils/appError');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/passwordUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} = require('../utils/tokenUtils');

/**
 * Authentication Service class implementing Single Responsibility Principle
 * Handles all authentication-related business logic
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Created user (without sensitive data)
   * @throws {AppError} If validation fails or user exists
   */
  async register({ name, email, password }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join('. '), 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const { token: verificationToken, tokenHash: verificationTokenHash } = generateRandomToken();

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      verificationToken: verificationTokenHash,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isVerified: false,
    });

    // Send verification email (don't await - fire and forget)
    EmailService.sendVerificationEmail(user, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err.message);
    });

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.verificationExpires;

    return userResponse;
  }

  /**
   * Verify user email
   * @param {string} token - Verification token (unhashed)
   * @returns {Promise<Object>} Verified user
   * @throws {AppError} If token is invalid or expired
   */
  async verifyEmail(token) {
    const hashedToken = hashToken(token);

    const user = await User.findByVerificationToken(hashedToken);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Update user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    EmailService.sendWelcomeEmail(user).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    return user;
  }

  /**
   * Resend verification email
   * @param {string} email - User's email
   * @returns {Promise<void>}
   * @throws {AppError} If user not found or already verified
   */
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    if (user.isVerified) {
      throw new AppError('This email is already verified', 400);
    }

    // Generate new verification token
    const { token: verificationToken, tokenHash: verificationTokenHash } = generateRandomToken();

    user.verificationToken = verificationTokenHash;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await EmailService.sendVerificationEmail(user, verificationToken);
  }

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} [deviceInfo] - Device information for refresh token
   * @returns {Promise<Object>} Access token, refresh token, and user data
   * @throws {AppError} If credentials are invalid
   */
  async login(email, password, deviceInfo = 'unknown') {
    // Find user with password
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new AppError(`Account is locked. Try again in ${lockTime} minutes`, 423);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified (skip for OAuth users)
    if (!user.isVerified && !user.isOAuth) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, tokenHash } = generateRefreshToken(user, deviceInfo);

    // Store refresh token hash
    await user.addRefreshToken(tokenHash, deviceInfo);

    // Update last active
    user.lastActiveAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Return tokens and user (without sensitive data)
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.failedLoginAttempts;
    delete userResponse.lockUntil;
    delete userResponse.refreshTokens;

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} New access token
   * @throws {AppError} If refresh token is invalid
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Find user with refresh tokens
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Verify token exists in user's tokens
    const tokenHash = hashToken(refreshToken);
    if (!user.hasValidRefreshToken(tokenHash)) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AppError('Password was changed. Please login again', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { accessToken };
  }

  /**
   * Logout user (invalidate refresh token)
   * @param {string} userId - User's ID
   * @param {string} refreshToken - The refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(userId, refreshToken) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    const tokenHash = hashToken(refreshToken);
    await user.removeRefreshToken(tokenHash);
  }

  /**
   * Logout from all devices
   * @param {string} userId - User's ID
   * @returns {Promise<void>}
   */
  async logoutAll(userId) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    await user.removeAllRefreshTokens();
  }

  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Don't allow password reset for OAuth-only users
    if (user.isOAuth && !user.password) {
      return;
    }

    // Generate reset token
    const { token: resetToken, tokenHash: resetTokenHash } = generateRandomToken();

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send reset email
    await EmailService.sendPasswordResetEmail(user, resetToken);
  }

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @throws {AppError} If token is invalid or password is weak
   */
  async resetPassword(token, newPassword) {
    const hashedToken = hashToken(token);

    const user = await User.findByPasswordResetToken(hashedToken);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join('. '), 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // Invalidate all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
    
    await user.save({ validateBeforeSave: false });

    // Send notification email
    EmailService.sendPasswordChangedEmail(user).catch((err) => {
      console.error('Failed to send password changed email:', err.message);
    });
  }

  /**
   * Change password (logged in user)
   * @param {string} userId - User's ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @throws {AppError} If current password is wrong or new password is weak
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join('. '), 400);
    }

    // Check if new password is same as old
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Send notification email
    EmailService.sendPasswordChangedEmail(user).catch((err) => {
      console.error('Failed to send password changed email:', err.message);
    });
  }

  /**
   * Handle Google OAuth login/registration
   * @param {Object} googleUser - Google user info
   * @param {string} googleUser.email - User's email
   * @param {string} googleUser.name - User's name
   * @param {string} [googleUser.picture] - User's profile picture
   * @param {string} [deviceInfo] - Device information
   * @returns {Promise<Object>} Tokens and user
   */
  async handleGoogleAuth(googleUser, deviceInfo = 'unknown') {
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        photo: googleUser.picture || null,
        isOAuth: true,
        oAuthProvider: 'google',
        isVerified: true, // Google already verified their email
      });
    } else {
      // Update OAuth status if existing user
      if (!user.isOAuth) {
        user.isOAuth = true;
        user.oAuthProvider = 'google';
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      await user.save({ validateBeforeSave: false });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, tokenHash } = generateRefreshToken(user, deviceInfo);

    // Store refresh token
    await user.addRefreshToken(tokenHash, deviceInfo);

    // Update last active
    user.lastActiveAt = new Date();
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}

// Export singleton instance
module.exports = new AuthService();

