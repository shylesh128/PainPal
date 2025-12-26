import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./userContext";
import axios from "axios";

export const ChatContext = createContext();

const API_VERSION = "v1";

export const ChatProvider = ({ children }) => {
  const { user, token } = useContext(UserContext);

  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Presence state
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  // Unread state
  const [totalUnread, setTotalUnread] = useState(0);

  // Refs for stable callbacks
  const activeConversationRef = useRef(activeConversation);
  activeConversationRef.current = activeConversation;

  // ==================== Socket Connection ====================

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to chat namespace
    const newSocket = io("/api/v1/chat", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Chat socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Chat socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Chat socket error:", error);
      setIsConnected(false);
    });

    // Message events
    newSocket.on("message:receive", handleMessageReceive);
    newSocket.on("message:notification", handleMessageNotification);
    newSocket.on("message:read", handleMessageRead);

    // Typing events
    newSocket.on("typing:update", handleTypingUpdate);

    // Presence events
    newSocket.on("presence:update", handlePresenceUpdate);

    // Conversation events
    newSocket.on("conversation:new", handleNewConversation);
    newSocket.on("group:updated", handleGroupUpdated);

    // Random pairing events
    newSocket.on("random:paired", handleRandomPaired);
    newSocket.on("random:ended", handleRandomEnded);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // ==================== Event Handlers ====================

  const handleMessageReceive = useCallback(({ message, conversationId }) => {
    // Add message to current conversation if active
    if (activeConversationRef.current?._id === conversationId) {
      setMessages((prev) => [...prev, message]);
    }

    // Update conversation's last message
    setConversations((prev) =>
      prev.map((conv) =>
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
      )
    );
  }, []);

  const handleMessageNotification = useCallback(({ conversationId, message }) => {
    // Update unread count if not in active conversation
    if (activeConversationRef.current?._id !== conversationId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        )
      );
      setTotalUnread((prev) => prev + 1);
    }
  }, []);

  const handleMessageRead = useCallback(({ conversationId, userId, readAt }) => {
    setMessages((prev) =>
      prev.map((msg) => {
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
      })
    );
  }, []);

  const handleTypingUpdate = useCallback(({ conversationId, userId, user, isTyping }) => {
    setTypingUsers((prev) => {
      const convTyping = { ...(prev[conversationId] || {}) };
      if (isTyping) {
        convTyping[userId] = user;
      } else {
        delete convTyping[userId];
      }
      return { ...prev, [conversationId]: convTyping };
    });
  }, []);

  const handlePresenceUpdate = useCallback(({ userId, status, lastSeen }) => {
    setOnlineUsers((prev) => ({
      ...prev,
      [userId]: { status, lastSeen },
    }));
  }, []);

  const handleNewConversation = useCallback(({ conversation }) => {
    setConversations((prev) => [conversation, ...prev]);
  }, []);

  const handleGroupUpdated = useCallback(({ conversation, action }) => {
    setConversations((prev) =>
      prev.map((conv) => (conv._id === conversation._id ? conversation : conv))
    );
    if (activeConversationRef.current?._id === conversation._id) {
      setActiveConversation(conversation);
    }
  }, []);

  const handleRandomPaired = useCallback(({ conversation }) => {
    setActiveConversation(conversation);
  }, []);

  const handleRandomEnded = useCallback(({ conversationId }) => {
    if (activeConversationRef.current?._id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, []);

  // ==================== API Methods ====================

  const fetchConversations = useCallback(async (type = null) => {
    try {
      const params = type ? `?type=${type}` : "";
      const response = await axios.get(`/api/${API_VERSION}/chat/conversations${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.data.conversations);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return { conversations: [] };
    }
  }, [token]);

  const fetchMessages = useCallback(async (conversationId, cursor = null) => {
    try {
      setLoadingMessages(true);
      const params = cursor ? `?cursor=${cursor}` : "";
      const response = await axios.get(
        `/api/${API_VERSION}/chat/conversations/${conversationId}/messages${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (cursor) {
        setMessages((prev) => [...response.data.data.messages, ...prev]);
      } else {
        setMessages(response.data.data.messages.reverse());
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { messages: [] };
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  const searchMessages = useCallback(async (conversationId, query) => {
    try {
      const response = await axios.get(
        `/api/${API_VERSION}/chat/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error searching messages:", error);
      return { messages: [] };
    }
  }, [token]);

  const createConversation = useCallback(async (type, data) => {
    try {
      const response = await axios.post(
        `/api/${API_VERSION}/chat/conversations`,
        { type, ...data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const conversation = response.data.data.conversation;
      setConversations((prev) => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }, [token]);

  const createGroup = useCallback(async (name, participantIds) => {
    return createConversation("group", { name, participantIds });
  }, [createConversation]);

  const startDirectChat = useCallback(async (participantId) => {
    return createConversation("direct", { participantId });
  }, [createConversation]);

  // ==================== Socket Methods ====================

  const joinConversation = useCallback((conversationId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("conversation:join", conversationId, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          setActiveConversation(response.conversation);
          resolve(response.conversation);
        }
      });
    });
  }, [socket]);

  const leaveConversation = useCallback((conversationId) => {
    if (socket && conversationId) {
      socket.emit("conversation:leave", conversationId);
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  }, [socket, activeConversation]);

  const sendMessage = useCallback((conversationId, content, replyTo = null) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit(
        "message:send",
        { conversationId, content, replyTo },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.message);
          }
        }
      );
    });
  }, [socket]);

  const markAsRead = useCallback((conversationId, messageIds = null) => {
    if (socket) {
      socket.emit("message:read", { conversationId, messageIds }, () => {
        // Update local unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      });
    }
  }, [socket]);

  const startTyping = useCallback((conversationId) => {
    if (socket) {
      socket.emit("typing:start", conversationId);
    }
  }, [socket]);

  const stopTyping = useCallback((conversationId) => {
    if (socket) {
      socket.emit("typing:stop", conversationId);
    }
  }, [socket]);

  const joinRandomPairing = useCallback(() => {
    return new Promise((resolve, reject) => {
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
  }, [socket]);

  const endRandomPairing = useCallback((conversationId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("random:end", conversationId, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          setActiveConversation(null);
          setMessages([]);
          resolve();
        }
      });
    });
  }, [socket]);

  // ==================== Utility Methods ====================

  const getTypingUsersForConversation = useCallback((conversationId) => {
    return Object.values(typingUsers[conversationId] || {});
  }, [typingUsers]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers[userId]?.status === "online";
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId) => {
    return onlineUsers[userId]?.lastSeen;
  }, [onlineUsers]);

  // ==================== Context Value ====================

  const contextValue = {
    // State
    socket,
    isConnected,
    conversations,
    activeConversation,
    messages,
    loadingMessages,
    onlineUsers,
    typingUsers,
    totalUnread,

    // API Methods
    fetchConversations,
    fetchMessages,
    searchMessages,
    createConversation,
    createGroup,
    startDirectChat,

    // Socket Methods
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    joinRandomPairing,
    endRandomPairing,

    // Utility Methods
    getTypingUsersForConversation,
    isUserOnline,
    getLastSeen,

    // State Setters
    setActiveConversation,
    setMessages,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

