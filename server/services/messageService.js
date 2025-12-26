const ChatMessage = require("../models/chatMessageModel");
const Conversation = require("../models/conversationModel");

/**
 * Message Service
 * Handles all message-related operations
 * Following Single Responsibility Principle
 */
const messageService = {
  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId, senderId, content, options = {}) {
    // Validate conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.isParticipant(senderId)) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    // Check admin-only setting
    if (
      conversation.settings?.adminOnly &&
      !conversation.isAdmin(senderId)
    ) {
      throw new Error("Only admins can send messages in this conversation");
    }

    // Create message
    const message = await ChatMessage.createMessage(
      conversationId,
      senderId,
      content,
      options
    );

    // Update conversation's last message
    await conversation.updateLastMessage(content, senderId);

    return message;
  },

  /**
   * Get messages for a conversation with cursor-based pagination
   */
  async getMessages(conversationId, userId, options = {}) {
    // Validate user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.isParticipant(userId) && !conversation.settings?.isPublic) {
      throw new Error("Not authorized to view messages in this conversation");
    }

    return await ChatMessage.getMessages(conversationId, options);
  },

  /**
   * Search messages in a conversation
   */
  async searchMessages(conversationId, userId, searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error("Search term must be at least 2 characters");
    }

    // Validate user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.isParticipant(userId) && !conversation.settings?.isPublic) {
      throw new Error("Not authorized to search messages in this conversation");
    }

    return await ChatMessage.searchMessages(
      conversationId,
      searchTerm.trim(),
      options
    );
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, userId, messageIds = null) {
    const count = await ChatMessage.markAsRead(
      conversationId,
      userId,
      messageIds
    );

    // Update participant's lastRead timestamp
    await Conversation.updateOne(
      {
        _id: conversationId,
        "participants.user": userId,
      },
      {
        $set: {
          "participants.$.lastRead": new Date(),
        },
      }
    );

    return count;
  },

  /**
   * Mark messages as delivered
   */
  async markAsDelivered(conversationId, userId, messageIds = null) {
    return await ChatMessage.markAsDelivered(
      conversationId,
      userId,
      messageIds
    );
  },

  /**
   * Get unread count for user in conversation
   */
  async getUnreadCount(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return 0;
    }

    const participant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return 0;
    }

    return await ChatMessage.getUnreadCount(
      conversationId,
      userId,
      participant.lastRead
    );
  },

  /**
   * Get total unread count across all conversations
   */
  async getTotalUnreadCount(userId) {
    const conversations = await Conversation.find({
      "participants.user": userId,
      isActive: true,
    }).lean();

    let totalUnread = 0;

    for (const conv of conversations) {
      const participant = conv.participants.find(
        (p) => p.user.toString() === userId.toString()
      );

      if (participant) {
        const count = await ChatMessage.getUnreadCount(
          conv._id,
          userId,
          participant.lastRead
        );
        totalUnread += count;
      }
    }

    return totalUnread;
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    const message = await ChatMessage.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error("Can only delete your own messages");
    }

    return await message.softDelete();
  },

  /**
   * Edit a message
   */
  async editMessage(messageId, userId, newContent) {
    const message = await ChatMessage.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error("Can only edit your own messages");
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      throw new Error("Cannot edit messages older than 15 minutes");
    }

    return await message.editContent(newContent);
  },

  /**
   * Get message by ID
   */
  async getMessage(messageId) {
    return await ChatMessage.findById(messageId)
      .populate("sender", "name photo username")
      .populate("replyTo", "content sender")
      .lean();
  },

  /**
   * Get read receipts for a message
   */
  async getReadReceipts(messageId) {
    const message = await ChatMessage.findById(messageId)
      .populate("readBy.user", "name photo")
      .select("readBy")
      .lean();

    return message?.readBy || [];
  },

  /**
   * Get latest messages across all user's conversations (for notifications)
   */
  async getLatestUnreadMessages(userId, limit = 10) {
    const conversations = await Conversation.find({
      "participants.user": userId,
      isActive: true,
    })
      .select("_id participants")
      .lean();

    const conversationIds = conversations.map((c) => c._id);
    const lastReadMap = {};

    for (const conv of conversations) {
      const participant = conv.participants.find(
        (p) => p.user.toString() === userId.toString()
      );
      if (participant) {
        lastReadMap[conv._id.toString()] = participant.lastRead;
      }
    }

    // Get unread messages
    const messages = await ChatMessage.find({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get extra to filter
      .populate("sender", "name photo")
      .populate("conversation", "name type")
      .lean();

    // Filter to only unread
    const unreadMessages = messages.filter((msg) => {
      const lastRead = lastReadMap[msg.conversation._id.toString()];
      return !lastRead || msg.createdAt > lastRead;
    });

    return unreadMessages.slice(0, limit);
  },
};

module.exports = messageService;

