/**
 * @fileoverview Server service for Discord-like community management
 * @module services/ServerService
 */

const Server = require('../models/serverModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const crypto = require('crypto');

/**
 * Generate a random invite code
 * @returns {string} 8-character invite code
 */
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Server Service class
 */
class ServerService {
  /**
   * Create a new server
   * @param {Object} serverData - Server data
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<Object>} Created server
   */
  async createServer(serverData, ownerId) {
    const inviteCode = generateInviteCode();

    const server = await Server.create({
      ...serverData,
      owner: ownerId,
      members: [{
        user: ownerId,
        role: 'owner',
        joinedAt: new Date(),
      }],
      inviteCode,
      inviteCodeExpires: null, // Never expires by default
    });

    // Update user's servers array
    await User.findByIdAndUpdate(ownerId, {
      $push: { servers: server._id },
      $inc: { 'stats.serversJoined': 1 },
    });

    return server;
  }

  /**
   * Get server by ID
   * @param {string} serverId - Server ID
   * @param {string} userId - Requesting user's ID
   * @returns {Promise<Object>} Server
   */
  async getServerById(serverId, userId) {
    const server = await Server.findById(serverId)
      .populate('owner', 'name username photo')
      .populate('members.user', 'name username photo mood status');

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    // Check if user is a member for private servers
    const isMember = server.members.some(m => m.user._id.toString() === userId);
    if (!server.isPublic && !isMember) {
      throw new AppError('You do not have access to this server', 403);
    }

    return server;
  }

  /**
   * Get user's servers
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's servers
   */
  async getUserServers(userId) {
    const servers = await Server.find({
      'members.user': userId,
    })
      .select('name icon description memberCount isPublic')
      .sort({ updatedAt: -1 });

    return servers;
  }

  /**
   * Discover public servers
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated servers
   */
  async discoverServers({ page = 1, limit = 20, search = '' }) {
    const query = {
      isPublic: true,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Server.countDocuments(query);
    const servers = await Server.find(query)
      .select('name icon description memberCount tags')
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data: { servers },
      results: servers.length,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  }

  /**
   * Join server by invite code
   * @param {string} inviteCode - Invite code
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Joined server
   */
  async joinByInviteCode(inviteCode, userId) {
    const server = await Server.findOne({
      inviteCode: inviteCode.toUpperCase(),
      $or: [
        { inviteCodeExpires: null },
        { inviteCodeExpires: { $gt: new Date() } },
      ],
    });

    if (!server) {
      throw new AppError('Invalid or expired invite code', 400);
    }

    return this._addMember(server, userId);
  }

  /**
   * Join public server
   * @param {string} serverId - Server ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Joined server
   */
  async joinServer(serverId, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    if (!server.isPublic) {
      throw new AppError('This server is private. You need an invite link to join.', 403);
    }

    return this._addMember(server, userId);
  }

  /**
   * Add member to server (helper)
   * @private
   */
  async _addMember(server, userId) {
    // Check if already a member
    const isMember = server.members.some(m => m.user.toString() === userId);
    if (isMember) {
      throw new AppError('You are already a member of this server', 400);
    }

    // Check if banned
    if (server.bannedUsers && server.bannedUsers.includes(userId)) {
      throw new AppError('You have been banned from this server', 403);
    }

    // Add member
    server.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date(),
    });
    server.memberCount = server.members.length;
    await server.save();

    // Update user's servers
    await User.findByIdAndUpdate(userId, {
      $push: { servers: server._id },
      $inc: { 'stats.serversJoined': 1 },
    });

    return server;
  }

  /**
   * Leave server
   * @param {string} serverId - Server ID
   * @param {string} userId - User ID
   */
  async leaveServer(serverId, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    // Owner cannot leave
    if (server.owner.toString() === userId) {
      throw new AppError('Server owner cannot leave. Transfer ownership or delete the server.', 400);
    }

    // Remove member
    server.members = server.members.filter(m => m.user.toString() !== userId);
    server.memberCount = server.members.length;
    await server.save();

    // Update user's servers
    await User.findByIdAndUpdate(userId, {
      $pull: { servers: server._id },
      $inc: { 'stats.serversJoined': -1 },
    });
  }

  /**
   * Update server
   * @param {string} serverId - Server ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated server
   */
  async updateServer(serverId, updateData, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    // Check permissions
    const member = server.members.find(m => m.user.toString() === userId);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new AppError('You do not have permission to update this server', 403);
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'icon', 'banner', 'isPublic', 'tags'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        server[field] = updateData[field];
      }
    });

    await server.save();
    return server;
  }

  /**
   * Delete server
   * @param {string} serverId - Server ID
   * @param {string} userId - User ID
   */
  async deleteServer(serverId, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    if (server.owner.toString() !== userId) {
      throw new AppError('Only the server owner can delete this server', 403);
    }

    // Remove server from all members' arrays
    const memberIds = server.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      {
        $pull: { servers: server._id },
        $inc: { 'stats.serversJoined': -1 },
      }
    );

    await server.deleteOne();
  }

  /**
   * Regenerate invite code
   * @param {string} serverId - Server ID
   * @param {string} userId - User ID
   * @param {number} expiresInDays - Days until expiration (null for never)
   * @returns {Promise<string>} New invite code
   */
  async regenerateInviteCode(serverId, userId, expiresInDays = null) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    const member = server.members.find(m => m.user.toString() === userId);
    if (!member || !['owner', 'admin', 'moderator'].includes(member.role)) {
      throw new AppError('You do not have permission to regenerate the invite code', 403);
    }

    server.inviteCode = generateInviteCode();
    server.inviteCodeExpires = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await server.save();
    return server.inviteCode;
  }

  /**
   * Get server members
   * @param {string} serverId - Server ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated members
   */
  async getMembers(serverId, { page = 1, limit = 50 }) {
    const server = await Server.findById(serverId)
      .populate('members.user', 'name username photo mood status lastActiveAt');

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    const start = (page - 1) * limit;
    const members = server.members.slice(start, start + limit);

    return {
      data: { members },
      results: members.length,
      page,
      totalPages: Math.ceil(server.members.length / limit),
      total: server.members.length,
    };
  }

  /**
   * Kick member
   */
  async kickMember(serverId, targetUserId, actorUserId) {
    await this._modifyMember(serverId, targetUserId, actorUserId, 'kick');
  }

  /**
   * Ban member
   */
  async banMember(serverId, targetUserId, actorUserId) {
    await this._modifyMember(serverId, targetUserId, actorUserId, 'ban');
  }

  /**
   * Unban member
   */
  async unbanMember(serverId, targetUserId, actorUserId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    const actor = server.members.find(m => m.user.toString() === actorUserId);
    if (!actor || !['owner', 'admin', 'moderator'].includes(actor.role)) {
      throw new AppError('You do not have permission to unban members', 403);
    }

    server.bannedUsers = (server.bannedUsers || []).filter(id => id.toString() !== targetUserId);
    await server.save();
  }

  /**
   * Promote member to moderator
   */
  async promoteMember(serverId, targetUserId, actorUserId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    const actor = server.members.find(m => m.user.toString() === actorUserId);
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new AppError('You do not have permission to promote members', 403);
    }

    const target = server.members.find(m => m.user.toString() === targetUserId);
    if (!target) {
      throw new AppError('Member not found', 404);
    }

    if (target.role !== 'member') {
      throw new AppError('This member cannot be promoted', 400);
    }

    target.role = 'moderator';
    await server.save();
  }

  /**
   * Demote moderator to member
   */
  async demoteMember(serverId, targetUserId, actorUserId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    const actor = server.members.find(m => m.user.toString() === actorUserId);
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new AppError('You do not have permission to demote members', 403);
    }

    const target = server.members.find(m => m.user.toString() === targetUserId);
    if (!target) {
      throw new AppError('Member not found', 404);
    }

    if (target.role !== 'moderator') {
      throw new AppError('This member cannot be demoted', 400);
    }

    target.role = 'member';
    await server.save();
  }

  /**
   * Helper for kick/ban operations
   * @private
   */
  async _modifyMember(serverId, targetUserId, actorUserId, action) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    // Validate actor permissions
    const actor = server.members.find(m => m.user.toString() === actorUserId);
    if (!actor || !['owner', 'admin', 'moderator'].includes(actor.role)) {
      throw new AppError(`You do not have permission to ${action} members`, 403);
    }

    // Find target
    const targetIndex = server.members.findIndex(m => m.user.toString() === targetUserId);
    if (targetIndex === -1) {
      throw new AppError('Member not found', 404);
    }

    const target = server.members[targetIndex];

    // Cannot kick/ban owner
    if (target.role === 'owner') {
      throw new AppError(`Cannot ${action} the server owner`, 400);
    }

    // Role hierarchy check
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    if (roleHierarchy.indexOf(actor.role) <= roleHierarchy.indexOf(target.role)) {
      throw new AppError(`Cannot ${action} a member with equal or higher role`, 403);
    }

    // Remove member
    server.members.splice(targetIndex, 1);
    server.memberCount = server.members.length;

    // If banning, add to banned list
    if (action === 'ban') {
      server.bannedUsers = server.bannedUsers || [];
      server.bannedUsers.push(targetUserId);
    }

    await server.save();

    // Update target user's servers
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { servers: server._id },
      $inc: { 'stats.serversJoined': -1 },
    });
  }
}

module.exports = new ServerService();


