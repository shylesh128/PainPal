import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { queryKeys } from "../api/queryClient";
import { useUserStore } from "../stores/userStore";
import { useAuthStore } from "../stores/authStore";

/**
 * Hook to fetch current user details with caching
 */
export const useUserDetails = () => {
  const setUserDetails = useUserStore((state) => state.setUserDetails);

  return useQuery({
    queryKey: queryKeys.user.details(),
    queryFn: async () => {
      const response = await api.get("/users/me");
      const userDetails = response.data.data;
      setUserDetails(userDetails);
      return userDetails;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch users list with caching
 */
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data.data.users;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch friends list with pagination
 */
export const useFriends = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.friends.list(page, limit),
    queryFn: async () => {
      const response = await api.get(`/users/me/friends?page=${page}&limit=${limit}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch friend suggestions with pagination
 */
export const useSuggestions = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.friends.suggestions(page, limit),
    queryFn: async () => {
      const response = await api.get(`/users/me/friends/suggestions?page=${page}&limit=${limit}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
};

/**
 * Hook to search users by username or name
 */
export const useSearchUsers = (query, options = {}) => {
  const limit = options.limit || 10;
  
  return useQuery({
    queryKey: ["users", "search", query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { users: [] };
      }
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.data;
    },
    enabled: !!query && query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to add a friend
 */
export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId) => {
      const response = await api.post(`/users/me/friends/add/${friendId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate friends and suggestions queries
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
    onError: (error) => {
      // If already friends, still invalidate friends list to ensure UI is in sync
      if (error.response?.data?.message === "You are already friends.") {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      }
    },
  });
};

/**
 * Hook to remove a friend
 */
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId) => {
      const response = await api.delete(`/users/me/friends/remove/${friendId}`);
      return response.data.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

/**
 * Hook to update profile picture
 */
export const useUpdateProfilePic = () => {
  const queryClient = useQueryClient();
  const setUserDetails = useUserStore((state) => state.setUserDetails);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (image) => {
      const formData = new FormData();
      Array.from(image).forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/users/me/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update userStore for profile page
      setUserDetails(data.data);
      // Update authStore so TopAppBar, AccountMenu, Sidebar avatars update immediately
      if (data.data?.user?.photo) {
        updateUser({ photo: data.data.user.photo });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.user.details() });
    },
  });
};

export default {
  useUserDetails,
  useUsers,
  useFriends,
  useSuggestions,
  useAddFriend,
  useRemoveFriend,
  useUpdateProfilePic,
};

