const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  // Failed attempts in current lockout period
  attempts: {
    type: Number,
    default: 0,
  },
  // Total cumulative failed attempts across all periods
  totalAttempts: {
    type: Number,
    default: 0,
  },
  // Current lockout tier: 0=none, 1=30min, 2=1hr, 3=locked
  lockoutLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },
  // Timestamp when cooldown expires
  lockedUntil: {
    type: Date,
    default: null,
  },
  // Timestamp of last failed attempt
  lastAttempt: {
    type: Date,
    default: null,
  },
  // IP addresses of failed attempts (for security logging)
  attemptIps: [
    {
      ip: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

// Lockout configuration constants
loginAttemptSchema.statics.LOCKOUT_CONFIG = {
  ATTEMPTS_PER_TIER: 5,
  TIER_1_COOLDOWN: 30 * 60 * 1000, // 30 minutes
  TIER_2_COOLDOWN: 60 * 60 * 1000, // 1 hour
  MAX_TIER: 3, // Account locked after this
};

// Check if user is in cooldown
loginAttemptSchema.methods.isInCooldown = function () {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

// Get remaining cooldown time in seconds
loginAttemptSchema.methods.getRemainingCooldown = function () {
  if (!this.lockedUntil) return 0;
  const remaining = this.lockedUntil - new Date();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

// Get remaining attempts before next lockout
loginAttemptSchema.methods.getRemainingAttempts = function () {
  const config = loginAttemptSchema.statics.LOCKOUT_CONFIG;
  return config.ATTEMPTS_PER_TIER - this.attempts;
};

// Reset attempts after successful login
loginAttemptSchema.methods.resetAttempts = function () {
  this.attempts = 0;
  this.totalAttempts = 0;
  this.lockoutLevel = 0;
  this.lockedUntil = null;
  this.attemptIps = [];
};

// Static method to get or create login attempt record
loginAttemptSchema.statics.getOrCreate = async function (userId) {
  let record = await this.findOne({ user: userId });
  if (!record) {
    record = await this.create({ user: userId });
  }
  return record;
};

const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);

module.exports = LoginAttempt;

