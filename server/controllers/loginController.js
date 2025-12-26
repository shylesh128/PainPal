const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const useragent = require("useragent");
const DeviceLog = require("../models/deviceModel");
const { getClientIp } = require("../utils/clientIp");
const tokenService = require("../utils/tokenService");
const emailService = require("../utils/emailService");
const loginAttemptService = require("../utils/loginAttemptService");

/**
 * Get device info from request
 */
const getDeviceInfo = (req) => {
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = getClientIp(req);
  return {
    device: agent.device?.toString() || "unknown",
    os: agent.os?.toString() || "unknown",
    browser: agent.toAgent() || "unknown",
    ip: ip || "unknown",
  };
};

/**
 * Log device access
 */
const logDeviceAccess = async (userId, deviceInfo) => {
  const deviceLog = new DeviceLog({
    user: userId,
    device: {
      device: deviceInfo.device,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
    },
    ip: deviceInfo.ip,
  });
  await deviceLog.save();
};

/**
 * Signup - Register new user with username, email, password
 */
const signup = catchAsync(async (req, res, next) => {
  const { username, email, password, name } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return next(new AppError("Username, email, and password are required", 400));
  }

  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }

  // Check if username or email already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      return next(new AppError("Email already registered", 400));
    }
    return next(new AppError("Username already taken", 400));
  }

  // Create new user
  const user = await User.create({
    name: name || username,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    isOAuth: false,
  });

  // Generate tokens
  const deviceInfo = getDeviceInfo(req);
  const { accessToken, refreshToken } = await tokenService.generateTokenPair(
    user._id,
    deviceInfo
  );

  // Log device
  await logDeviceAccess(user._id, deviceInfo);

  // Send welcome email (non-blocking)
  emailService.sendWelcomeEmail(user.email, user.username).catch(console.error);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    token: accessToken,
    refreshToken,
    user,
  });
});

/**
 * Login - Authenticate with username/email and password
 */
const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError("Username and password are required", 400));
  }

  // Find user by username or email (include password for comparison)
  const user = await User.findOne({
    $or: [
      { username: username.toLowerCase() },
      { email: username.toLowerCase() },
    ],
  }).select("+password");

  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid credentials",
    });
  }

  // Check if user is OAuth-only (no password set)
  if (user.isOAuth && !user.password) {
    return res.status(400).json({
      status: "fail",
      message: "This account uses social login. Please use Google or GitHub to sign in.",
    });
  }

  // Check login status (lockout/cooldown)
  const loginStatus = await loginAttemptService.checkLoginStatus(user._id);
  if (!loginStatus.canAttempt) {
    return res.status(429).json({
      status: "fail",
      reason: loginStatus.reason,
      message: loginStatus.message,
      remainingTime: loginStatus.remainingTime,
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const ip = getClientIp(req);
    const failResult = await loginAttemptService.recordFailedAttempt(user._id, ip);
    
    return res.status(401).json({
      status: "fail",
      message: failResult.message,
      locked: failResult.locked,
      cooldown: failResult.cooldown,
      remainingAttempts: failResult.remainingAttempts,
    });
  }

  // Successful login - reset attempts
  await loginAttemptService.resetAttempts(user._id);

  // Generate tokens
  const deviceInfo = getDeviceInfo(req);
  const { accessToken, refreshToken } = await tokenService.generateTokenPair(
    user._id,
    deviceInfo
  );

  // Log device
  await logDeviceAccess(user._id, deviceInfo);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Also set access token in cookie for compatibility
  res.cookie("pain", accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    status: "success",
    message: "Login successful",
    token: accessToken,
    refreshToken,
    user,
  });
});

/**
 * Refresh Token - Get new access token using refresh token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;

  if (!token) {
    return next(new AppError("Refresh token required", 401));
  }

  const deviceInfo = getDeviceInfo(req);
  const tokens = await tokenService.refreshTokens(token, deviceInfo);

  if (!tokens) {
    return next(new AppError("Invalid or expired refresh token", 401));
  }

  // Set new refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Set new access token cookie
  res.cookie("pain", tokens.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 60 * 1000,
  });

  res.status(200).json({
    status: "success",
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * Forgot Password - Send password reset email
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      status: "success",
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const emailResult = await emailService.sendPasswordResetEmail(
    user.email,
    resetToken,
    baseUrl
  );

  if (!emailResult.success) {
    user.clearPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Error sending email. Please try again.", 500));
  }

  res.status(200).json({
    status: "success",
    message: "If an account exists with this email, a password reset link has been sent.",
  });
});

/**
 * Reset Password - Set new password using reset token
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new AppError("Token and new password are required", 400));
  }

  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired reset token", 400));
  }

  // Update password and clear reset token
  user.password = password;
  user.clearPasswordResetToken();
  
  // If account was locked, unlock it
  if (user.isLocked) {
    user.isLocked = false;
    user.lockReason = null;
    // Also reset login attempts
    await loginAttemptService.unlockUserAccount(user._id);
  }
  
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successful. You can now login with your new password.",
  });
});

/**
 * Logout - Revoke refresh token
 */
const logout = catchAsync(async (req, res, next) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;

  if (token) {
    await tokenService.revokeToken(token);
  }

  // Clear cookies
  res.clearCookie("pain");
  res.clearCookie("refreshToken");

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

/**
 * Logout All - Revoke all refresh tokens for user
 */
const logoutAll = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  await tokenService.revokeAllUserTokens(req.user._id);

  // Clear cookies
  res.clearCookie("pain");
  res.clearCookie("refreshToken");

  res.status(200).json({
    status: "success",
    message: "Logged out from all devices",
  });
});

/**
 * Get user by token - Verify token and return user
 */
const userByToken = catchAsync(async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "fail",
      message: "Authorization header is missing or invalid.",
    });
  }

  const token = authorizationHeader.split(" ")[1];
  const decoded = tokenService.verifyAccessToken(token);

  if (!decoded) {
    // Check if token is expired (for refresh flow)
    if (tokenService.isTokenExpired(token)) {
      return res.status(401).json({
        status: "fail",
        message: "Token expired",
        expired: true,
      });
    }
    return res.status(401).json({
      status: "fail",
      message: "Invalid token",
    });
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "User fetched successfully.",
    user,
  });
});

/**
 * Unlock Account - Admin endpoint to manually unlock
 */
const unlockAccount = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  await loginAttemptService.unlockUserAccount(userId);

  res.status(200).json({
    status: "success",
    message: "Account unlocked successfully",
  });
});

module.exports = {
  signup,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  userByToken,
  unlockAccount,
};
