const LoginAttempt = require("../models/loginAttemptModel");
const User = require("../models/userModel");
const emailService = require("./emailService");

/**
 * Login Attempt Service - Handles brute force protection
 * Following Single Responsibility Principle
 * 
 * Progressive Lockout Rules:
 * - 1-5 failed attempts: Warning with remaining attempts
 * - 5th failure: 30 minute cooldown
 * - 6-10 failed attempts: Warning with remaining attempts
 * - 10th failure: 1 hour cooldown
 * - 11-15 failed attempts: Warning with remaining attempts
 * - 15th failure: Account locked + security email sent
 */

const LOCKOUT_CONFIG = LoginAttempt.LOCKOUT_CONFIG;

const loginAttemptService = {
  /**
   * Check if user can attempt login
   * @param {string} userId - User's MongoDB _id
   * @returns {Promise<{canAttempt: boolean, reason?: string, remainingTime?: number, remainingAttempts?: number}>}
   */
  async checkLoginStatus(userId) {
    const user = await User.findById(userId);
    
    // Check if account is permanently locked
    if (user && user.isLocked) {
      return {
        canAttempt: false,
        reason: "account_locked",
        message: "Your account is locked. Please reset your password to unlock.",
      };
    }

    const record = await LoginAttempt.getOrCreate(userId);

    // Check if in cooldown period
    if (record.isInCooldown()) {
      const remainingTime = record.getRemainingCooldown();
      return {
        canAttempt: false,
        reason: "cooldown",
        remainingTime,
        message: `Too many failed attempts. Please try again in ${this.formatTime(remainingTime)}.`,
      };
    }

    return {
      canAttempt: true,
      remainingAttempts: record.getRemainingAttempts(),
    };
  },

  /**
   * Record a failed login attempt
   * @param {string} userId - User's MongoDB _id
   * @param {string} ip - IP address of the attempt
   * @returns {Promise<{locked: boolean, cooldown: boolean, remainingAttempts: number, message: string}>}
   */
  async recordFailedAttempt(userId, ip = "unknown") {
    const record = await LoginAttempt.getOrCreate(userId);
    
    // Increment counters
    record.attempts += 1;
    record.totalAttempts += 1;
    record.lastAttempt = new Date();
    
    // Add IP to attempt log
    record.attemptIps.push({ ip, timestamp: new Date() });
    
    // Keep only last 20 IPs
    if (record.attemptIps.length > 20) {
      record.attemptIps = record.attemptIps.slice(-20);
    }

    const result = {
      locked: false,
      cooldown: false,
      remainingAttempts: 0,
      message: "",
    };

    // Check if we need to apply lockout
    if (record.attempts >= LOCKOUT_CONFIG.ATTEMPTS_PER_TIER) {
      record.lockoutLevel += 1;
      record.attempts = 0; // Reset for next tier

      if (record.lockoutLevel >= LOCKOUT_CONFIG.MAX_TIER) {
        // Account locked
        result.locked = true;
        result.message = "Your account has been locked due to too many failed attempts. Please check your email.";
        
        // Lock the user account
        await this.lockUserAccount(userId, record.attemptIps);
      } else if (record.lockoutLevel === 1) {
        // 30 minute cooldown
        record.lockedUntil = new Date(Date.now() + LOCKOUT_CONFIG.TIER_1_COOLDOWN);
        result.cooldown = true;
        result.message = "Too many failed attempts. Please try again in 30 minutes.";
      } else if (record.lockoutLevel === 2) {
        // 1 hour cooldown
        record.lockedUntil = new Date(Date.now() + LOCKOUT_CONFIG.TIER_2_COOLDOWN);
        result.cooldown = true;
        result.message = "Too many failed attempts. Please try again in 1 hour.";
      }
    } else {
      result.remainingAttempts = LOCKOUT_CONFIG.ATTEMPTS_PER_TIER - record.attempts;
      result.message = `Invalid credentials. ${result.remainingAttempts} attempt(s) remaining.`;
    }

    await record.save();
    return result;
  },

  /**
   * Reset login attempts after successful login
   * @param {string} userId - User's MongoDB _id
   */
  async resetAttempts(userId) {
    const record = await LoginAttempt.findOne({ user: userId });
    if (record) {
      record.resetAttempts();
      await record.save();
    }
  },

  /**
   * Lock user account and send security email
   * @param {string} userId - User's MongoDB _id
   * @param {array} attemptIps - List of IP addresses
   */
  async lockUserAccount(userId, attemptIps = []) {
    const user = await User.findById(userId);
    if (!user) return;

    user.isLocked = true;
    user.lockReason = "Too many failed login attempts";
    await user.save();

    // Send security alert email
    await emailService.sendSecurityAlertEmail(
      user.email,
      user.username || user.name,
      attemptIps
    );
  },

  /**
   * Unlock user account (called after password reset)
   * @param {string} userId - User's MongoDB _id
   */
  async unlockUserAccount(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.isLocked = false;
      user.lockReason = null;
      await user.save();
    }

    // Reset login attempts
    await this.resetAttempts(userId);
  },

  /**
   * Format seconds to human readable time
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes} minute(s) and ${remainingSeconds} second(s)`
        : `${minutes} minute(s)`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} hour(s) and ${remainingMinutes} minute(s)`
      : `${hours} hour(s)`;
  },

  /**
   * Get login attempt info for a user (for admin/debugging)
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getAttemptInfo(userId) {
    const record = await LoginAttempt.findOne({ user: userId });
    if (!record) {
      return { attempts: 0, totalAttempts: 0, lockoutLevel: 0 };
    }
    return {
      attempts: record.attempts,
      totalAttempts: record.totalAttempts,
      lockoutLevel: record.lockoutLevel,
      lockedUntil: record.lockedUntil,
      isInCooldown: record.isInCooldown(),
      remainingCooldown: record.getRemainingCooldown(),
      remainingAttempts: record.getRemainingAttempts(),
    };
  },
};

module.exports = loginAttemptService;

