const socketIo = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const User = require("./models/userModel");
const Conversation = require("./models/conversationModel");
const chatService = require("./services/chatService");
const messageService = require("./services/messageService");
const presenceService = require("./services/presenceService");

const secretKey = process.env.SECRET_KEY;

// Grace period for random chat reconnection (30 seconds)
const RANDOM_CHAT_GRACE_PERIOD = 30 * 1000;

// Track disconnected random chat users: { odisplayId: { conversationId, partnerId, disconnectedAt, timer } }
const disconnectedRandomUsers = new Map();

/**
 * Socket.io Module
 * Optimized real-time communication with namespaces
 */
module.exports = (httpServer) => {
  const io = socketIo(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ==================== Authentication Middleware ====================

  const authenticateSocket = async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      const parsedCookies = cookies ? cookie.parse(cookies) : {};
      const token = parsedCookies.pain;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, secretKey);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Authentication failed"));
    }
  };

  // ==================== Main Chat Namespace ====================

  const chatNamespace = io.of("/api/v1/chat");
  chatNamespace.use(authenticateSocket);

  chatNamespace.on("connection", async (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`User ${user.name} connected to chat`);

    // Set user online
    await presenceService.setOnline(userId, socket.id);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Notify friends of online status
    broadcastPresenceUpdate(socket, userId, "online");

    // ==================== Conversation Events ====================

    /**
     * Join a conversation room
     */
    socket.on("conversation:join", async (conversationId, callback) => {
      try {
        const conversation = await chatService.getConversation(
          conversationId,
          userId
        );

        if (!conversation) {
          return callback?.({ error: "Conversation not found" });
        }

        // Leave previous active conversation
        const currentRooms = Array.from(socket.rooms);
        currentRooms.forEach((room) => {
          if (room.startsWith("conv:") && room !== `conv:${conversationId}`) {
            socket.leave(room);
          }
        });

        // Join new conversation room
        socket.join(`conv:${conversationId}`);

        // Set active conversation for presence
        await presenceService.setActiveConversation(userId, conversationId);

        // Mark messages as delivered
        await messageService.markAsDelivered(conversationId, userId);

        callback?.({ success: true, conversation });
      } catch (error) {
        console.error("Join conversation error:", error);
        callback?.({ error: error.message });
      }
    });

    /**
     * Leave a conversation room
     */
    socket.on("conversation:leave", async (conversationId) => {
      socket.leave(`conv:${conversationId}`);
      await presenceService.setActiveConversation(userId, null);
      await presenceService.setTyping(userId, conversationId, false);
    });

    // ==================== Message Events ====================

    /**
     * Send a message
     */
    socket.on("message:send", async (data, callback) => {
      try {
        const { conversationId, content, replyTo } = data;

        if (!content || content.trim().length === 0) {
          return callback?.({ error: "Message content is required" });
        }

        // Save message
        const message = await messageService.sendMessage(
          conversationId,
          userId,
          content.trim(),
          { replyTo }
        );

        // Stop typing indicator
        await presenceService.setTyping(userId, conversationId, false);

        // Broadcast to conversation room
        chatNamespace.to(`conv:${conversationId}`).emit("message:receive", {
          message,
          conversationId,
        });

        // Send delivery confirmation to sender
        callback?.({ success: true, message });

        // Notify offline participants
        const participantIds = await chatService.getParticipantIds(conversationId);
        for (const participantId of participantIds) {
          if (participantId !== userId) {
            chatNamespace.to(`user:${participantId}`).emit("message:notification", {
              conversationId,
              message,
            });
          }
        }
      } catch (error) {
        console.error("Send message error:", error);
        callback?.({ error: error.message });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on("message:read", async (data, callback) => {
      try {
        const { conversationId, messageIds } = data;

        await messageService.markAsRead(conversationId, userId, messageIds);

        // Notify other participants about read status
        chatNamespace.to(`conv:${conversationId}`).emit("message:read", {
          conversationId,
          userId,
          messageIds,
          readAt: new Date(),
        });

        callback?.({ success: true });
      } catch (error) {
        console.error("Mark read error:", error);
        callback?.({ error: error.message });
      }
    });

    // ==================== Typing Events ====================

    /**
     * Start typing
     */
    socket.on("typing:start", async (conversationId) => {
      await presenceService.setTyping(userId, conversationId, true);

      socket.to(`conv:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        user: { _id: userId, name: user.name, photo: user.photo },
        isTyping: true,
      });
    });

    /**
     * Stop typing
     */
    socket.on("typing:stop", async (conversationId) => {
      await presenceService.setTyping(userId, conversationId, false);

      socket.to(`conv:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // ==================== Presence Events ====================

    /**
     * Get online users in a conversation
     */
    socket.on("presence:get", async (conversationId, callback) => {
      try {
        const online = await presenceService.getOnlineParticipants(conversationId);
        const typing = await presenceService.getTypingUsers(conversationId);

        callback?.({ online, typing });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    /**
     * Update user status
     */
    socket.on("presence:status", async (status) => {
      await presenceService.updateStatus(userId, status);
      broadcastPresenceUpdate(socket, userId, status);
    });

    // ==================== Group Events ====================

    /**
     * Create a group
     */
    socket.on("group:create", async (data, callback) => {
      try {
        const { name, participantIds } = data;

        const conversation = await chatService.createGroup(
          userId,
          name,
          participantIds
        );

        await conversation.populate("participants.user", "name photo username");

        // Notify all participants
        for (const participant of conversation.participants) {
          const pId = participant.user._id.toString();
          chatNamespace.to(`user:${pId}`).emit("conversation:new", {
            conversation,
          });
        }

        callback?.({ success: true, conversation });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    /**
     * Add participant to group
     */
    socket.on("group:addParticipant", async (data, callback) => {
      try {
        const { conversationId, participantId } = data;

        const conversation = await chatService.addParticipant(
          conversationId,
          participantId,
          userId
        );

        await conversation.populate("participants.user", "name photo username");

        // Notify the conversation
        chatNamespace.to(`conv:${conversationId}`).emit("group:updated", {
          conversation,
          action: "participantAdded",
          participantId,
        });

        // Notify the new participant
        chatNamespace.to(`user:${participantId}`).emit("conversation:new", {
          conversation,
        });

        callback?.({ success: true, conversation });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    // ==================== Random Pairing Events ====================

    /**
     * Check if user was in a random chat and can reconnect
     */
    socket.on("random:check-session", async (conversationId, callback) => {
      try {
        // Check if there's a pending reconnection for this user
        const pendingSession = disconnectedRandomUsers.get(userId);
        
        if (pendingSession && pendingSession.conversationId === conversationId) {
          // Clear the grace period timer
          if (pendingSession.timer) {
            clearTimeout(pendingSession.timer);
          }
          disconnectedRandomUsers.delete(userId);
          
          // Get the conversation
          const conversation = await chatService.getConversation(conversationId, userId);
          
          if (conversation && conversation.pairStatus === "paired" && conversation.isActive) {
            await conversation.populate("participants.user", "name photo");
            
            // Rejoin the conversation room
            socket.join(`conv:${conversationId}`);
            
            // Notify partner that user reconnected
            socket.to(`conv:${conversationId}`).emit("random:partner-reconnected", {
              conversationId,
              userId,
            });
            
            callback?.({
              success: true,
              reconnected: true,
              conversation,
            });
            return;
          }
        }
        
        callback?.({ success: false, reconnected: false });
      } catch (error) {
        callback?.({ error: error.message, reconnected: false });
      }
    });

    /**
     * Join random pairing
     */
    socket.on("random:join", async (callback) => {
      try {
        const conversation = await chatService.joinRandomPairing(userId);
        await conversation.populate("participants.user", "name photo");

        socket.join(`conv:${conversation._id}`);
        
        // Store the conversation ID on socket for disconnect handling
        socket.randomConversationId = conversation._id.toString();

        if (conversation.pairStatus === "paired") {
          // Notify both users
          chatNamespace.to(`conv:${conversation._id}`).emit("random:paired", {
            conversation,
          });
        }

        callback?.({
          success: true,
          conversation,
          status: conversation.pairStatus,
        });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    /**
     * End random pairing (intentional end)
     */
    socket.on("random:end", async (conversationId, callback) => {
      try {
        await chatService.endRandomPairing(conversationId, userId);

        // Clear any pending reconnection for this conversation
        for (const [pendingUserId, session] of disconnectedRandomUsers.entries()) {
          if (session.conversationId === conversationId) {
            if (session.timer) clearTimeout(session.timer);
            disconnectedRandomUsers.delete(pendingUserId);
          }
        }

        chatNamespace.to(`conv:${conversationId}`).emit("random:ended", {
          conversationId,
          endedBy: userId,
        });

        socket.leave(`conv:${conversationId}`);
        socket.randomConversationId = null;

        callback?.({ success: true });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    // ==================== Disconnect ====================

    socket.on("disconnect", async () => {
      console.log(`User ${user.name} disconnected from chat`);

      await presenceService.setOffline(userId);
      broadcastPresenceUpdate(socket, userId, "offline");

      // Handle random chat grace period
      const randomConvId = socket.randomConversationId;
      if (randomConvId) {
        try {
          const conversation = await Conversation.findById(randomConvId);
          
          if (conversation && conversation.pairStatus === "paired" && conversation.isActive) {
            // Find the partner
            const partner = conversation.participants.find(
              (p) => p.user.toString() !== userId
            );
            const partnerId = partner?.user?.toString();

            // Notify partner that user disconnected temporarily
            if (partnerId) {
              chatNamespace.to(`conv:${randomConvId}`).emit("random:partner-disconnected", {
                conversationId: randomConvId,
                userId,
                gracePeriod: RANDOM_CHAT_GRACE_PERIOD / 1000,
              });
            }

            // Start grace period timer
            const timer = setTimeout(async () => {
              // Grace period expired - end the chat
              disconnectedRandomUsers.delete(userId);
              
              try {
                await chatService.endRandomPairing(randomConvId, userId, "disconnect_timeout");
                
                chatNamespace.to(`conv:${randomConvId}`).emit("random:ended", {
                  conversationId: randomConvId,
                  endedBy: userId,
                  reason: "disconnect_timeout",
                });
              } catch (err) {
                console.error("Error ending random chat after grace period:", err);
              }
            }, RANDOM_CHAT_GRACE_PERIOD);

            // Store the pending reconnection
            disconnectedRandomUsers.set(userId, {
              conversationId: randomConvId,
              partnerId,
              disconnectedAt: Date.now(),
              timer,
            });
          }
        } catch (error) {
          console.error("Error handling random chat disconnect:", error);
        }
      }
    });
  });

  // ==================== Global Chat Namespace ====================

  const globalNamespace = io.of("/api/v1/chat/global");
  globalNamespace.use(authenticateSocket);

  globalNamespace.on("connection", async (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    try {
      // Join or create global room
      const room = await chatService.joinGlobalRoom(userId);

      socket.join(`global:${room._id}`);
      socket.globalRoomId = room._id.toString();

      // Notify room of new user
      globalNamespace.to(`global:${room._id}`).emit("user:joined", {
        user: { _id: userId, name: user.name, photo: user.photo },
        participantCount: room.participants.length,
      });

      // Send room info to user
      socket.emit("room:info", {
        roomId: room._id,
        participantCount: room.participants.length,
      });

      /**
       * Send global message
       */
      socket.on("message", async (content) => {
        const message = await messageService.sendMessage(
          room._id,
          userId,
          content,
          { messageType: "text" }
        );

        globalNamespace.to(`global:${room._id}`).emit("message", {
          message,
          user: { _id: userId, name: user.name, photo: user.photo },
        });
      });

      /**
       * Get participant count
       */
      socket.on("getParticipants", async (callback) => {
        const updatedRoom = await Conversation.findById(room._id);
        callback?.({ count: updatedRoom?.participants.length || 0 });
      });

      socket.on("disconnect", async () => {
        const roomId = socket.globalRoomId;

        // Remove user from global room
        const conversation = await Conversation.findById(roomId);
        if (conversation) {
          await conversation.removeParticipant(userId);

          globalNamespace.to(`global:${roomId}`).emit("user:left", {
            userId,
            participantCount: conversation.participants.length,
          });
        }
      });
    } catch (error) {
      console.error("Global chat error:", error);
      socket.emit("error", { message: "Failed to join global chat" });
    }
  });

  // ==================== Helper Functions ====================

  /**
   * Broadcast presence update to user's friends/conversations
   */
  async function broadcastPresenceUpdate(socket, userId, status) {
    try {
      // Get user's conversations to notify participants
      const result = await chatService.getUserConversations(userId, { limit: 100 });

      for (const conv of result.conversations) {
        const roomName = `conv:${conv._id}`;
        socket.to(roomName).emit("presence:update", {
          userId,
          status,
          lastSeen: status === "offline" ? new Date() : null,
        });
      }
    } catch (error) {
      console.error("Broadcast presence error:", error);
    }
  }

  return io;
};
