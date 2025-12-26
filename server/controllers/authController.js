/**
 * @fileoverview Authentication controller - thin layer delegating to AuthService
 * @module controllers/authController
 */

const AuthService = require('../services/AuthService');
const catchAsync = require('../utils/catchAsync');
const { getRefreshTokenCookieOptions } = require('../utils/tokenUtils');

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await AuthService.register({ name, email, password });

  res.status(201).json({
    status: 'success',
    message: 'Registration successful! Please check your email to verify your account.',
    data: { user },
  });
});

/**
 * Verify email with token
 * @route GET /api/v1/auth/verify/:token
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  await AuthService.verifyEmail(token);

  // Redirect to login page with success message
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4008';
  res.redirect(`${frontendUrl}/login?verified=true`);
});

/**
 * Resend verification email
 * @route POST /api/v1/auth/resend-verification
 */
const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;

  await AuthService.resendVerificationEmail(email);

  // Always return success to prevent email enumeration
  res.status(200).json({
    status: 'success',
    message: 'If an account exists with this email, a verification link has been sent.',
  });
});

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'unknown';

  const { accessToken, refreshToken, user } = await AuthService.login(
    email,
    password,
    deviceInfo
  );

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  // Also set the legacy 'pain' cookie for backward compatibility with existing frontend
  res.cookie('pain', accessToken, {
    ...getRefreshTokenCookieOptions(),
    httpOnly: false, // Allow frontend access for now
  });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      accessToken,
      user,
    },
  });
});

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 */
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'No refresh token provided',
    });
  }

  const { accessToken } = await AuthService.refreshAccessToken(token);

  // Update the legacy cookie as well
  res.cookie('pain', accessToken, {
    ...getRefreshTokenCookieOptions(),
    httpOnly: false,
  });

  res.status(200).json({
    status: 'success',
    data: { accessToken },
  });
});

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (req.user && token) {
    await AuthService.logout(req.user._id, token);
  }

  // Clear cookies
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('pain', { path: '/' });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * Logout from all devices
 * @route POST /api/v1/auth/logout-all
 */
const logoutAll = catchAsync(async (req, res) => {
  await AuthService.logoutAll(req.user._id);

  // Clear cookies
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('pain', { path: '/' });

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices',
  });
});

/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  await AuthService.forgotPassword(email);

  // Always return success to prevent email enumeration
  res.status(200).json({
    status: 'success',
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

/**
 * Reset password with token
 * @route POST /api/v1/auth/reset-password/:token
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  await AuthService.resetPassword(token, password);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful. You can now login with your new password.',
  });
});

/**
 * Change password (authenticated user)
 * @route PATCH /api/v1/auth/change-password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await AuthService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

/**
 * Get current user (check auth status)
 * @route GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};

