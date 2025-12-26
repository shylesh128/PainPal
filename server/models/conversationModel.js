const mongoose = require("mongoose");

/**
 * Unified Conversation Model
 * Supports all chat types: direct (1:1), group, global, random
 */
const conversationSchema = new mongoose.Schema(
  {
    // Type of conversation
    type: {
      type: String,
      enum: ["direct", "group", "global", "random"],
      required: true,
    },

    // Conversation name (for groups and global rooms)
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // Participants in the conversation
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        // For muting notifications
        muted: {
          type: Boolean,
          default: false,
        },
        // Last read message timestamp for unread count
        lastRead: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Admins (for group chats)
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Creator of the conversation
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Last message for preview
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
    },

    // For global rooms - max participants
    maxParticipants: {
      type: Number,
      default: 50,
    },

    // For random pairing - pair status
    pairStatus: {
      type: String,
      enum: ["waiting", "paired", "ended"],
      default: null,
    },

    // Group/Room settings
    settings: {
      // Only admins can send messages
      adminOnly: {
        type: Boolean,
        default: false,
      },
      // Anyone can join (for global)
      isPublic: {
        type: Boolean,
        default: false,
      },
    },

    // Soft delete
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
conversationSchema.index({ "participants.user": 1 });
conversationSchema.index({ type: 1, isActive: 1 });
conversationSchema.index({ "participants.user": 1, type: 1 });
conversationSchema.index({ updatedAt: -1 });

// Virtual for participant count
conversationSchema.virtual("participantCount").get(function () {
  return this.participants.length;
});

// Static: Find or create direct conversation between two users
conversationSchema.statics.findOrCreateDirect = async function (user1Id, user2Id) {
  // Ensure consistent ordering for lookup
  const participants = [user1Id, user2Id].sort();

  let conversation = await this.findOne({
    type: "direct",
    "participants.user": { $all: participants },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
    isActive: true,
  });

  if (!conversation) {
    conversation = await this.create({
      type: "direct",
      participants: [
        { user: participants[0] },
        { user: participants[1] },
      ],
      createdBy: user1Id,
    });
  }

  return conversation;
};

// Static: Get user's conversations with pagination
conversationSchema.statics.getUserConversations = async function (
  userId,
  { page = 1, limit = 20, type = null } = {}
) {
  const query = {
    "participants.user": userId,
    isActive: true,
  };

  if (type) {
    query.type = type;
  }

  const conversations = await this.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("participants.user", "name photo username")
    .populate("lastMessage.sender", "name photo")
    .populate("admins", "name photo")
    .lean();

  const total = await this.countDocuments(query);

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static: Create a group conversation
conversationSchema.statics.createGroup = async function (
  creatorId,
  name,
  participantIds
) {
  // Ensure creator is in participants
  const allParticipants = [...new Set([creatorId, ...participantIds])];

  const conversation = await this.create({
    type: "group",
    name,
    participants: allParticipants.map((id) => ({ user: id })),
    admins: [creatorId],
    createdBy: creatorId,
  });

  return conversation;
};

// Static: Find available global room or create new
conversationSchema.statics.findOrCreateGlobalRoom = async function (userId) {
  // Find a global room with space
  let room = await this.findOne({
    type: "global",
    isActive: true,
    "settings.isPublic": true,
    $expr: { $lt: [{ $size: "$participants" }, "$maxParticipants"] },
  });

  if (!room) {
    // Create new global room
    room = await this.create({
      type: "global",
      name: `Global Room ${Date.now()}`,
      participants: [],
      settings: { isPublic: true },
      maxParticipants: 50,
    });
  }

  // Add user if not already in room
  const isParticipant = room.participants.some(
    (p) => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    room.participants.push({ user: userId });
    await room.save();
  }

  return room;
};

// Static: Find waiting random pair or create new
conversationSchema.statics.findOrCreateRandomPair = async function (userId) {
  // Find a waiting random conversation
  let conversation = await this.findOne({
    type: "random",
    pairStatus: "waiting",
    "participants.user": { $ne: userId },
    isActive: true,
  });

  if (conversation) {
    // Join the waiting conversation
    conversation.participants.push({ user: userId });
    conversation.pairStatus = "paired";
    await conversation.save();
  } else {
    // Create new waiting conversation
    conversation = await this.create({
      type: "random",
      participants: [{ user: userId }],
      pairStatus: "waiting",
      createdBy: userId,
    });
  }

  return conversation;
};

// Instance: Add participant
conversationSchema.methods.addParticipant = async function (userId) {
  const isParticipant = this.participants.some(
    (p) => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    this.participants.push({ user: userId });
    await this.save();
  }

  return this;
};

// Instance: Remove participant
conversationSchema.methods.removeParticipant = async function (userId) {
  this.participants = this.participants.filter(
    (p) => p.user.toString() !== userId.toString()
  );

  // Also remove from admins if applicable
  this.admins = this.admins.filter(
    (adminId) => adminId.toString() !== userId.toString()
  );

  await this.save();
  return this;
};

// Instance: Update last message
conversationSchema.methods.updateLastMessage = async function (
  content,
  senderId
) {
  this.lastMessage = {
    content: content.substring(0, 100), // Truncate for preview
    sender: senderId,
    timestamp: new Date(),
  };
  await this.save();
  return this;
};

// Instance: Check if user is participant
conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString()
  );
};

// Instance: Check if user is admin
conversationSchema.methods.isAdmin = function (userId) {
  return this.admins.some(
    (adminId) => adminId.toString() === userId.toString()
  );
};

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;

