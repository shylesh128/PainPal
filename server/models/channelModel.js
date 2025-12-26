/**
 * @fileoverview Channel model for server text/announcement channels
 * @module models/channelModel
 */

const mongoose = require('mongoose');

/**
 * Permission sub-schema for role-based access
 */
const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    required: true,
  },
  canRead: {
    type: Boolean,
    default: true,
  },
  canWrite: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

/**
 * Main Channel schema
 */
const channelSchema = new mongoose.Schema({
  // ==================== Basic Info ====================
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    trim: true,
    lowercase: true,
    maxlength: [50, 'Channel name cannot exceed 50 characters'],
    match: [/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  
  // ==================== Type & Settings ====================
  type: {
    type: String,
    enum: ['text', 'announcements'],
    default: 'text',
  },
  
  // ==================== Organization ====================
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  position: {
    type: Number,
    default: 0,
  },
  
  // ==================== Permissions ====================
  permissions: {
    type: [permissionSchema],
    default: function() {
      return [
        { role: 'owner', canRead: true, canWrite: true },
        { role: 'moderator', canRead: true, canWrite: true },
        { role: 'member', canRead: true, canWrite: true },
      ];
    },
  },
  
  // ==================== Slow Mode ====================
  slowMode: {
    type: Number, // Seconds between messages
    default: 0,
  },
  
  // ==================== Stats ====================
  lastMessageAt: {
    type: Date,
    default: null,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  
  // ==================== Timestamps ====================
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ==================== Indexes ====================
channelSchema.index({ serverId: 1 });
channelSchema.index({ serverId: 1, name: 1 }, { unique: true });
channelSchema.index({ serverId: 1, position: 1 });

// ==================== Instance Methods ====================

/**
 * Check if a role can read this channel
 * @param {string} role - User's role in the server
 * @returns {boolean}
 */
channelSchema.methods.canRead = function(role) {
  const permission = this.permissions.find(p => p.role === role);
  return permission ? permission.canRead : false;
};

/**
 * Check if a role can write to this channel
 * @param {string} role - User's role in the server
 * @returns {boolean}
 */
channelSchema.methods.canWrite = function(role) {
  // Announcements channels: only mods and owners can write
  if (this.type === 'announcements' && role === 'member') {
    return false;
  }
  
  const permission = this.permissions.find(p => p.role === role);
  return permission ? permission.canWrite : false;
};

/**
 * Update message stats
 * @returns {Promise<void>}
 */
channelSchema.methods.updateMessageStats = async function() {
  this.lastMessageAt = new Date();
  this.messageCount += 1;
  await this.save();
};

/**
 * Set permission for a role
 * @param {string} role - Role to update
 * @param {Object} perms - Permission updates
 * @returns {Promise<void>}
 */
channelSchema.methods.setPermission = async function(role, { canRead, canWrite }) {
  const permission = this.permissions.find(p => p.role === role);
  
  if (permission) {
    if (canRead !== undefined) permission.canRead = canRead;
    if (canWrite !== undefined) permission.canWrite = canWrite;
  } else {
    this.permissions.push({
      role,
      canRead: canRead ?? true,
      canWrite: canWrite ?? true,
    });
  }
  
  await this.save();
};

// ==================== Static Methods ====================

/**
 * Find channels by server
 * @param {ObjectId} serverId - Server ID
 * @returns {Promise<Channel[]>}
 */
channelSchema.statics.findByServer = function(serverId) {
  return this.find({ serverId }).sort({ position: 1 });
};

/**
 * Create default channels for a new server
 * @param {ObjectId} serverId - Server ID
 * @returns {Promise<Channel[]>}
 */
channelSchema.statics.createDefaultChannels = async function(serverId) {
  const defaultChannels = [
    {
      serverId,
      name: 'general',
      description: 'General discussion',
      type: 'text',
      position: 0,
    },
    {
      serverId,
      name: 'announcements',
      description: 'Important announcements',
      type: 'announcements',
      position: 1,
    },
    {
      serverId,
      name: 'introductions',
      description: 'Introduce yourself to the community',
      type: 'text',
      position: 2,
    },
  ];
  
  return this.insertMany(defaultChannels);
};

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;

