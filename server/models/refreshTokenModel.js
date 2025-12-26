const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Device info for security tracking
  deviceInfo: {
    device: String,
    os: String,
    browser: String,
    ip: String,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
});

// Index for automatic cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
  return await this.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true }
  );
};

// Static method to revoke a specific token
refreshTokenSchema.statics.revokeToken = async function (token) {
  return await this.findOneAndUpdate({ token }, { isRevoked: true });
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function (token) {
  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;

