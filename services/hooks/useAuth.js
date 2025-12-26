import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "../stores/authStore";

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * Hook to handle authentication state and redirects
 */
export const useAuth = (options = {}) => {
  const { redirectTo = "/login", requireAuth = true } = options;
  const router = useRouter();
  
  const {
    user,
    loading,
    isAuthenticated,
    initialize,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    handleGoogleLogin,
    handleGithubLogin,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (loading) return;

    const isPublicPage = PUBLIC_PAGES.includes(router.pathname);

    if (requireAuth && !isAuthenticated && !isPublicPage) {
      router.push(redirectTo);
    } else if (isAuthenticated && isPublicPage) {
      // Redirect authenticated users away from public pages
      router.push("/");
    }
  }, [loading, isAuthenticated, router.pathname, requireAuth, redirectTo]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    handleGoogleLogin,
    handleGithubLogin,
  };
};

/**
 * Hook for protected routes - redirects to login if not authenticated
 */
export const useRequireAuth = (redirectTo = "/login") => {
  return useAuth({ requireAuth: true, redirectTo });
};

/**
 * Hook for public routes - redirects to home if authenticated
 */
export const usePublicRoute = () => {
  return useAuth({ requireAuth: false });
};

export default useAuth;

