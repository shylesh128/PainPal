/**
 * @fileoverview Channel message model for server channel messages
 * @module models/channelMessageModel
 */

const mongoose = require('mongoose');

/**
 * Channel message schema
 */
const channelMessageSchema = new mongoose.Schema({
  // ==================== References ====================
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // ==================== Content ====================
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  
  // ==================== Attachments ====================
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'file'],
    },
    url: String,
    name: String,
    size: Number,
  }],
  
  // ==================== Reactions ====================
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  
  // ==================== Reply ====================
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelMessage',
    default: null,
  },
  
  // ==================== Metadata ====================
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  
  // ==================== Timestamps ====================
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// ==================== Indexes ====================
channelMessageSchema.index({ channelId: 1, createdAt: -1 });
channelMessageSchema.index({ serverId: 1 });
channelMessageSchema.index({ userId: 1 });
channelMessageSchema.index({ isPinned: 1, channelId: 1 });

// ==================== Instance Methods ====================

/**
 * Add a reaction
 * @param {string} emoji - Emoji to add
 * @param {ObjectId} userId - User adding reaction
 * @returns {Promise<void>}
 */
channelMessageSchema.methods.addReaction = async function(emoji, userId) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = { emoji, users: [] };
    this.reactions.push(reaction);
  }
  
  const userIdStr = userId.toString();
  if (!reaction.users.some(u => u.toString() === userIdStr)) {
    reaction.users.push(userId);
  }
  
  await this.save();
};

/**
 * Remove a reaction
 * @param {string} emoji - Emoji to remove
 * @param {ObjectId} userId - User removing reaction
 * @returns {Promise<void>}
 */
channelMessageSchema.methods.removeReaction = async function(emoji, userId) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) return;
  
  const userIdStr = userId.toString();
  reaction.users = reaction.users.filter(u => u.toString() !== userIdStr);
  
  // Remove reaction if no users left
  if (reaction.users.length === 0) {
    this.reactions = this.reactions.filter(r => r.emoji !== emoji);
  }
  
  await this.save();
};

/**
 * Edit message content
 * @param {string} newContent - New content
 * @returns {Promise<void>}
 */
channelMessageSchema.methods.edit = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

/**
 * Soft delete message
 * @returns {Promise<void>}
 */
channelMessageSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.content = '[Message deleted]';
  this.attachments = [];
  await this.save();
};

// ==================== Static Methods ====================

/**
 * Get messages for a channel with pagination
 * @param {ObjectId} channelId - Channel ID
 * @param {Object} options - Pagination options
 * @returns {Promise<ChannelMessage[]>}
 */
channelMessageSchema.statics.getMessages = function(channelId, { page = 1, limit = 50, before = null }) {
  const query = { channelId, isDeleted: false };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name username photo')
    .populate('replyTo', 'content userId');
};

/**
 * Get pinned messages for a channel
 * @param {ObjectId} channelId - Channel ID
 * @returns {Promise<ChannelMessage[]>}
 */
channelMessageSchema.statics.getPinnedMessages = function(channelId) {
  return this.find({ channelId, isPinned: true, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('userId', 'name username photo');
};

const ChannelMessage = mongoose.model('ChannelMessage', channelMessageSchema);

module.exports = ChannelMessage;

