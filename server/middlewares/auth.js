/**
 * @fileoverview Authentication middleware for protecting routes
 * @module middlewares/auth
 */

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken, getTokenFromHeader } = require('../utils/tokenUtils');

/**
 * Protect routes - require authentication
 * Verifies access token and attaches user to request
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Get token from header or cookie
  let token = getTokenFromHeader(req);
  
  // Fallback to cookie (for backward compatibility)
  if (!token && req.cookies.pain) {
    token = req.cookies.pain;
  }

  if (!token) {
    return next(new AppError('Please login to access this resource', 401));
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.message === 'Access token expired') {
      return next(new AppError('Your session has expired. Please login again', 401));
    }
    return next(new AppError('Invalid token. Please login again', 401));
  }

  // 3. Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists', 401));
  }

  // 4. Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please login again', 401));
  }

  // 5. Check if user is verified (except OAuth users)
  if (!user.isVerified && !user.isOAuth) {
    return next(new AppError('Please verify your email to access this resource', 403));
  }

  // Grant access
  req.user = user;
  next();
});

/**
 * Optional authentication - attach user if token exists but don't require it
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token = getTokenFromHeader(req);
  
  if (!token && req.cookies.pain) {
    token = req.cookies.pain;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
  } catch {
    // Token invalid, continue without user
  }

  next();
});

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Please login to access this resource', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Please login first', 401));
  }

  if (!req.user.isVerified && !req.user.isOAuth) {
    return next(new AppError('Please verify your email to access this feature', 403));
  }

  next();
};

/**
 * Check if user owns a resource or is admin
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 * @returns {Function} Middleware function
 */
const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        return next(new AppError('Resource not found', 404));
      }

      const userId = req.user._id.toString();
      const resourceOwnerId = ownerId.toString();

      if (userId !== resourceOwnerId) {
        return next(new AppError('You do not have permission to access this resource', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  requireVerified,
  requireOwnership,
};

