const UserPresence = require("../models/userPresenceModel");
const Conversation = require("../models/conversationModel");

/**
 * Presence Service
 * Handles online status, typing indicators, and user presence
 * Following Single Responsibility Principle
 */

// Typing debounce timeouts (in-memory for performance)
const typingTimeouts = new Map();
const TYPING_TIMEOUT = 3000; // 3 seconds

const presenceService = {
  /**
   * Set user as online
   */
  async setOnline(userId, socketId, deviceInfo = null) {
    return await UserPresence.setOnline(userId, socketId, deviceInfo);
  },

  /**
   * Set user as offline
   */
  async setOffline(userId) {
    // Clear any typing timeouts
    this.clearTypingTimeout(userId);

    return await UserPresence.setOffline(userId);
  },

  /**
   * Get user's presence status
   */
  async getPresence(userId) {
    return await UserPresence.getPresence(userId);
  },

  /**
   * Get presence for multiple users
   */
  async getMultiplePresence(userIds) {
    return await UserPresence.getMultiplePresence(userIds);
  },

  /**
   * Check if user is online
   */
  async isOnline(userId) {
    const presence = await UserPresence.getPresence(userId);
    return presence?.status === "online";
  },

  /**
   * Get online participants in a conversation
   */
  async getOnlineParticipants(conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .select("participants.user")
      .lean();

    if (!conversation) {
      return [];
    }

    const participantIds = conversation.participants.map((p) => p.user);
    return await UserPresence.getOnlineInConversation(participantIds);
  },

  /**
   * Set typing status with auto-clear
   */
  async setTyping(userId, conversationId, isTyping) {
    // Clear existing timeout
    this.clearTypingTimeout(userId);

    if (isTyping) {
      // Set auto-clear timeout
      const timeout = setTimeout(async () => {
        await UserPresence.setTyping(userId, conversationId, false);
        typingTimeouts.delete(userId.toString());
      }, TYPING_TIMEOUT);

      typingTimeouts.set(userId.toString(), timeout);
    }

    return await UserPresence.setTyping(userId, conversationId, isTyping);
  },

  /**
   * Clear typing timeout for user
   */
  clearTypingTimeout(userId) {
    const existing = typingTimeouts.get(userId.toString());
    if (existing) {
      clearTimeout(existing);
      typingTimeouts.delete(userId.toString());
    }
  },

  /**
   * Get users typing in a conversation
   */
  async getTypingUsers(conversationId) {
    return await UserPresence.getTypingInConversation(conversationId);
  },

  /**
   * Set user's active conversation (for read tracking)
   */
  async setActiveConversation(userId, conversationId) {
    return await UserPresence.setActiveConversation(userId, conversationId);
  },

  /**
   * Get user's socket ID for direct messaging
   */
  async getSocketId(userId) {
    return await UserPresence.getSocketId(userId);
  },

  /**
   * Get socket IDs for multiple users
   */
  async getSocketIds(userIds) {
    const presences = await UserPresence.getMultiplePresence(userIds);
    const socketIds = [];

    for (const userId of userIds) {
      const presence = presences[userId.toString()];
      if (presence?.socketId && presence.status === "online") {
        socketIds.push({
          userId: userId.toString(),
          socketId: presence.socketId,
        });
      }
    }

    return socketIds;
  },

  /**
   * Get last seen time for user
   */
  async getLastSeen(userId) {
    const presence = await UserPresence.getPresence(userId);
    return presence?.lastSeen || null;
  },

  /**
   * Update user status (online, away, busy)
   */
  async updateStatus(userId, status) {
    if (!["online", "away", "busy"].includes(status)) {
      throw new Error("Invalid status");
    }

    const presence = await UserPresence.findOneAndUpdate(
      { user: userId },
      { status },
      { new: true }
    );

    return presence;
  },

  /**
   * Get online status for friends list
   */
  async getFriendsOnlineStatus(userId) {
    const User = require("../models/userModel");

    const user = await User.findById(userId)
      .select("friends.friendId")
      .lean();

    if (!user || !user.friends) {
      return {};
    }

    const friendIds = user.friends.map((f) => f.friendId);
    return await this.getMultiplePresence(friendIds);
  },

  /**
   * Mark all users offline (for server restart)
   */
  async markAllOffline() {
    // Clear all typing timeouts
    for (const timeout of typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    typingTimeouts.clear();

    await UserPresence.markAllOffline();
  },

  /**
   * Clear presence cache
   */
  clearCache() {
    UserPresence.clearCache();
  },

  /**
   * Get presence statistics (for admin/debugging)
   */
  async getStats() {
    const onlineCount = await UserPresence.countDocuments({ status: "online" });
    const typingCount = await UserPresence.countDocuments({ isTyping: true });

    return {
      onlineUsers: onlineCount,
      typingUsers: typingCount,
      cachedTypingTimeouts: typingTimeouts.size,
    };
  },
};

module.exports = presenceService;

