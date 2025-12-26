import { create } from "zustand";
import api from "../api/axios";

export const useUserStore = create((set, get) => ({
  // State
  userDetails: null,
  friends: [],
  suggestions: [],
  friendsPagination: { page: 1, hasMore: true, total: 0 },
  suggestionsPagination: { page: 1, hasMore: true, total: 0 },

  // Actions
  setUserDetails: (userDetails) => set({ userDetails }),

  // Fetch user details
  fetchUserDetails: async () => {
    try {
      const response = await api.get("/users/me");
      const userDetails = response.data.data;
      set({ userDetails });
      return userDetails;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  },

  // Update profile picture
  updateProfilePic: async (image) => {
    try {
      const formData = new FormData();
      Array.from(image).forEach((file) => {
        formData.append("files", file);
      });
      
      const response = await api.post("/users/me/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      set({ userDetails: response.data.data });
      return response.data;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      return null;
    }
  },

  // Add friend
  addFriend: async (friendId) => {
    try {
      const response = await api.post(`/users/me/friends/add/${friendId}`);
      
      // Optimistically update suggestions
      set((state) => ({
        suggestions: state.suggestions.filter((s) => s._id !== friendId),
      }));
      
      return response.data;
    } catch (error) {
      console.error("Error adding friend:", error);
      return null;
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      const response = await api.delete(`/users/me/friends/remove/${friendId}`);
      
      // Optimistically update friends list
      set((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
      }));
      
      return response.data.data.user;
    } catch (error) {
      console.error("Error removing friend:", error);
      return null;
    }
  },

  // Get friends with pagination
  getFriends: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/users/me/friends?page=${page}&limit=${limit}`);
      const data = response.data;
      
      set((state) => ({
        friends: page === 1 ? data.data.friends : [...state.friends, ...data.data.friends],
        friendsPagination: {
          page,
          hasMore: data.data.friends.length === limit,
          total: data.total || state.friendsPagination.total,
        },
      }));
      
      return data;
    } catch (error) {
      console.error("Error fetching friends:", error);
      return null;
    }
  },

  // Get suggestions with pagination
  getSuggestions: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/users/me/friends/suggestions?page=${page}&limit=${limit}`);
      const data = response.data;
      
      set((state) => ({
        suggestions: page === 1 ? data.data.suggestions : [...state.suggestions, ...data.data.suggestions],
        suggestionsPagination: {
          page,
          hasMore: data.data.suggestions.length === limit,
          total: data.total || state.suggestionsPagination.total,
        },
      }));
      
      return data;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return null;
    }
  },

  // Reset pagination
  resetFriendsPagination: () => set({ 
    friends: [], 
    friendsPagination: { page: 1, hasMore: true, total: 0 } 
  }),
  
  resetSuggestionsPagination: () => set({ 
    suggestions: [], 
    suggestionsPagination: { page: 1, hasMore: true, total: 0 } 
  }),
}));

export default useUserStore;

