import { create } from "zustand";
import { io } from "socket.io-client";
import api from "../api/axios";

export const useChatStore = create((set, get) => ({
  // Socket state
  socket: null,
  isConnected: false,

  // Conversations state
  conversations: [],
  activeConversation: null,
  messages: [],
  loadingMessages: false,

  // Presence state
  onlineUsers: {},
  typingUsers: {},

  // Unread state
  totalUnread: 0,

  // Actions
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  setConversations: (conversations) => set({ conversations }),

  // Initialize socket connection
  initSocket: (token) => {
    const { socket: existingSocket } = get();
    if (existingSocket) {
      existingSocket.disconnect();
    }

    const newSocket = io("/api/v1/chat", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Chat socket connected");
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      console.log("Chat socket disconnected");
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Chat socket error:", error);
      set({ isConnected: false });
    });

    // Message events
    newSocket.on("message:receive", ({ message, conversationId }) => {
      const { activeConversation, conversations } = get();
      
      if (activeConversation?._id === conversationId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }

      set({
        conversations: conversations.map((conv) =>
          conv._id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: message.content,
                  sender: message.sender,
                  timestamp: message.createdAt,
                },
              }
            : conv
        ),
      });
    });

    newSocket.on("message:notification", ({ conversationId }) => {
      const { activeConversation } = get();
      
      if (activeConversation?._id !== conversationId) {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversationId
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
              : conv
          ),
          totalUnread: state.totalUnread + 1,
        }));
      }
    });

    newSocket.on("message:read", ({ conversationId, userId, readAt }) => {
      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg.conversation === conversationId && msg.sender._id !== userId) {
            const alreadyRead = msg.readBy?.some((r) => r.user === userId);
            if (!alreadyRead) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: userId, readAt }],
              };
            }
          }
          return msg;
        }),
      }));
    });

    // Typing events
    newSocket.on("typing:update", ({ conversationId, userId, user, isTyping }) => {
      set((state) => {
        const convTyping = { ...(state.typingUsers[conversationId] || {}) };
        if (isTyping) {
          convTyping[userId] = user;
        } else {
          delete convTyping[userId];
        }
        return { typingUsers: { ...state.typingUsers, [conversationId]: convTyping } };
      });
    });

    // Presence events
    newSocket.on("presence:update", ({ userId, status, lastSeen }) => {
      set((state) => ({
        onlineUsers: { ...state.onlineUsers, [userId]: { status, lastSeen } },
      }));
    });

    // Conversation events
    newSocket.on("conversation:new", ({ conversation }) => {
      set((state) => ({ conversations: [conversation, ...state.conversations] }));
    });

    newSocket.on("group:updated", ({ conversation }) => {
      const { activeConversation } = get();
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv._id === conversation._id ? conversation : conv
        ),
        activeConversation:
          activeConversation?._id === conversation._id ? conversation : activeConversation,
      }));
    });

    // Random pairing events
    newSocket.on("random:paired", ({ conversation }) => {
      set({ activeConversation: conversation });
    });

    newSocket.on("random:ended", ({ conversationId }) => {
      const { activeConversation } = get();
      if (activeConversation?._id === conversationId) {
        set({ activeConversation: null, messages: [] });
      }
    });

    set({ socket: newSocket });
    return newSocket;
  },

  // Disconnect socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // API Methods
  fetchConversations: async (type = null) => {
    try {
      const params = type ? `?type=${type}` : "";
      const response = await api.get(`/chat/conversations${params}`);
      set({ conversations: response.data.data.conversations });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return { conversations: [] };
    }
  },

  fetchMessages: async (conversationId, cursor = null) => {
    try {
      set({ loadingMessages: true });
      const params = cursor ? `?cursor=${cursor}` : "";
      const response = await api.get(`/chat/conversations/${conversationId}/messages${params}`);

      if (cursor) {
        set((state) => ({
          messages: [...response.data.data.messages, ...state.messages],
        }));
      } else {
        set({ messages: response.data.data.messages.reverse() });
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { messages: [] };
    } finally {
      set({ loadingMessages: false });
    }
  },

  searchMessages: async (conversationId, query) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error searching messages:", error);
      return { messages: [] };
    }
  },

  createConversation: async (type, data) => {
    try {
      const response = await api.post("/chat/conversations", { type, ...data });
      const conversation = response.data.data.conversation;
      set((state) => ({ conversations: [conversation, ...state.conversations] }));
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  createGroup: async (name, participantIds) => {
    return get().createConversation("group", { name, participantIds });
  },

  startDirectChat: async (participantId) => {
    return get().createConversation("direct", { participantId });
  },

  // Socket Methods
  joinConversation: (conversationId) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("conversation:join", conversationId, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          set({ activeConversation: response.conversation });
          resolve(response.conversation);
        }
      });
    });
  },

  leaveConversation: (conversationId) => {
    const { socket, activeConversation } = get();
    if (socket && conversationId) {
      socket.emit("conversation:leave", conversationId);
      if (activeConversation?._id === conversationId) {
        set({ activeConversation: null, messages: [] });
      }
    }
  },

  sendMessage: (conversationId, content, replyTo = null) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("message:send", { conversationId, content, replyTo }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.message);
        }
      });
    });
  },

  markAsRead: (conversationId, messageIds = null) => {
    const { socket } = get();
    if (socket) {
      socket.emit("message:read", { conversationId, messageIds }, () => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
        }));
      });
    }
  },

  startTyping: (conversationId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("typing:start", conversationId);
    }
  },

  stopTyping: (conversationId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("typing:stop", conversationId);
    }
  },

  joinRandomPairing: () => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("random:join", (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  },

  endRandomPairing: (conversationId) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("random:end", conversationId, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          set({ activeConversation: null, messages: [] });
          resolve();
        }
      });
    });
  },

  // Utility Methods
  getTypingUsersForConversation: (conversationId) => {
    const { typingUsers } = get();
    return Object.values(typingUsers[conversationId] || {});
  },

  isUserOnline: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers[userId]?.status === "online";
  },

  getLastSeen: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers[userId]?.lastSeen;
  },
}));

export default useChatStore;

