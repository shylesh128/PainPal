import axios from "axios";
import axiosRetry from "axios-retry";
import Cookies from "js-cookie";

const API_VERSION = "v1";

// Create axios instance
const api = axios.create({
  baseURL: `/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request deduplication map
const pendingRequests = new Map();

// Generate unique key for request
const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

// Configure axios-retry with exponential backoff
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = Cookies.get("pain");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request deduplication for GET requests
    if (config.method === "get" && !config.skipDeduplication) {
      const requestKey = getRequestKey(config);
      
      if (pendingRequests.has(requestKey)) {
        // Return existing promise
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("Duplicate request");
        return config;
      }
      
      // Store the request key
      config._requestKey = requestKey;
      pendingRequests.set(requestKey, true);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints that should not trigger redirect
const AUTH_ENDPOINTS = ["/auth/login", "/auth/signup", "/auth/isLoggedIn", "/auth/refresh-token"];

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Remove from pending requests
    if (response.config._requestKey) {
      pendingRequests.delete(response.config._requestKey);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Remove from pending requests on error
    if (originalRequest?._requestKey) {
      pendingRequests.delete(originalRequest._requestKey);
    }

    // Skip if request was aborted due to deduplication
    if (error.message === "Duplicate request") {
      return Promise.reject(error);
    }

    // Check if this is an auth endpoint
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => 
      originalRequest?.url?.includes(endpoint)
    );

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If token expired, try to refresh
      if (error.response?.data?.expired) {
        originalRequest._retry = true;

        try {
          const refreshToken = Cookies.get("refreshToken");
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          // Refresh the token
          const response = await axios.post(`/api/${API_VERSION}/auth/refresh-token`, {
            refreshToken,
          });

          if (response.status === 200) {
            const { token, refreshToken: newRefreshToken } = response.data;
            
            // Update cookies
            Cookies.set("pain", token, { expires: 1/48, path: "/" }); // 30 minutes
            Cookies.set("refreshToken", newRefreshToken, { expires: 7, path: "/" }); // 7 days

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Clear cookies on refresh failure
          Cookies.remove("pain", { path: "/" });
          Cookies.remove("refreshToken", { path: "/" });
          
          // Redirect to login (only from client-side and not on auth endpoints)
          if (typeof window !== "undefined" && !isAuthEndpoint) {
            window.location.href = "/login";
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      // For non-expired 401s on protected endpoints, redirect to login
      if (!isAuthEndpoint && typeof window !== "undefined") {
        // Clear any stale auth state
        Cookies.remove("pain", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
        
        // Redirect to login
        window.location.href = "/login";
        
        // Return a resolved promise to prevent error from propagating
        return new Promise(() => {}); // Never resolves - page is redirecting
      }
    }

    return Promise.reject(error);
  }
);

// Helper to clear pending requests (useful for cleanup)
export const clearPendingRequests = () => {
  pendingRequests.clear();
};

// Export configured instance
export default api;

