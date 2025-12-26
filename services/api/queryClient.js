import { QueryClient } from "@tanstack/react-query";

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache is kept for 30 minutes
      gcTime: 30 * 60 * 1000,
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // User queries
  user: {
    all: ["user"],
    details: () => [...queryKeys.user.all, "details"],
    profile: (userId) => [...queryKeys.user.all, "profile", userId],
  },
  
  // Friends queries
  friends: {
    all: ["friends"],
    list: (page, limit) => [...queryKeys.friends.all, "list", { page, limit }],
    suggestions: (page, limit) => [...queryKeys.friends.all, "suggestions", { page, limit }],
  },
  
  // Tweets queries
  tweets: {
    all: ["tweets"],
    list: (page) => [...queryKeys.tweets.all, "list", { page }],
    infinite: () => [...queryKeys.tweets.all, "infinite"],
    byUser: (userId) => [...queryKeys.tweets.all, "user", userId],
  },
  
  // Chat queries
  chat: {
    all: ["chat"],
    conversations: (type) => [...queryKeys.chat.all, "conversations", { type }],
    messages: (conversationId, cursor) => [...queryKeys.chat.all, "messages", conversationId, { cursor }],
    search: (conversationId, query) => [...queryKeys.chat.all, "search", conversationId, query],
  },
  
  // Users list
  users: {
    all: ["users"],
    list: () => [...queryKeys.users.all, "list"],
  },
};

export default queryClient;

