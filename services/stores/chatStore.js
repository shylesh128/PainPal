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

  // Random chat reconnection state
  partnerDisconnected: false,
  reconnectGracePeriod: 0,
  reconnectTimer: null,

  // Actions
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  setConversations: (conversations) => set({ conversations }),

  // Helper to wait for socket connection
  waitForSocket: (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const { socket, isConnected } = get();
      if (socket && isConnected) {
        resolve(socket);
        return;
      }

      const start = Date.now();
      const check = setInterval(() => {
        const { socket: s, isConnected: c } = get();
        if (s && c) {
          clearInterval(check);
          resolve(s);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject(new Error("Socket connection timeout"));
        }
      }, 100);
    });
  },

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
      // Store conversation ID in sessionStorage for reconnection
      if (typeof window !== "undefined") {
        sessionStorage.setItem("randomChatSession", conversation._id);
      }
      set({ activeConversation: conversation, partnerDisconnected: false });
    });

    newSocket.on("random:ended", ({ conversationId, reason }) => {
      const { activeConversation, reconnectTimer } = get();
      
      // Clear reconnection timer
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
      }
      
      // Clear session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("randomChatSession");
      }
      
      if (activeConversation?._id === conversationId) {
        set({ 
          activeConversation: null, 
          messages: [], 
          partnerDisconnected: false,
          reconnectGracePeriod: 0,
          reconnectTimer: null,
        });
      }
    });

    // Partner temporarily disconnected (grace period started)
    newSocket.on("random:partner-disconnected", ({ conversationId, gracePeriod }) => {
      const { activeConversation } = get();
      
      if (activeConversation?._id === conversationId) {
        // Start countdown timer
        let remaining = gracePeriod;
        
        const timer = setInterval(() => {
          remaining -= 1;
          set({ reconnectGracePeriod: remaining });
          
          if (remaining <= 0) {
            clearInterval(timer);
          }
        }, 1000);
        
        set({ 
          partnerDisconnected: true, 
          reconnectGracePeriod: gracePeriod,
          reconnectTimer: timer,
        });
      }
    });

    // Partner reconnected
    newSocket.on("random:partner-reconnected", ({ conversationId }) => {
      const { activeConversation, reconnectTimer } = get();
      
      if (activeConversation?._id === conversationId) {
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
        }
        set({ 
          partnerDisconnected: false, 
          reconnectGracePeriod: 0,
          reconnectTimer: null,
        });
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
  fetchConversations: (type = null) => {
    const params = type ? `?type=${type}` : "";
    return api.get(`/chat/conversations${params}`)
      .then((response) => {
        set({ conversations: response.data.data.conversations });
        return response.data.data;
      })
      .catch((error) => {
        // Silently ignore canceled requests (e.g., from request deduplication)
        if (error.code === "ERR_CANCELED") {
          return { conversations: [] };
        }
        console.error("Error fetching conversations:", error);
        return { conversations: [] };
      });
  },

  fetchMessages: (conversationId, cursor = null) => {
    set({ loadingMessages: true });
    const params = cursor ? `?cursor=${cursor}` : "";
    return api.get(`/chat/conversations/${conversationId}/messages${params}`)
      .then((response) => {
        if (cursor) {
          set((state) => ({
            messages: [...response.data.data.messages, ...state.messages],
          }));
        } else {
          set({ messages: response.data.data.messages.reverse() });
        }
        return response.data.data;
      })
      .catch((error) => {
        // Silently ignore canceled requests (e.g., from request deduplication)
        if (error.code === "ERR_CANCELED") {
          return { messages: [] };
        }
        console.error("Error fetching messages:", error);
        return { messages: [] };
      })
      .finally(() => {
        set({ loadingMessages: false });
      });
  },

  searchMessages: (conversationId, query) => {
    return api.get(
      `/chat/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}`
    )
      .then((response) => response.data.data)
      .catch((error) => {
        // Silently ignore canceled requests
        if (error.code === "ERR_CANCELED") {
          return { messages: [] };
        }
        console.error("Error searching messages:", error);
        return { messages: [] };
      });
  },

  createConversation: (type, data) => {
    return api.post("/chat/conversations", { type, ...data })
      .then((response) => {
        const conversation = response.data.data.conversation;
        set((state) => ({ conversations: [conversation, ...state.conversations] }));
        return conversation;
      })
      .catch((error) => {
        // Silently ignore canceled requests
        if (error.code === "ERR_CANCELED") {
          return null;
        }
        console.error("Error creating conversation:", error);
        throw error;
      });
  },

  createGroup: async (name, participantIds) => {
    return get().createConversation("group", { name, participantIds });
  },

  startDirectChat: async (participantId) => {
    return get().createConversation("direct", { participantId });
  },

  // Socket Methods
  joinConversation: async (conversationId) => {
    try {
      const socket = await get().waitForSocket();
      return new Promise((resolve, reject) => {
        socket.emit("conversation:join", conversationId, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            set({ activeConversation: response.conversation });
            resolve(response.conversation);
          }
        });
      });
    } catch (error) {
      throw error;
    }
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

  sendMessage: async (conversationId, content, replyTo = null) => {
    try {
      const socket = await get().waitForSocket();
      return new Promise((resolve, reject) => {
        socket.emit("message:send", { conversationId, content, replyTo }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.message);
          }
        });
      });
    } catch (error) {
      throw error;
    }
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

  // Check if there's a random chat session to resume
  checkRandomSession: async () => {
    // Check sessionStorage for existing session
    if (typeof window === "undefined") {
      return { reconnected: false };
    }

    const sessionId = sessionStorage.getItem("randomChatSession");
    if (!sessionId) {
      return { reconnected: false };
    }

    try {
      const socket = await get().waitForSocket();
      return new Promise((resolve) => {
        socket.emit("random:check-session", sessionId, (response) => {
          if (response.error) {
            sessionStorage.removeItem("randomChatSession");
            resolve({ reconnected: false });
          } else if (response.reconnected) {
            set({ 
              activeConversation: response.conversation,
              partnerDisconnected: false,
              reconnectGracePeriod: 0,
            });
            resolve({ reconnected: true, conversation: response.conversation });
          } else {
            sessionStorage.removeItem("randomChatSession");
            resolve({ reconnected: false });
          }
        });
      });
    } catch (error) {
      sessionStorage.removeItem("randomChatSession");
      return { reconnected: false };
    }
  },

  joinRandomPairing: async () => {
    try {
      const socket = await get().waitForSocket();
      return new Promise((resolve, reject) => {
        socket.emit("random:join", (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            // Store session for potential reconnection
            if (response.conversation && typeof window !== "undefined") {
              sessionStorage.setItem("randomChatSession", response.conversation._id);
            }
            resolve(response);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  },

  endRandomPairing: async (conversationId) => {
    // Clear session storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("randomChatSession");
    }
    
    // Clear reconnection timer
    const { reconnectTimer } = get();
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
    }

    try {
      const socket = await get().waitForSocket();
      return new Promise((resolve, reject) => {
        socket.emit("random:end", conversationId, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            set({ 
              activeConversation: null, 
              messages: [],
              partnerDisconnected: false,
              reconnectGracePeriod: 0,
              reconnectTimer: null,
            });
            resolve();
          }
        });
      });
    } catch (error) {
      // Even if socket fails, clear local state
      set({ 
        activeConversation: null, 
        messages: [],
        partnerDisconnected: false,
        reconnectGracePeriod: 0,
        reconnectTimer: null,
      });
      throw error;
    }
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

