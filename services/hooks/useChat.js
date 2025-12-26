import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { queryKeys } from "../api/queryClient";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";

/**
 * Hook to initialize chat socket connection
 */
export const useChatSocket = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const { initSocket, disconnectSocket, isConnected } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && user && token) {
      initSocket(token);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, token]);

  return { isConnected };
};

/**
 * Hook to fetch conversations with caching
 */
export const useConversations = (type = null) => {
  const setConversations = useChatStore((state) => state.setConversations);

  return useQuery({
    queryKey: queryKeys.chat.conversations(type),
    queryFn: async () => {
      const params = type ? `?type=${type}` : "";
      const response = await api.get(`/chat/conversations${params}`);
      const conversations = response.data.data.conversations;
      setConversations(conversations);
      return conversations;
    },
    staleTime: 30 * 1000, // 30 seconds (chat needs to be fresh)
  });
};

/**
 * Hook to search messages in a conversation
 */
export const useSearchMessages = (conversationId, query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.chat.search(conversationId, query),
    queryFn: async () => {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data;
    },
    enabled: !!conversationId && !!query && query.length > 0,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Hook to manage active conversation
 */
export const useActiveConversation = () => {
  const {
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    loadingMessages,
    fetchMessages,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  } = useChatStore();

  const openConversation = useCallback(
    async (conversationId) => {
      try {
        await joinConversation(conversationId);
        await fetchMessages(conversationId);
        markAsRead(conversationId);
      } catch (error) {
        console.error("Error opening conversation:", error);
      }
    },
    [joinConversation, fetchMessages, markAsRead]
  );

  const closeConversation = useCallback(() => {
    if (activeConversation?._id) {
      leaveConversation(activeConversation._id);
    }
    setActiveConversation(null);
    setMessages([]);
  }, [activeConversation, leaveConversation, setActiveConversation, setMessages]);

  return {
    activeConversation,
    messages,
    loadingMessages,
    openConversation,
    closeConversation,
    sendMessage,
    startTyping,
    stopTyping,
    loadMore: (cursor) => fetchMessages(activeConversation?._id, cursor),
  };
};

/**
 * Hook to get typing indicators for a conversation
 */
export const useTypingIndicators = (conversationId) => {
  const getTypingUsersForConversation = useChatStore(
    (state) => state.getTypingUsersForConversation
  );
  const typingUsers = useChatStore((state) => state.typingUsers);

  return getTypingUsersForConversation(conversationId);
};

/**
 * Hook to check user online status
 */
export const useUserPresence = (userId) => {
  const isUserOnline = useChatStore((state) => state.isUserOnline);
  const getLastSeen = useChatStore((state) => state.getLastSeen);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  return {
    isOnline: isUserOnline(userId),
    lastSeen: getLastSeen(userId),
  };
};

/**
 * Hook for random pairing functionality
 */
export const useRandomPairing = () => {
  const { joinRandomPairing, endRandomPairing, activeConversation } = useChatStore();

  return {
    joinRandom: joinRandomPairing,
    endRandom: () => endRandomPairing(activeConversation?._id),
    isInRandomChat: activeConversation?.type === "random",
  };
};

/**
 * Hook to create new conversations
 */
export const useCreateConversation = () => {
  const { createGroup, startDirectChat } = useChatStore();
  const queryClient = useQueryClient();

  const createNewGroup = useCallback(
    async (name, participantIds) => {
      const conversation = await createGroup(name, participantIds);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      return conversation;
    },
    [createGroup, queryClient]
  );

  const startNewDirectChat = useCallback(
    async (participantId) => {
      const conversation = await startDirectChat(participantId);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      return conversation;
    },
    [startDirectChat, queryClient]
  );

  return {
    createGroup: createNewGroup,
    startDirectChat: startNewDirectChat,
  };
};

export default {
  useChatSocket,
  useConversations,
  useSearchMessages,
  useActiveConversation,
  useTypingIndicators,
  useUserPresence,
  useRandomPairing,
  useCreateConversation,
};

