const mongoose = require("mongoose");

/**
 * User Presence Model
 * Tracks online status, last seen, and typing indicators
 * Uses MongoDB with in-memory caching for performance
 */
const userPresenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Online status
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
    },

    // Last seen timestamp
    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // Current active conversation (for typing indicators)
    activeConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    // Socket ID for direct messaging
    socketId: {
      type: String,
      default: null,
    },

    // Connected device/client info
    deviceInfo: {
      type: String,
      default: null,
    },

    // Typing state
    isTyping: {
      type: Boolean,
      default: false,
    },

    // Typing in which conversation
    typingIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    // Last typing timestamp (for auto-clearing)
    lastTypingAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (user index is already created by unique: true in schema)
userPresenceSchema.index({ status: 1 });
userPresenceSchema.index({ socketId: 1 });

// In-memory cache for fast lookups
const presenceCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache TTL

// Helper: Get from cache
const getFromCache = (userId) => {
  const cached = presenceCache.get(userId.toString());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  presenceCache.delete(userId.toString());
  return null;
};

// Helper: Set to cache
const setToCache = (userId, data) => {
  presenceCache.set(userId.toString(), {
    data,
    timestamp: Date.now(),
  });
};

// Helper: Clear from cache
const clearFromCache = (userId) => {
  presenceCache.delete(userId.toString());
};

// Static: Set user online
userPresenceSchema.statics.setOnline = async function (
  userId,
  socketId,
  deviceInfo = null
) {
  const presence = await this.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      status: "online",
      socketId,
      deviceInfo,
      lastSeen: new Date(),
    },
    { upsert: true, new: true }
  );

  setToCache(userId, presence);
  return presence;
};

// Static: Set user offline
userPresenceSchema.statics.setOffline = async function (userId) {
  const presence = await this.findOneAndUpdate(
    { user: userId },
    {
      status: "offline",
      socketId: null,
      lastSeen: new Date(),
      isTyping: false,
      typingIn: null,
      activeConversation: null,
    },
    { new: true }
  );

  clearFromCache(userId);
  return presence;
};

// Static: Get user presence (with caching)
userPresenceSchema.statics.getPresence = async function (userId) {
  // Check cache first
  const cached = getFromCache(userId);
  if (cached) {
    return cached;
  }

  const presence = await this.findOne({ user: userId }).lean();

  if (presence) {
    setToCache(userId, presence);
  }

  return presence;
};

// Static: Get multiple users' presence
userPresenceSchema.statics.getMultiplePresence = async function (userIds) {
  const result = {};
  const uncachedIds = [];

  // Check cache for each user
  for (const userId of userIds) {
    const cached = getFromCache(userId);
    if (cached) {
      result[userId.toString()] = cached;
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached from DB
  if (uncachedIds.length > 0) {
    const presences = await this.find({ user: { $in: uncachedIds } }).lean();

    for (const presence of presences) {
      setToCache(presence.user, presence);
      result[presence.user.toString()] = presence;
    }
  }

  return result;
};

// Static: Set typing status
userPresenceSchema.statics.setTyping = async function (
  userId,
  conversationId,
  isTyping
) {
  const update = {
    isTyping,
    typingIn: isTyping ? conversationId : null,
    lastTypingAt: isTyping ? new Date() : null,
  };

  const presence = await this.findOneAndUpdate({ user: userId }, update, {
    new: true,
  });

  if (presence) {
    setToCache(userId, presence);
  }

  return presence;
};

// Static: Set active conversation
userPresenceSchema.statics.setActiveConversation = async function (
  userId,
  conversationId
) {
  const presence = await this.findOneAndUpdate(
    { user: userId },
    { activeConversation: conversationId },
    { new: true }
  );

  if (presence) {
    setToCache(userId, presence);
  }

  return presence;
};

// Static: Get online users in a conversation
userPresenceSchema.statics.getOnlineInConversation = async function (
  participantIds
) {
  return await this.find({
    user: { $in: participantIds },
    status: "online",
  })
    .select("user socketId status")
    .lean();
};

// Static: Get typing users in a conversation
userPresenceSchema.statics.getTypingInConversation = async function (
  conversationId
) {
  // Auto-clear stale typing indicators (older than 5 seconds)
  const staleTime = new Date(Date.now() - 5000);

  await this.updateMany(
    {
      typingIn: conversationId,
      lastTypingAt: { $lt: staleTime },
    },
    {
      isTyping: false,
      typingIn: null,
      lastTypingAt: null,
    }
  );

  return await this.find({
    typingIn: conversationId,
    isTyping: true,
  })
    .populate("user", "name photo")
    .lean();
};

// Static: Get socket ID for user
userPresenceSchema.statics.getSocketId = async function (userId) {
  const presence = await this.getPresence(userId);
  return presence?.socketId || null;
};

// Static: Clear all presence cache (for server restart)
userPresenceSchema.statics.clearCache = function () {
  presenceCache.clear();
};

// Static: Mark all users offline (for server restart)
userPresenceSchema.statics.markAllOffline = async function () {
  await this.updateMany(
    {},
    {
      status: "offline",
      socketId: null,
      isTyping: false,
      typingIn: null,
    }
  );
  presenceCache.clear();
};

const UserPresence = mongoose.model("UserPresence", userPresenceSchema);

module.exports = UserPresence;

