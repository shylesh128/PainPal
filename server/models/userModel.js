/**
 * @fileoverview Enhanced User model with authentication, profile, and security fields
 * @module models/userModel
 */

const mongoose = require('mongoose');

/**
 * Status sub-schema for user status messages
 */
const statusSchema = new mongoose.Schema({
  text: {
    type: String,
    maxlength: 128,
  },
  emoji: {
    type: String,
    maxlength: 10,
  },
  expiresAt: {
    type: Date,
  },
}, { _id: false });

/**
 * Badge sub-schema for user achievements
 */
const badgeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['first-post', 'helper', 'veteran', 'creator', 'community-pillar', 'supporter'],
    required: true,
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * Privacy settings sub-schema
 */
const privacySchema = new mongoose.Schema({
  profileVisibility: {
    type: String,
    enum: ['public', 'friends', 'anonymous'],
    default: 'public',
  },
  showOnlineStatus: {
    type: Boolean,
    default: true,
  },
  allowDMs: {
    type: String,
    enum: ['everyone', 'friends', 'none'],
    default: 'everyone',
  },
}, { _id: false });

/**
 * User statistics sub-schema (denormalized for performance)
 */
const statsSchema = new mongoose.Schema({
  postsCount: {
    type: Number,
    default: 0,
  },
  friendsCount: {
    type: Number,
    default: 0,
  },
  serversJoined: {
    type: Number,
    default: 0,
  },
  karma: {
    type: Number,
    default: 0,
  },
}, { _id: false });

/**
 * Friend relationship sub-schema
 */
const friendSchema = new mongoose.Schema({
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * Refresh token sub-schema for multi-device support
 */
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
  },
  device: {
    type: String,
    default: 'unknown',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { _id: false });

/**
 * Main User schema
 */
const userSchema = new mongoose.Schema({
  // ==================== Authentication ====================
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Never return password in queries by default
  },
  
  // ==================== Verification ====================
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    select: false,
  },
  verificationExpires: {
    type: Date,
    select: false,
  },
  
  // ==================== Password Reset ====================
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
  },
  
  // ==================== Security ====================
  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    select: false,
  },
  refreshTokens: {
    type: [refreshTokenSchema],
    select: false,
  },
  
  // ==================== Profile - Basic ====================
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true,
    lowercase: true,
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '',
  },
  photo: {
    type: String,
    default: null,
  },
  banner: {
    type: String,
    default: null,
  },
  
  // ==================== Profile - Status & Mood ====================
  status: {
    type: statusSchema,
    default: () => ({}),
  },
  mood: {
    type: String,
    enum: ['seeking-support', 'here-to-help', 'just-browsing', 'offline'],
    default: 'just-browsing',
  },
  
  // ==================== Gamification ====================
  badges: {
    type: [badgeSchema],
    default: [],
  },
  
  // ==================== Privacy ====================
  privacy: {
    type: privacySchema,
    default: () => ({}),
  },
  
  // ==================== Statistics ====================
  stats: {
    type: statsSchema,
    default: () => ({}),
  },
  
  // ==================== Relationships ====================
  friends: {
    type: [friendSchema],
    default: [],
  },
  servers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
  }],
  
  // ==================== OAuth ====================
  isOAuth: {
    type: Boolean,
    default: false,
  },
  oAuthProvider: {
    type: String,
    enum: ['google', 'github', null],
    default: null,
  },
  
  // ==================== Chat ====================
  globalId: {
    type: String,
    default: null,
  },
  
  // ==================== Feature Flags ====================
  notesEnabled: {
    type: Boolean,
    default: false,
  },
  
  // ==================== Timestamps ====================
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ==================== Indexes ====================
// Note: email already has unique: true which creates an index automatically
// Note: username already has unique: true + sparse which creates an index automatically
userSchema.index({ 'friends.friendId': 1 });
userSchema.index({ createdAt: -1 });

// ==================== Virtual Properties ====================

/**
 * Check if user account is locked
 */
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Get display name (username or name)
 */
userSchema.virtual('displayName').get(function() {
  return this.username || this.name;
});

// ==================== Instance Methods ====================

/**
 * Check if user password was changed after token was issued
 * @param {number} JWTTimestamp - The timestamp when JWT was issued
 * @returns {boolean}
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Increment failed login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function() {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
  
  // If we have a previous lock that has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts
  if (this.failedLoginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Add a refresh token
 * @param {string} tokenHash - The hashed refresh token
 * @param {string} device - Device information
 * @returns {Promise<void>}
 */
userSchema.methods.addRefreshToken = async function(tokenHash, device = 'unknown') {
  const MAX_TOKENS = 5; // Maximum number of devices
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Remove expired tokens and keep only last MAX_TOKENS - 1
  const validTokens = this.refreshTokens
    .filter(t => t.expiresAt > Date.now())
    .slice(-(MAX_TOKENS - 1));
  
  validTokens.push({ tokenHash, device, expiresAt });
  
  this.refreshTokens = validTokens;
  await this.save({ validateBeforeSave: false });
};

/**
 * Remove a refresh token
 * @param {string} tokenHash - The hashed refresh token to remove
 * @returns {Promise<void>}
 */
userSchema.methods.removeRefreshToken = async function(tokenHash) {
  this.refreshTokens = this.refreshTokens.filter(t => t.tokenHash !== tokenHash);
  await this.save({ validateBeforeSave: false });
};

/**
 * Remove all refresh tokens (logout from all devices)
 * @returns {Promise<void>}
 */
userSchema.methods.removeAllRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save({ validateBeforeSave: false });
};

/**
 * Check if a refresh token exists and is valid
 * @param {string} tokenHash - The hashed refresh token
 * @returns {boolean}
 */
userSchema.methods.hasValidRefreshToken = function(tokenHash) {
  return this.refreshTokens.some(
    t => t.tokenHash === tokenHash && t.expiresAt > Date.now()
  );
};

/**
 * Update user's karma score
 * @param {number} amount - Amount to add (can be negative)
 * @returns {Promise<void>}
 */
userSchema.methods.updateKarma = async function(amount) {
  this.stats.karma = Math.max(0, (this.stats.karma || 0) + amount);
  await this.save({ validateBeforeSave: false });
};

/**
 * Award a badge to the user
 * @param {string} badgeType - The type of badge
 * @returns {Promise<boolean>} True if badge was awarded (not duplicate)
 */
userSchema.methods.awardBadge = async function(badgeType) {
  const hasBadge = this.badges.some(b => b.type === badgeType);
  if (hasBadge) return false;
  
  this.badges.push({ type: badgeType, earnedAt: new Date() });
  await this.save({ validateBeforeSave: false });
  return true;
};

// ==================== Static Methods ====================

/**
 * Find user by email with password field
 * @param {string} email - User email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password +failedLoginAttempts +lockUntil');
};

/**
 * Find user by verification token
 * @param {string} hashedToken - The hashed verification token
 * @returns {Promise<User>}
 */
userSchema.statics.findByVerificationToken = function(hashedToken) {
  return this.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() },
  }).select('+verificationToken +verificationExpires');
};

/**
 * Find user by password reset token
 * @param {string} hashedToken - The hashed reset token
 * @returns {Promise<User>}
 */
userSchema.statics.findByPasswordResetToken = function(hashedToken) {
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
