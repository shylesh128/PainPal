/**
 * @fileoverview Server model for Discord-like community spaces
 * @module models/serverModel
 */

const mongoose = require('mongoose');
const { generateInviteCode } = require('../utils/cryptoUtils');

/**
 * Server member sub-schema
 */
const serverMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  mutedUntil: {
    type: Date,
    default: null,
  },
}, { _id: false });

/**
 * Main Server schema
 */
const serverSchema = new mongoose.Schema({
  // ==================== Basic Info ====================
  name: {
    type: String,
    required: [true, 'Server name is required'],
    trim: true,
    maxlength: [100, 'Server name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: '',
  },
  
  // ==================== Appearance ====================
  icon: {
    type: String,
    default: null,
  },
  banner: {
    type: String,
    default: null,
  },
  
  // ==================== Ownership & Members ====================
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: {
    type: [serverMemberSchema],
    default: [],
  },
  
  // ==================== Channels ====================
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  }],
  
  // ==================== Settings ====================
  isPrivate: {
    type: Boolean,
    default: false,
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  inviteExpires: {
    type: Date,
    default: null,
  },
  maxMembers: {
    type: Number,
    default: 1000,
  },
  
  // ==================== Categories (for organizing channels) ====================
  categories: [{
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    position: {
      type: Number,
      default: 0,
    },
  }],
  
  // ==================== Stats ====================
  memberCount: {
    type: Number,
    default: 1,
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
serverSchema.index({ name: 'text', description: 'text' });
serverSchema.index({ ownerId: 1 });
serverSchema.index({ inviteCode: 1 });
serverSchema.index({ isPrivate: 1 });
serverSchema.index({ memberCount: -1 });
serverSchema.index({ 'members.userId': 1 });

// ==================== Pre-save Hooks ====================

/**
 * Generate invite code before saving if not set
 */
serverSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode(8);
  }
  next();
});

/**
 * Update member count before saving
 */
serverSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

// ==================== Instance Methods ====================

/**
 * Add a member to the server
 * @param {ObjectId} userId - User ID to add
 * @param {string} [role='member'] - Role to assign
 * @returns {Promise<boolean>} True if added successfully
 */
serverSchema.methods.addMember = async function(userId, role = 'member') {
  // Check if already a member
  const existingMember = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    // If banned, don't allow rejoining
    if (existingMember.isBanned) {
      return false;
    }
    return true; // Already a member
  }
  
  // Check member limit
  if (this.members.length >= this.maxMembers) {
    return false;
  }
  
  this.members.push({
    userId,
    role,
    joinedAt: new Date(),
  });
  
  await this.save();
  return true;
};

/**
 * Remove a member from the server
 * @param {ObjectId} userId - User ID to remove
 * @returns {Promise<boolean>} True if removed
 */
serverSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(
    m => m.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) return false;
  
  // Can't remove owner
  if (this.members[memberIndex].role === 'owner') {
    return false;
  }
  
  this.members.splice(memberIndex, 1);
  await this.save();
  return true;
};

/**
 * Ban a member
 * @param {ObjectId} userId - User ID to ban
 * @returns {Promise<boolean>} True if banned
 */
serverSchema.methods.banMember = async function(userId) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (!member || member.role === 'owner') return false;
  
  member.isBanned = true;
  await this.save();
  return true;
};

/**
 * Unban a member
 * @param {ObjectId} userId - User ID to unban
 * @returns {Promise<boolean>} True if unbanned
 */
serverSchema.methods.unbanMember = async function(userId) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (!member) return false;
  
  member.isBanned = false;
  await this.save();
  return true;
};

/**
 * Check if user is a member
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
serverSchema.methods.isMember = function(userId) {
  return this.members.some(
    m => m.userId.toString() === userId.toString() && !m.isBanned
  );
};

/**
 * Check if user is moderator or owner
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
serverSchema.methods.isModerator = function(userId) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  return member && ['owner', 'moderator'].includes(member.role);
};

/**
 * Check if user is owner
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
serverSchema.methods.isOwner = function(userId) {
  return this.ownerId.toString() === userId.toString();
};

/**
 * Promote member to moderator
 * @param {ObjectId} userId - User ID to promote
 * @returns {Promise<boolean>}
 */
serverSchema.methods.promoteMember = async function(userId) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (!member || member.role !== 'member') return false;
  
  member.role = 'moderator';
  await this.save();
  return true;
};

/**
 * Demote moderator to member
 * @param {ObjectId} userId - User ID to demote
 * @returns {Promise<boolean>}
 */
serverSchema.methods.demoteMember = async function(userId) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (!member || member.role !== 'moderator') return false;
  
  member.role = 'member';
  await this.save();
  return true;
};

/**
 * Regenerate invite code
 * @param {number} [expiresInDays] - Optional expiration in days
 * @returns {Promise<string>} New invite code
 */
serverSchema.methods.regenerateInviteCode = async function(expiresInDays = null) {
  this.inviteCode = generateInviteCode(8);
  this.inviteExpires = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  await this.save();
  return this.inviteCode;
};

// ==================== Static Methods ====================

/**
 * Find servers by user membership
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Server[]>}
 */
serverSchema.statics.findByMember = function(userId) {
  return this.find({
    'members.userId': userId,
    'members.isBanned': { $ne: true },
  }).populate('channels');
};

/**
 * Find public servers for discovery
 * @param {Object} options - Pagination options
 * @returns {Promise<Server[]>}
 */
serverSchema.statics.discoverServers = function({ page = 1, limit = 20, search = '' }) {
  const query = { isPrivate: false };
  
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query)
    .select('name description icon memberCount createdAt')
    .sort({ memberCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Find server by invite code
 * @param {string} code - Invite code
 * @returns {Promise<Server>}
 */
serverSchema.statics.findByInviteCode = function(code) {
  return this.findOne({
    inviteCode: code,
    $or: [
      { inviteExpires: null },
      { inviteExpires: { $gt: Date.now() } },
    ],
  });
};

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;

