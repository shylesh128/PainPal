/**
 * @fileoverview Server and channel routes
 * @module routes/serverRoutes
 */

const express = require('express');
const router = express.Router();

const serverController = require('../controllers/serverController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../validators/authValidator');
const { createServerSchema, updateServerSchema, createChannelSchema, updateChannelSchema } = require('../validators/serverValidator');

// All routes require authentication
router.use(protect);

// ==================== Server Discovery ====================
router.get('/discover', serverController.discoverServers);
router.get('/me', serverController.getMyServers);

// ==================== Join by Invite ====================
router.post('/join/:inviteCode', serverController.joinByInviteCode);

// ==================== Server CRUD ====================
router.route('/')
  .post(validate(createServerSchema), serverController.createServer);

router.route('/:serverId')
  .get(serverController.getServer)
  .patch(validate(updateServerSchema), serverController.updateServer)
  .delete(serverController.deleteServer);

// ==================== Server Actions ====================
router.post('/:serverId/join', serverController.joinServer);
router.post('/:serverId/leave', serverController.leaveServer);
router.post('/:serverId/invite', serverController.regenerateInviteCode);

// ==================== Member Management ====================
router.get('/:serverId/members', serverController.getMembers);
router.post('/:serverId/members/:userId/kick', serverController.kickMember);
router.post('/:serverId/members/:userId/ban', serverController.banMember);
router.post('/:serverId/members/:userId/unban', serverController.unbanMember);
router.post('/:serverId/members/:userId/promote', serverController.promoteMember);
router.post('/:serverId/members/:userId/demote', serverController.demoteMember);

// ==================== Channel Management ====================
router.route('/:serverId/channels')
  .get(serverController.getChannels)
  .post(validate(createChannelSchema), serverController.createChannel);

router.route('/:serverId/channels/:channelId')
  .patch(validate(updateChannelSchema), serverController.updateChannel)
  .delete(serverController.deleteChannel);

// ==================== Channel Messages ====================
router.route('/:serverId/channels/:channelId/messages')
  .get(serverController.getMessages)
  .post(serverController.sendMessage);

router.route('/:serverId/channels/:channelId/messages/:messageId')
  .patch(serverController.editMessage)
  .delete(serverController.deleteMessage);

// Message pins
router.post('/:serverId/channels/:channelId/messages/:messageId/pin', serverController.pinMessage);
router.delete('/:serverId/channels/:channelId/messages/:messageId/pin', serverController.unpinMessage);

// Message reactions
router.post('/:serverId/channels/:channelId/messages/:messageId/reactions', serverController.addReaction);
router.delete('/:serverId/channels/:channelId/messages/:messageId/reactions/:emoji', serverController.removeReaction);

module.exports = router;

