/**
 * @fileoverview Channel service for server channel management
 * @module services/ChannelService
 */

const Channel = require('../models/channelModel');
const Server = require('../models/serverModel');
const ChannelMessage = require('../models/channelMessageModel');
const AppError = require('../utils/appError');

/**
 * Channel Service class
 * Handles all channel-related business logic
 */
class ChannelService {
  /**
   * Create a new channel
   * @param {ObjectId} serverId - Server ID
   * @param {Object} data - Channel data
   * @param {ObjectId} userId - Creating user's ID
   * @returns {Promise<Object>} Created channel
   */
  async createChannel(serverId, { name, description = '', type = 'text' }, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to create channels', 403);
    }

    // Check if channel name already exists in server
    const existingChannel = await Channel.findOne({ serverId, name: name.toLowerCase() });
    if (existingChannel) {
      throw new AppError('A channel with this name already exists', 400);
    }

    // Get next position
    const channelCount = await Channel.countDocuments({ serverId });

    const channel = await Channel.create({
      serverId,
      name: name.toLowerCase(),
      description,
      type,
      position: channelCount,
    });

    // Add channel to server
    server.channels.push(channel._id);
    await server.save();

    return channel;
  }

  /**
   * Get channel by ID
   * @param {ObjectId} channelId - Channel ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object>} Channel
   */
  async getChannelById(channelId, userId) {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    // Check server membership
    const server = await Server.findById(channel.serverId);
    if (!server.isMember(userId)) {
      throw new AppError('You do not have access to this channel', 403);
    }

    return channel;
  }

  /**
   * Get channels for a server
   * @param {ObjectId} serverId - Server ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object[]>} Channels
   */
  async getServerChannels(serverId, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    if (!server.isMember(userId)) {
      throw new AppError('You do not have access to this server', 403);
    }

    // Get user's role
    const member = server.members.find(m => m.userId.toString() === userId.toString());
    const role = member?.role || 'member';

    const channels = await Channel.findByServer(serverId);

    // Filter channels based on read permission
    return channels.filter(channel => channel.canRead(role));
  }

  /**
   * Update a channel
   * @param {ObjectId} channelId - Channel ID
   * @param {Object} updates - Update data
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object>} Updated channel
   */
  async updateChannel(channelId, updates, userId) {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const server = await Server.findById(channel.serverId);
    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to update this channel', 403);
    }

    // Only allow specific fields
    const allowedUpdates = ['name', 'description', 'type', 'slowMode'];
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        channel[key] = updates[key];
      }
    }

    // Check for duplicate name
    if (updates.name) {
      const existingChannel = await Channel.findOne({
        serverId: channel.serverId,
        name: updates.name.toLowerCase(),
        _id: { $ne: channelId },
      });
      
      if (existingChannel) {
        throw new AppError('A channel with this name already exists', 400);
      }
    }

    await channel.save();
    return channel;
  }

  /**
   * Delete a channel
   * @param {ObjectId} channelId - Channel ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<void>}
   */
  async deleteChannel(channelId, userId) {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const server = await Server.findById(channel.serverId);
    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to delete this channel', 403);
    }

    // Remove channel from server
    server.channels = server.channels.filter(id => id.toString() !== channelId.toString());
    await server.save();

    // Delete all messages in channel
    await ChannelMessage.deleteMany({ channelId });

    // Delete channel
    await channel.deleteOne();
  }

  /**
   * Reorder channels
   * @param {ObjectId} serverId - Server ID
   * @param {Object[]} order - Array of { channelId, position }
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object[]>} Updated channels
   */
  async reorderChannels(serverId, order, userId) {
    const server = await Server.findById(serverId);

    if (!server) {
      throw new AppError('Server not found', 404);
    }

    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to reorder channels', 403);
    }

    // Update positions
    for (const { channelId, position } of order) {
      await Channel.findByIdAndUpdate(channelId, { position });
    }

    return Channel.findByServer(serverId);
  }

  /**
   * Get channel messages
   * @param {ObjectId} channelId - Channel ID
   * @param {ObjectId} userId - Requesting user's ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessages(channelId, userId, { page = 1, limit = 50, before = null }) {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const server = await Server.findById(channel.serverId);
    if (!server.isMember(userId)) {
      throw new AppError('You do not have access to this channel', 403);
    }

    const messages = await ChannelMessage.getMessages(channelId, { page, limit, before });
    const total = await ChannelMessage.countDocuments({ channelId, isDeleted: false });

    return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Send a message to a channel
   * @param {ObjectId} channelId - Channel ID
   * @param {ObjectId} userId - Sender's ID
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(channelId, userId, { content, attachments = [], replyTo = null }) {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const server = await Server.findById(channel.serverId);
    if (!server.isMember(userId)) {
      throw new AppError('You do not have access to this channel', 403);
    }

    // Check write permission
    const member = server.members.find(m => m.userId.toString() === userId.toString());
    if (!channel.canWrite(member?.role || 'member')) {
      throw new AppError('You do not have permission to send messages in this channel', 403);
    }

    const message = await ChannelMessage.create({
      serverId: channel.serverId,
      channelId,
      userId,
      content,
      attachments,
      replyTo,
    });

    // Update channel stats
    await channel.updateMessageStats();

    // Populate user info
    await message.populate('userId', 'name username photo');

    return message;
  }

  /**
   * Edit a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - Requesting user's ID
   * @param {string} content - New content
   * @returns {Promise<Object>} Updated message
   */
  async editMessage(messageId, userId, content) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.userId.toString() !== userId.toString()) {
      throw new AppError('You can only edit your own messages', 403);
    }

    await message.edit(content);
    await message.populate('userId', 'name username photo');

    return message;
  }

  /**
   * Delete a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId, userId) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const server = await Server.findById(message.serverId);
    const isOwner = message.userId.toString() === userId.toString();
    const isMod = server.isModerator(userId);

    if (!isOwner && !isMod) {
      throw new AppError('You do not have permission to delete this message', 403);
    }

    await message.softDelete();
  }

  /**
   * Pin a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object>} Updated message
   */
  async pinMessage(messageId, userId) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const server = await Server.findById(message.serverId);
    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to pin messages', 403);
    }

    message.isPinned = true;
    await message.save();

    return message;
  }

  /**
   * Unpin a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - Requesting user's ID
   * @returns {Promise<Object>} Updated message
   */
  async unpinMessage(messageId, userId) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const server = await Server.findById(message.serverId);
    if (!server.isModerator(userId)) {
      throw new AppError('You do not have permission to unpin messages', 403);
    }

    message.isPinned = false;
    await message.save();

    return message;
  }

  /**
   * Add reaction to a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - User's ID
   * @param {string} emoji - Emoji to add
   * @returns {Promise<Object>} Updated message
   */
  async addReaction(messageId, userId, emoji) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    await message.addReaction(emoji, userId);
    return message;
  }

  /**
   * Remove reaction from a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - User's ID
   * @param {string} emoji - Emoji to remove
   * @returns {Promise<Object>} Updated message
   */
  async removeReaction(messageId, userId, emoji) {
    const message = await ChannelMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    await message.removeReaction(emoji, userId);
    return message;
  }
}

// Export singleton instance
module.exports = new ChannelService();

