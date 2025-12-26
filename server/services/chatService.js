const Conversation = require("../models/conversationModel");
const ChatMessage = require("../models/chatMessageModel");
const User = require("../models/userModel");

/**
 * Chat Service
 * Handles all conversation-related operations
 * Following Single Responsibility Principle
 */
const chatService = {
  /**
   * Get or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(user1Id, user2Id) {
    return await Conversation.findOrCreateDirect(user1Id, user2Id);
  },

  /**
   * Create a group conversation
   */
  async createGroup(creatorId, name, participantIds) {
    if (!name || name.trim().length === 0) {
      throw new Error("Group name is required");
    }

    if (!participantIds || participantIds.length < 1) {
      throw new Error("At least one other participant is required");
    }

    const conversation = await Conversation.createGroup(
      creatorId,
      name.trim(),
      participantIds
    );

    // Create system message
    await ChatMessage.createMessage(
      conversation._id,
      creatorId,
      `Group "${name}" was created`,
      { messageType: "system" }
    );

    return conversation;
  },

  /**
   * Get user's conversations
   */
  async getUserConversations(userId, options = {}) {
    const result = await Conversation.getUserConversations(userId, options);

    // Add unread counts for each conversation
    for (const conv of result.conversations) {
      const participant = conv.participants.find(
        (p) => p.user._id.toString() === userId.toString()
      );

      if (participant) {
        conv.unreadCount = await ChatMessage.getUnreadCount(
          conv._id,
          userId,
          participant.lastRead
        );
      }
    }

    return result;
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId, userId = null) {
    const conversation = await Conversation.findById(conversationId)
      .populate("participants.user", "name photo username")
      .populate("admins", "name photo")
      .populate("lastMessage.sender", "name photo")
      .lean();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is a participant (if userId provided)
    if (userId) {
      const isParticipant = conversation.participants.some(
        (p) => p.user._id.toString() === userId.toString()
      );

      if (!isParticipant && !conversation.settings?.isPublic) {
        throw new Error("Not authorized to view this conversation");
      }
    }

    return conversation;
  },

  /**
   * Join a global room
   */
  async joinGlobalRoom(userId) {
    return await Conversation.findOrCreateGlobalRoom(userId);
  },

  /**
   * Join or create random pairing
   */
  async joinRandomPairing(userId) {
    return await Conversation.findOrCreateRandomPair(userId);
  },

  /**
   * End random pairing
   */
  async endRandomPairing(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "random") {
      throw new Error("Invalid random conversation");
    }

    conversation.pairStatus = "ended";
    conversation.isActive = false;
    await conversation.save();

    // Create system message
    await ChatMessage.createMessage(
      conversation._id,
      userId,
      "Chat ended",
      { messageType: "system" }
    );

    return conversation;
  },

  /**
   * Add participant to group
   */
  async addParticipant(conversationId, userId, addedBy) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type !== "group") {
      throw new Error("Can only add participants to groups");
    }

    // Check if adder is admin
    if (!conversation.isAdmin(addedBy)) {
      throw new Error("Only admins can add participants");
    }

    await conversation.addParticipant(userId);

    // Get user name for system message
    const user = await User.findById(userId).select("name");

    // Create system message
    await ChatMessage.createMessage(
      conversation._id,
      addedBy,
      `${user.name} was added to the group`,
      { messageType: "system" }
    );

    return conversation;
  },

  /**
   * Remove participant from group
   */
  async removeParticipant(conversationId, userId, removedBy) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type !== "group") {
      throw new Error("Can only remove participants from groups");
    }

    // Check if remover is admin or removing self
    if (!conversation.isAdmin(removedBy) && userId !== removedBy) {
      throw new Error("Only admins can remove other participants");
    }

    const user = await User.findById(userId).select("name");

    await conversation.removeParticipant(userId);

    // Create system message
    const message =
      userId === removedBy
        ? `${user.name} left the group`
        : `${user.name} was removed from the group`;

    await ChatMessage.createMessage(conversation._id, removedBy, message, {
      messageType: "system",
    });

    return conversation;
  },

  /**
   * Update group settings
   */
  async updateGroup(conversationId, userId, updates) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type !== "group") {
      throw new Error("Can only update groups");
    }

    if (!conversation.isAdmin(userId)) {
      throw new Error("Only admins can update group settings");
    }

    // Allowed updates
    if (updates.name) {
      conversation.name = updates.name.trim();
    }

    if (updates.settings) {
      conversation.settings = { ...conversation.settings, ...updates.settings };
    }

    await conversation.save();

    return conversation;
  },

  /**
   * Make user an admin
   */
  async makeAdmin(conversationId, userId, madeBy) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.isAdmin(madeBy)) {
      throw new Error("Only admins can promote other users");
    }

    if (!conversation.isParticipant(userId)) {
      throw new Error("User is not a participant");
    }

    if (!conversation.isAdmin(userId)) {
      conversation.admins.push(userId);
      await conversation.save();

      const user = await User.findById(userId).select("name");
      await ChatMessage.createMessage(
        conversation._id,
        madeBy,
        `${user.name} is now an admin`,
        { messageType: "system" }
      );
    }

    return conversation;
  },

  /**
   * Leave conversation
   */
  async leaveConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type === "direct") {
      // For direct chats, just mark as inactive for this user
      // (Don't actually remove, just hide)
      return conversation;
    }

    return await this.removeParticipant(conversationId, userId, userId);
  },

  /**
   * Update last read timestamp for user
   */
  async updateLastRead(conversationId, userId) {
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
  },

  /**
   * Get participant socket IDs for broadcasting
   */
  async getParticipantIds(conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .select("participants.user")
      .lean();

    if (!conversation) {
      return [];
    }

    return conversation.participants.map((p) => p.user.toString());
  },
};

module.exports = chatService;

