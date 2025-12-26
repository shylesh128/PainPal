import { create } from "zustand";
import Cookies from "js-cookie";
import api from "../api/axios";

const API_VERSION = "v1";

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ loading }),

  // Initialize auth state from cookies - called once on app mount
  initialize: async () => {
    // If already not loading, we've already initialized
    if (!get().loading) {
      return get().isAuthenticated;
    }

    const token = Cookies.get("pain");
    if (!token) {
      set({ loading: false, isAuthenticated: false, user: null, token: null });
      return false;
    }

    try {
      const response = await api.post("/auth/isLoggedIn");
      if (response.status === 200) {
        set({ 
          user: response.data.user, 
          isAuthenticated: true, 
          loading: false,
          token,
        });
        return true;
      }
    } catch (error) {
      // Token might be expired, interceptor will handle refresh
      if (error.response?.data?.expired) {
        // Try again after refresh (interceptor should have refreshed)
        try {
          const retryResponse = await api.post("/auth/isLoggedIn");
          if (retryResponse.status === 200) {
            set({ 
              user: retryResponse.data.user, 
              isAuthenticated: true, 
              loading: false,
              token: Cookies.get("pain"),
            });
            return true;
          }
        } catch {
          // Refresh failed
        }
      }
      // Clear invalid tokens
      Cookies.remove("pain", { path: "/" });
      Cookies.remove("refreshToken", { path: "/" });
    }
    
    set({ loading: false, isAuthenticated: false, user: null, token: null });
    return false;
  },

  // Signup
  signup: async (username, email, password, name) => {
    try {
      const response = await api.post("/auth/signup", {
        username,
        email,
        password,
        name,
      });

      if (response.status === 201) {
        const { user, token, refreshToken } = response.data;
        
        Cookies.set("pain", token, { expires: 1/48, path: "/" });
        Cookies.set("refreshToken", refreshToken, { expires: 7, path: "/" });
        
        set({ user, token, isAuthenticated: true });
        return { success: true };
      }
    } catch (error) {
      console.error("Signup failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  },

  // Login
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const { user, token, refreshToken } = response.data;
        
        Cookies.set("pain", token, { expires: 1/48, path: "/" });
        Cookies.set("refreshToken", refreshToken, { expires: 7, path: "/" });
        
        set({ user, token, isAuthenticated: true });
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
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = Cookies.get("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch (error) {
      console.error("Logout error:", error);
    }

    Cookies.remove("pain", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Logout from all devices
  logoutAll: async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (error) {
      console.error("Logout all error:", error);
    }

    Cookies.remove("pain", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Forgot password failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Failed to send reset email",
      };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post("/auth/reset-password", { token, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Reset password failed:", error);
      return {
        error: true,
        message: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  // Refresh tokens
  refreshTokens: async () => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) return null;

    try {
      const response = await api.post("/auth/refresh-token", { refreshToken });
      if (response.status === 200) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        Cookies.set("pain", token, { expires: 1/48, path: "/" });
        Cookies.set("refreshToken", newRefreshToken, { expires: 7, path: "/" });
        
        set({ token });
        return response.data;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  },

  // OAuth handlers
  handleGoogleLogin: () => {
    window.location.href = `/api/${API_VERSION}/auth/google`;
  },

  handleGithubLogin: () => {
    window.location.href = `/api/${API_VERSION}/auth/github`;
  },
}));

export default useAuthStore;
