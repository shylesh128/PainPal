const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const tokenService = require("../utils/tokenService");

/**
 * Auth Middleware - Protects routes requiring authentication
 * Handles both access token verification and expiry detection
 */
const authMiddleware = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies["pain"]) {
    token = req.cookies["pain"];
  }

  if (!token) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  // Verify the access token
  const decoded = tokenService.verifyAccessToken(token);

  if (!decoded) {
    // Check if token is expired (client should refresh)
    if (tokenService.isTokenExpired(token)) {
      return res.status(401).json({
        status: "fail",
        message: "Token expired. Please refresh your token.",
        expired: true,
        code: "TOKEN_EXPIRED",
      });
    }
    return next(new AppError("Invalid token. Please log in again.", 401));
  }

  // Get user from database
  const user = await User.findById(decoded.userId);

  if (!user) {
    return next(new AppError("User no longer exists.", 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(
      new AppError(
        "Your account is locked. Please reset your password to unlock.",
        403
      )
    );
  }

  // Attach user to request
  req.user = user;
  req.token = token;
  next();
});

/**
 * Optional Auth Middleware - Attaches user if token exists, but doesn't require it
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies["pain"]) {
    token = req.cookies["pain"];
  }

  if (token) {
    const decoded = tokenService.verifyAccessToken(token);
    if (decoded) {
      const user = await User.findById(decoded.userId);
      if (user && !user.isLocked) {
        req.user = user;
        req.token = token;
      }
    }
  }

  next();
});

/**
 * Refresh Token Middleware - For routes that accept refresh tokens
 */
const refreshTokenAuth = catchAsync(async (req, res, next) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError("Refresh token required.", 401));
  }

  const decoded = tokenService.verifyRefreshToken(refreshToken);
  if (!decoded) {
    return next(new AppError("Invalid or expired refresh token.", 401));
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AppError("User no longer exists.", 401));
  }

  req.user = user;
  req.refreshToken = refreshToken;
  next();
});

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
module.exports.refreshTokenAuth = refreshTokenAuth;
