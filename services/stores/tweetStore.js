import { create } from "zustand";
import api from "../api/axios";

export const useTweetStore = create((set, get) => ({
  // State
  tweets: [],
  pagination: { page: 1, hasMore: true },
  draft: null,
  optimisticUpdates: {}, // Track optimistic like updates

  // Actions
  setTweets: (tweets) => set({ tweets }),
  setDraft: (draft) => set({ draft }),

  // Fetch tweets
  fetchTweets: (page = 1) => {
    return api
      .get(`/tweets?page=${page}`)
      .then((response) => {
        const newTweets = response.data?.data?.tweets || [];

        set((state) => ({
          tweets: page === 1 ? newTweets : [...state.tweets, ...newTweets],
          pagination: {
            page,
            hasMore: newTweets.length > 0,
          },
        }));

        return newTweets;
      })
      .catch(() => {
        // Silently fail - auth errors will be handled by axios interceptor
        // Return empty array to prevent UI from breaking
        return [];
      });
  },

  // Add new tweet
  addTweet: async (formData) => {
    try {
      const response = await api.post("/tweets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const newTweet = response.data.data.tweet;
      
      // Prepend to tweets list
      set((state) => ({
        tweets: [newTweet, ...state.tweets],
        draft: null,
      }));

      return newTweet;
    } catch (error) {
      console.error("Error creating tweet:", error);
      return null;
    }
  },

  // Like tweet with optimistic update
  likeTweet: async (tweetId) => {
    const { tweets, optimisticUpdates } = get();
    
    // Find the tweet
    const tweet = tweets.find((t) => t._id === tweetId);
    if (!tweet) return null;

    // Optimistically update
    const isLiked = tweet.likes?.some((l) => l === get().currentUserId) || 
                    optimisticUpdates[tweetId]?.liked;
    
    set((state) => ({
      optimisticUpdates: {
        ...state.optimisticUpdates,
        [tweetId]: { 
          liked: !isLiked,
          pending: true,
        },
      },
      tweets: state.tweets.map((t) =>
        t._id === tweetId
          ? {
              ...t,
              likesCount: isLiked ? (t.likesCount || 1) - 1 : (t.likesCount || 0) + 1,
            }
          : t
      ),
    }));

    try {
      const response = await api.post(`/tweets/${tweetId}/like`);
      const updatedTweet = response.data.data.tweet;

      // Update with actual data
      set((state) => ({
        tweets: state.tweets.map((t) => (t._id === tweetId ? updatedTweet : t)),
        optimisticUpdates: {
          ...state.optimisticUpdates,
          [tweetId]: { pending: false },
        },
      }));

      return updatedTweet;
    } catch (error) {
      console.error("Error liking tweet:", error);
      
      // Rollback optimistic update
      set((state) => ({
        tweets: state.tweets.map((t) =>
          t._id === tweetId
            ? {
                ...t,
                likesCount: isLiked ? (t.likesCount || 0) + 1 : (t.likesCount || 1) - 1,
              }
            : t
        ),
        optimisticUpdates: {
          ...state.optimisticUpdates,
          [tweetId]: { pending: false },
        },
      }));
      
      return null;
    }
  },

  // Reset tweets
  resetTweets: () => set({ 
    tweets: [], 
    pagination: { page: 1, hasMore: true } 
  }),

  // Load more tweets
  loadMoreTweets: async () => {
    const { pagination } = get();
    if (!pagination.hasMore) return [];
    return get().fetchTweets(pagination.page + 1);
  },

  // Set current user ID for optimistic updates
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
}));

export default useTweetStore;

