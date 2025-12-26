import axios from "axios";
import { createContext, useEffect, useState, useCallback } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/router";

export const UserContext = createContext();

// Create axios instance with interceptors
const api = axios.create();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies(["pain", "refreshToken"]);
  const [token, setToken] = useState(cookies.pain);
  const router = useRouter();

  const version = "v1";

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const currentToken = cookies.pain;
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If token expired and we haven't retried yet
        if (
          error.response?.status === 401 &&
          error.response?.data?.expired &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const refreshResult = await refreshTokens();
            if (refreshResult) {
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [cookies.pain]);

  /**
   * Check if user is logged in
   */
  const isLoggedIn = useCallback(async () => {
    const currentToken = cookies.pain;
    
    if (!currentToken) {
      setLoading(false);
      // Only redirect if not on public pages
      const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
      if (!publicPages.includes(router.pathname)) {
        router.push("/login");
      }
      return;
    }

    try {
      const response = await axios.post(
        `/api/${version}/auth/isLoggedIn`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );
      if (response.status === 200) {
        setUser(response.data.user);
      }
    } catch (error) {
      // If token expired, try to refresh
      if (error.response?.data?.expired) {
        const refreshResult = await refreshTokens();
        if (!refreshResult) {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [cookies.pain, router.pathname]);

  useEffect(() => {
    isLoggedIn();
  }, []);

  /**
   * Signup - Register new user
   */
  const signup = async (username, email, password, name) => {
    try {
      const response = await axios.post(`/api/${version}/auth/signup`, {
        username,
        email,
        password,
        name,
      });

      if (response.status === 201) {
        setUser(response.data.user);
        setCookie("pain", response.data.token, { path: "/", maxAge: 30 * 60 });
        setCookie("refreshToken", response.data.refreshToken, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
        setToken(response.data.token);
        router.push("/");
        return { success: true };
      }
    } catch (error) {
      console.error("Signup failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  /**
   * Login - Authenticate with username/email and password
   */
  const login = async (username, password) => {
    try {
      const response = await axios.post(`/api/${version}/auth/login`, {
        username,
        password,
      });

      if (response.status === 200) {
        setUser(response.data.user);
        setCookie("pain", response.data.token, { path: "/", maxAge: 30 * 60 });
        setCookie("refreshToken", response.data.refreshToken, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
        setToken(response.data.token);
        router.push("/");
        return { success: true };
      }
    } catch (error) {
      console.error("Login failed:", error);
      const data = error.response?.data || {};
      return {
        error: true,
        message: data.message || "Login failed",
        locked: data.locked,
        cooldown: data.cooldown,
        remainingTime: data.remainingTime,
        remainingAttempts: data.remainingAttempts,
        requiresVerification: data.requiresVerification,
        email: data.email,
      };
    }
  };

  /**
   * Refresh tokens
   */
  const refreshTokens = async () => {
    const refreshToken = cookies.refreshToken;
    if (!refreshToken) return null;

    try {
      const response = await axios.post(`/api/${version}/auth/refresh-token`, {
        refreshToken,
      });

      if (response.status === 200) {
        setCookie("pain", response.data.token, { path: "/", maxAge: 30 * 60 });
        setCookie("refreshToken", response.data.refreshToken, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
        setToken(response.data.token);
        return response.data;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  /**
   * Forgot Password - Request password reset email
   */
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`/api/${version}/auth/forgot-password`, {
        email,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Forgot password failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Failed to send reset email",
      };
    }
  };

  /**
   * Reset Password - Set new password with token
   */
  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post(`/api/${version}/auth/reset-password`, {
        token,
        password,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Reset password failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Failed to reset password",
      };
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await axios.post(`/api/${version}/auth/logout`, {
        refreshToken: cookies.refreshToken,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    setToken(null);
    removeCookie("pain", { path: "/" });
    removeCookie("refreshToken", { path: "/" });
    router.push("/login");
  };

  /**
   * Logout from all devices
   */
  const logoutAll = async () => {
    try {
      await api.post(`/api/${version}/auth/logout-all`);
    } catch (error) {
      console.error("Logout all error:", error);
    }

    setUser(null);
    setToken(null);
    removeCookie("pain", { path: "/" });
    removeCookie("refreshToken", { path: "/" });
    router.push("/login");
  };

  /**
   * Google OAuth
   */
  const handleGoogleLogin = () => {
    router.push(`/api/${version}/auth/google`);
  };

  /**
   * GitHub OAuth
   */
  const handleGithubLogin = () => {
    router.push(`/api/${version}/auth/github`);
  };

  // ==================== Existing Methods ====================

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/${version}/users`);
      return response.data.data.users;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTweets = async (page) => {
    if (!token) return [];
    try {
      const response = await api.get(`/api/${version}/tweets?page=${page}`);
      const data = response.data;
      return [...data.data.tweets];
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  };

  const addPost = async (formData) => {
    try {
      const response = await api.post(`/api/${version}/tweets`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = response.data;
      return data.data.tweet;
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };

  const sendLike = async (tweetId) => {
    try {
      const response = await api.post(`/api/${version}/tweets/${tweetId}/like`);
      const data = response.data;
      return data.data.tweet;
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/api/${version}/users/me`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const updateProfilePic = async (image) => {
    try {
      const formData = new FormData();
      Array.from(image).forEach((file) => {
        formData.append("files", file);
      });
      const response = await api.post(`/api/${version}/users/me/photo`, formData);
      setUser(response.data.data);
      return response.data;
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  const addFriend = async (friendId) => {
    try {
      const response = await api.post(
        `/api/${version}/users/me/friends/add/${friendId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const response = await api.delete(
        `/api/${version}/users/me/friends/remove/${friendId}`
      );
      return response.data.data.user;
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const getFriends = async (page, limit) => {
    try {
      const response = await api.get(
        `/api/${version}/users/me/friends?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const getSuggestions = async (page, limit) => {
    try {
      const response = await api.get(
        `/api/${version}/users/me/friends/suggestions?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const getConversationWithFriend = async (
    userId,
    friendId,
    options = { page: 1, limit: 10 }
  ) => {
    try {
      const { page, limit } = options;
      const response = await axios.get(
        `/api/${version}/conversations/${userId}/${friendId}`,
        { params: { page, limit } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const contextValue = {
    user,
    loading,
    token,
    // Auth methods
    signup,
    login,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    refreshTokens,
    handleGoogleLogin,
    handleGithubLogin,
    // Existing methods
    fetchUsers,
    fetchTweets,
    addPost,
    sendLike,
    fetchUserDetails,
    updateProfilePic,
    addFriend,
    removeFriend,
    getFriends,
    getSuggestions,
    getConversationWithFriend,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
