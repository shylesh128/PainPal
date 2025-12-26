const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null for OAuth users
    trim: true,
    lowercase: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: [8, "Password must be at least 8 characters"],
    select: false, // Don't include password in queries by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  globalId: {
    type: String,
    default: null,
  },
  isOAuth: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
    default: null,
  },
  friends: [
    {
      friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Password reset fields
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  // Account lock fields
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockReason: {
    type: String,
    default: null,
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
  },
  verificationEmailSentAt: {
    type: Date,
    default: null,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Token expires in 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  this.verificationEmailSentAt = Date.now();

  return verificationToken;
};

// Clear email verification token
userSchema.methods.clearEmailVerificationToken = function () {
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
};

// Check if can resend verification email (rate limit: 1 per minute)
userSchema.methods.canResendVerificationEmail = function () {
  if (!this.verificationEmailSentAt) return true;
  const oneMinuteAgo = Date.now() - 60 * 1000;
  return this.verificationEmailSentAt < oneMinuteAgo;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
