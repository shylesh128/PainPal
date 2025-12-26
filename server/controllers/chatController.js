const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const chatService = require("../services/chatService");
const messageService = require("../services/messageService");
const presenceService = require("../services/presenceService");

/**
 * Chat Controller
 * REST API endpoints for chat functionality
 */

/**
 * Get user's conversations
 * GET /conversations
 */
const getConversations = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type } = req.query;

  const result = await chatService.getUserConversations(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    type: type || null,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Create a new conversation (direct or group)
 * POST /conversations
 */
const createConversation = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { type, participantId, participantIds, name } = req.body;

  let conversation;

  if (type === "direct") {
    if (!participantId) {
      return next(new AppError("Participant ID is required for direct chat", 400));
    }
    conversation = await chatService.getOrCreateDirectConversation(
      userId,
      participantId
    );
  } else if (type === "group") {
    if (!name) {
      return next(new AppError("Group name is required", 400));
    }
    if (!participantIds || participantIds.length === 0) {
      return next(new AppError("At least one participant is required", 400));
    }
    conversation = await chatService.createGroup(userId, name, participantIds);
  } else {
    return next(new AppError("Invalid conversation type", 400));
  }

  // Populate for response
  await conversation.populate("participants.user", "name photo username");

  res.status(201).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Get a single conversation
 * GET /conversations/:id
 */
const getConversation = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  const conversation = await chatService.getConversation(id, userId);

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Get messages for a conversation
 * GET /conversations/:id/messages
 */
const getMessages = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { cursor, limit = 50, direction = "older" } = req.query;

  const result = await messageService.getMessages(id, userId, {
    cursor,
    limit: parseInt(limit),
    direction,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Send a message (REST fallback)
 * POST /conversations/:id/messages
 */
const sendMessage = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { content, replyTo } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new AppError("Message content is required", 400));
  }

  const message = await messageService.sendMessage(id, userId, content.trim(), {
    replyTo,
  });

  res.status(201).json({
    status: "success",
    data: { message },
  });
});

/**
 * Mark messages as read
 * PUT /conversations/:id/messages/read
 */
const markAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { messageIds } = req.body;

  const count = await messageService.markAsRead(id, userId, messageIds);

  res.status(200).json({
    status: "success",
    data: { markedCount: count },
  });
});

/**
 * Search messages in a conversation
 * GET /conversations/:id/messages/search
 */
const searchMessages = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new AppError("Search query must be at least 2 characters", 400));
  }

  const result = await messageService.searchMessages(id, userId, q, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Update group settings
 * PUT /groups/:id
 */
const updateGroup = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { name, settings } = req.body;

  const conversation = await chatService.updateGroup(id, userId, {
    name,
    settings,
  });

  await conversation.populate("participants.user", "name photo username");

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Add participant to group
 * POST /groups/:id/participants
 */
const addParticipant = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { participantId } = req.body;

  if (!participantId) {
    return next(new AppError("Participant ID is required", 400));
  }

  const conversation = await chatService.addParticipant(id, participantId, userId);
  await conversation.populate("participants.user", "name photo username");

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Remove participant from group
 * DELETE /groups/:id/participants/:participantId
 */
const removeParticipant = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id, participantId } = req.params;

  const conversation = await chatService.removeParticipant(
    id,
    participantId,
    userId
  );
  await conversation.populate("participants.user", "name photo username");

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Leave a conversation
 * POST /conversations/:id/leave
 */
const leaveConversation = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  await chatService.leaveConversation(id, userId);

  res.status(200).json({
    status: "success",
    message: "Left conversation successfully",
  });
});

/**
 * Join a global room
 * POST /conversations/global/join
 */
const joinGlobalRoom = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const conversation = await chatService.joinGlobalRoom(userId);
  await conversation.populate("participants.user", "name photo username");

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

/**
 * Join random pairing
 * POST /conversations/random/join
 */
const joinRandomPairing = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const conversation = await chatService.joinRandomPairing(userId);
  await conversation.populate("participants.user", "name photo username");

  res.status(200).json({
    status: "success",
    data: {
      conversation,
      status: conversation.pairStatus,
    },
  });
});

/**
 * End random pairing
 * POST /conversations/random/:id/end
 */
const endRandomPairing = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  await chatService.endRandomPairing(id, userId);

  res.status(200).json({
    status: "success",
    message: "Random chat ended",
  });
});

/**
 * Get unread count
 * GET /conversations/unread
 */
const getUnreadCount = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const count = await messageService.getTotalUnreadCount(userId);

  res.status(200).json({
    status: "success",
    data: { unreadCount: count },
  });
});

/**
 * Get online status for participants in a conversation
 * GET /conversations/:id/presence
 */
const getConversationPresence = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const onlineUsers = await presenceService.getOnlineParticipants(id);
  const typingUsers = await presenceService.getTypingUsers(id);

  res.status(200).json({
    status: "success",
    data: {
      online: onlineUsers,
      typing: typingUsers,
    },
  });
});

/**
 * Delete a message
 * DELETE /conversations/:id/messages/:messageId
 */
const deleteMessage = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  await messageService.deleteMessage(messageId, userId);

  res.status(200).json({
    status: "success",
    message: "Message deleted",
  });
});

/**
 * Edit a message
 * PUT /conversations/:id/messages/:messageId
 */
const editMessage = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new AppError("Message content is required", 400));
  }

  const message = await messageService.editMessage(
    messageId,
    userId,
    content.trim()
  );

  res.status(200).json({
    status: "success",
    data: { message },
  });
});

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  searchMessages,
  updateGroup,
  addParticipant,
  removeParticipant,
  leaveConversation,
  joinGlobalRoom,
  joinRandomPairing,
  endRandomPairing,
  getUnreadCount,
  getConversationPresence,
  deleteMessage,
  editMessage,
};

