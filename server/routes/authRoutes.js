/**
 * @fileoverview Authentication routes
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { googleOauth, googleOauthCallback } = require('../controllers/googleController');
const { protect } = require('../middlewares/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../validators/authValidator');
const { loginLimiter, registerLimiter, passwordResetLimiter, verificationResendLimiter } = require('../config/rateLimiter');

// ==================== Public Routes ====================

// Registration
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  authController.register
);

// Email verification
router.get('/verify/:token', authController.verifyEmail);
router.post(
  '/resend-verification',
  verificationResendLimiter,
  authController.resendVerification
);

// Login
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  authController.login
);

// Token refresh (uses HTTP-only cookie)
router.post('/refresh', authController.refreshToken);

// Password reset
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Google OAuth
router.get('/google', googleOauth);
router.get('/google/callback', googleOauthCallback);

// Legacy endpoint for backward compatibility
router.post('/isLoggedIn', protect, authController.getMe);

// ==================== Protected Routes ====================

// Logout
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);

// Get current user
router.get('/me', protect, authController.getMe);

// Change password
router.patch(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
