const mongoose = require("mongoose");

/**
 * Unified Chat Message Model
 * Supports all message types with read receipts and search
 */
const chatMessageSchema = new mongoose.Schema(
  {
    // Reference to conversation
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Message sender
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message content
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    // Message type (for future extensibility)
    messageType: {
      type: String,
      enum: ["text", "system", "notification"],
      default: "text",
    },

    // Read receipts - array of users who have read this message
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Delivery status - array of users who received this message
    deliveredTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // For replies/threads
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient message retrieval by conversation
chatMessageSchema.index({ conversation: 1, createdAt: -1 });

// Index for cursor-based pagination
chatMessageSchema.index({ conversation: 1, _id: -1 });

// Text index for message search
chatMessageSchema.index({ content: "text" });

// Index for unread messages
chatMessageSchema.index({ "readBy.user": 1, conversation: 1 });

// Static: Get messages for a conversation with cursor-based pagination
chatMessageSchema.statics.getMessages = async function (
  conversationId,
  { cursor = null, limit = 50, direction = "older" } = {}
) {
  const query = {
    conversation: conversationId,
    isDeleted: false,
  };

  // Cursor-based pagination (more efficient than offset)
  if (cursor) {
    if (direction === "older") {
      query._id = { $lt: mongoose.Types.ObjectId.createFromHexString(cursor) };
    } else {
      query._id = { $gt: mongoose.Types.ObjectId.createFromHexString(cursor) };
    }
  }

  const messages = await this.find(query)
    .sort({ _id: direction === "older" ? -1 : 1 })
    .limit(limit + 1) // Get one extra to check if there are more
    .populate("sender", "name photo username")
    .populate("replyTo", "content sender")
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) {
    messages.pop(); // Remove the extra message
  }

  // Reverse if getting newer messages to maintain chronological order
  if (direction === "newer") {
    messages.reverse();
  }

  return {
    messages,
    hasMore,
    nextCursor: messages.length > 0 ? messages[messages.length - 1]._id : null,
    prevCursor: messages.length > 0 ? messages[0]._id : null,
  };
};

// Static: Search messages in a conversation
chatMessageSchema.statics.searchMessages = async function (
  conversationId,
  searchTerm,
  { page = 1, limit = 20 } = {}
) {
  const query = {
    conversation: conversationId,
    isDeleted: false,
    $text: { $search: searchTerm },
  };

  const messages = await this.find(query, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "name photo username")
    .lean();

  const total = await this.countDocuments(query);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static: Get unread count for user in conversation
chatMessageSchema.statics.getUnreadCount = async function (
  conversationId,
  userId,
  lastReadTimestamp
) {
  return await this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    createdAt: { $gt: lastReadTimestamp },
    isDeleted: false,
  });
};

// Static: Mark messages as read
chatMessageSchema.statics.markAsRead = async function (
  conversationId,
  userId,
  messageIds = null
) {
  const query = {
    conversation: conversationId,
    sender: { $ne: userId },
    "readBy.user": { $ne: userId },
    isDeleted: false,
  };

  if (messageIds && messageIds.length > 0) {
    query._id = { $in: messageIds };
  }

  const result = await this.updateMany(query, {
    $push: {
      readBy: {
        user: userId,
        readAt: new Date(),
      },
    },
  });

  return result.modifiedCount;
};

// Static: Mark messages as delivered
chatMessageSchema.statics.markAsDelivered = async function (
  conversationId,
  userId,
  messageIds = null
) {
  const query = {
    conversation: conversationId,
    sender: { $ne: userId },
    "deliveredTo.user": { $ne: userId },
    isDeleted: false,
  };

  if (messageIds && messageIds.length > 0) {
    query._id = { $in: messageIds };
  }

  const result = await this.updateMany(query, {
    $push: {
      deliveredTo: {
        user: userId,
        deliveredAt: new Date(),
      },
    },
  });

  return result.modifiedCount;
};

// Static: Create and save message
chatMessageSchema.statics.createMessage = async function (
  conversationId,
  senderId,
  content,
  options = {}
) {
  const message = await this.create({
    conversation: conversationId,
    sender: senderId,
    content,
    messageType: options.messageType || "text",
    replyTo: options.replyTo || null,
  });

  // Populate sender for immediate use
  await message.populate("sender", "name photo username");

  return message;
};

// Instance: Check if user has read this message
chatMessageSchema.methods.hasBeenReadBy = function (userId) {
  return this.readBy.some(
    (r) => r.user.toString() === userId.toString()
  );
};

// Instance: Check if message was delivered to user
chatMessageSchema.methods.wasDeliveredTo = function (userId) {
  return this.deliveredTo.some(
    (d) => d.user.toString() === userId.toString()
  );
};

// Instance: Soft delete message
chatMessageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.content = "[Message deleted]";
  await this.save();
  return this;
};

// Instance: Edit message
chatMessageSchema.methods.editContent = async function (newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
  return this;
};

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;

