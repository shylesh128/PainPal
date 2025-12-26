/**
 * @fileoverview Server controller for Discord-like community management
 * @module controllers/serverController
 */

const ServerService = require('../services/ServerService');
const ChannelService = require('../services/ChannelService');
const catchAsync = require('../utils/catchAsync');

// ==================== Server Operations ====================

/**
 * Create a new server
 * @route POST /api/v1/servers
 */
const createServer = catchAsync(async (req, res) => {
  const server = await ServerService.createServer(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    data: { server },
  });
});

/**
 * Get server by ID
 * @route GET /api/v1/servers/:serverId
 */
const getServer = catchAsync(async (req, res) => {
  const server = await ServerService.getServerById(req.params.serverId, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { server },
  });
});

/**
 * Get user's servers
 * @route GET /api/v1/servers/me
 */
const getMyServers = catchAsync(async (req, res) => {
  const servers = await ServerService.getUserServers(req.user._id);

  res.status(200).json({
    status: 'success',
    results: servers.length,
    data: { servers },
  });
});

/**
 * Discover public servers
 * @route GET /api/v1/servers/discover
 */
const discoverServers = catchAsync(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await ServerService.discoverServers({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search: search || '',
  });

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

/**
 * Join server by invite code
 * @route POST /api/v1/servers/join/:inviteCode
 */
const joinByInviteCode = catchAsync(async (req, res) => {
  const server = await ServerService.joinByInviteCode(req.params.inviteCode, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Successfully joined server',
    data: { server },
  });
});

/**
 * Join public server
 * @route POST /api/v1/servers/:serverId/join
 */
const joinServer = catchAsync(async (req, res) => {
  const server = await ServerService.joinServer(req.params.serverId, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Successfully joined server',
    data: { server },
  });
});

/**
 * Leave server
 * @route POST /api/v1/servers/:serverId/leave
 */
const leaveServer = catchAsync(async (req, res) => {
  await ServerService.leaveServer(req.params.serverId, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Successfully left server',
  });
});

/**
 * Update server
 * @route PATCH /api/v1/servers/:serverId
 */
const updateServer = catchAsync(async (req, res) => {
  const server = await ServerService.updateServer(
    req.params.serverId,
    req.body,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    data: { server },
  });
});

/**
 * Delete server
 * @route DELETE /api/v1/servers/:serverId
 */
const deleteServer = catchAsync(async (req, res) => {
  await ServerService.deleteServer(req.params.serverId, req.user._id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Regenerate invite code
 * @route POST /api/v1/servers/:serverId/invite
 */
const regenerateInviteCode = catchAsync(async (req, res) => {
  const { expiresInDays } = req.body;
  const inviteCode = await ServerService.regenerateInviteCode(
    req.params.serverId,
    req.user._id,
    expiresInDays
  );

  res.status(200).json({
    status: 'success',
    data: { inviteCode },
  });
});

// ==================== Member Operations ====================

/**
 * Get server members
 * @route GET /api/v1/servers/:serverId/members
 */
const getMembers = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await ServerService.getMembers(req.params.serverId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
  });

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

/**
 * Kick member
 * @route POST /api/v1/servers/:serverId/members/:userId/kick
 */
const kickMember = catchAsync(async (req, res) => {
  await ServerService.kickMember(
    req.params.serverId,
    req.params.userId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Member kicked successfully',
  });
});

/**
 * Ban member
 * @route POST /api/v1/servers/:serverId/members/:userId/ban
 */
const banMember = catchAsync(async (req, res) => {
  await ServerService.banMember(
    req.params.serverId,
    req.params.userId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Member banned successfully',
  });
});

/**
 * Unban member
 * @route POST /api/v1/servers/:serverId/members/:userId/unban
 */
const unbanMember = catchAsync(async (req, res) => {
  await ServerService.unbanMember(
    req.params.serverId,
    req.params.userId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Member unbanned successfully',
  });
});

/**
 * Promote member to moderator
 * @route POST /api/v1/servers/:serverId/members/:userId/promote
 */
const promoteMember = catchAsync(async (req, res) => {
  await ServerService.promoteMember(
    req.params.serverId,
    req.params.userId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Member promoted to moderator',
  });
});

/**
 * Demote moderator to member
 * @route POST /api/v1/servers/:serverId/members/:userId/demote
 */
const demoteMember = catchAsync(async (req, res) => {
  await ServerService.demoteMember(
    req.params.serverId,
    req.params.userId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Moderator demoted to member',
  });
});

// ==================== Channel Operations ====================

/**
 * Create channel
 * @route POST /api/v1/servers/:serverId/channels
 */
const createChannel = catchAsync(async (req, res) => {
  const channel = await ChannelService.createChannel(
    req.params.serverId,
    req.body,
    req.user._id
  );

  res.status(201).json({
    status: 'success',
    data: { channel },
  });
});

/**
 * Get server channels
 * @route GET /api/v1/servers/:serverId/channels
 */
const getChannels = catchAsync(async (req, res) => {
  const channels = await ChannelService.getServerChannels(
    req.params.serverId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    results: channels.length,
    data: { channels },
  });
});

/**
 * Update channel
 * @route PATCH /api/v1/servers/:serverId/channels/:channelId
 */
const updateChannel = catchAsync(async (req, res) => {
  const channel = await ChannelService.updateChannel(
    req.params.channelId,
    req.body,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    data: { channel },
  });
});

/**
 * Delete channel
 * @route DELETE /api/v1/servers/:serverId/channels/:channelId
 */
const deleteChannel = catchAsync(async (req, res) => {
  await ChannelService.deleteChannel(req.params.channelId, req.user._id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Get channel messages
 * @route GET /api/v1/servers/:serverId/channels/:channelId/messages
 */
const getMessages = catchAsync(async (req, res) => {
  const { page, limit, before } = req.query;
  const result = await ChannelService.getMessages(
    req.params.channelId,
    req.user._id,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      before: before || null,
    }
  );

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

/**
 * Send message to channel
 * @route POST /api/v1/servers/:serverId/channels/:channelId/messages
 */
const sendMessage = catchAsync(async (req, res) => {
  const message = await ChannelService.sendMessage(
    req.params.channelId,
    req.user._id,
    req.body
  );

  res.status(201).json({
    status: 'success',
    data: { message },
  });
});

/**
 * Edit message
 * @route PATCH /api/v1/servers/:serverId/channels/:channelId/messages/:messageId
 */
const editMessage = catchAsync(async (req, res) => {
  const message = await ChannelService.editMessage(
    req.params.messageId,
    req.user._id,
    req.body.content
  );

  res.status(200).json({
    status: 'success',
    data: { message },
  });
});

/**
 * Delete message
 * @route DELETE /api/v1/servers/:serverId/channels/:channelId/messages/:messageId
 */
const deleteMessage = catchAsync(async (req, res) => {
  await ChannelService.deleteMessage(req.params.messageId, req.user._id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Pin message
 * @route POST /api/v1/servers/:serverId/channels/:channelId/messages/:messageId/pin
 */
const pinMessage = catchAsync(async (req, res) => {
  const message = await ChannelService.pinMessage(req.params.messageId, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { message },
  });
});

/**
 * Unpin message
 * @route DELETE /api/v1/servers/:serverId/channels/:channelId/messages/:messageId/pin
 */
const unpinMessage = catchAsync(async (req, res) => {
  const message = await ChannelService.unpinMessage(req.params.messageId, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { message },
  });
});

/**
 * Add reaction
 * @route POST /api/v1/servers/:serverId/channels/:channelId/messages/:messageId/reactions
 */
const addReaction = catchAsync(async (req, res) => {
  const message = await ChannelService.addReaction(
    req.params.messageId,
    req.user._id,
    req.body.emoji
  );

  res.status(200).json({
    status: 'success',
    data: { message },
  });
});

/**
 * Remove reaction
 * @route DELETE /api/v1/servers/:serverId/channels/:channelId/messages/:messageId/reactions/:emoji
 */
const removeReaction = catchAsync(async (req, res) => {
  const message = await ChannelService.removeReaction(
    req.params.messageId,
    req.user._id,
    req.params.emoji
  );

  res.status(200).json({
    status: 'success',
    data: { message },
  });
});

module.exports = {
  // Server
  createServer,
  getServer,
  getMyServers,
  discoverServers,
  joinByInviteCode,
  joinServer,
  leaveServer,
  updateServer,
  deleteServer,
  regenerateInviteCode,
  // Members
  getMembers,
  kickMember,
  banMember,
  unbanMember,
  promoteMember,
  demoteMember,
  // Channels
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  addReaction,
  removeReaction,
};

