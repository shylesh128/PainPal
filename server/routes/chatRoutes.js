const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const {
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
} = require("../controllers/chatController");

// All routes require authentication
router.use(authMiddleware);

// ==================== Conversations ====================

// Get all conversations for user
router.get("/conversations", getConversations);

// Create new conversation (direct or group)
router.post("/conversations", createConversation);

// Get unread count across all conversations
router.get("/conversations/unread", getUnreadCount);

// Join global room
router.post("/conversations/global/join", joinGlobalRoom);

// Join random pairing
router.post("/conversations/random/join", joinRandomPairing);

// End random pairing
router.post("/conversations/random/:id/end", endRandomPairing);

// Get single conversation
router.get("/conversations/:id", getConversation);

// Leave conversation
router.post("/conversations/:id/leave", leaveConversation);

// Get presence info for conversation
router.get("/conversations/:id/presence", getConversationPresence);

// ==================== Messages ====================

// Get messages for conversation
router.get("/conversations/:id/messages", getMessages);

// Send message (REST fallback - prefer socket)
router.post("/conversations/:id/messages", sendMessage);

// Mark messages as read
router.put("/conversations/:id/messages/read", markAsRead);

// Search messages in conversation
router.get("/conversations/:id/messages/search", searchMessages);

// Delete message
router.delete("/conversations/:id/messages/:messageId", deleteMessage);

// Edit message
router.put("/conversations/:id/messages/:messageId", editMessage);

// ==================== Groups ====================

// Update group settings
router.put("/groups/:id", updateGroup);

// Add participant to group
router.post("/groups/:id/participants", addParticipant);

// Remove participant from group
router.delete("/groups/:id/participants/:participantId", removeParticipant);

module.exports = router;

