import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, useMediaQuery, useTheme } from "@mui/material";

import TopAppBar from "./TopAppBar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../services/stores/authStore";
import { useChatSocket } from "../../services/hooks/useChat";
import { newColors } from "../../Themes/newColors";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

// Pages that don't need authentication
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export const Layout = ({ children }) => {
  const { user, loading, initialize, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pageLoading, setPageLoading] = useState(false);

  // Check if current page is an auth page
  const isAuthPage = AUTH_PAGES.some((page) => router.pathname.startsWith(page));

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize chat socket when authenticated
  useChatSocket();

  // Handle route change loading states
  useEffect(() => {
    const handleRouteChange = () => setPageLoading(true);
    const handleRouteChangeComplete = () => setPageLoading(false);

    router?.events?.on("routeChangeStart", handleRouteChange);
    router?.events?.on("routeChangeComplete", handleRouteChangeComplete);
    
    return () => {
      router?.events?.off("routeChangeStart", handleRouteChange);
      router?.events?.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router]);

  // Redirect logged in users away from auth pages
  useEffect(() => {
    if (!loading && isAuthenticated && isAuthPage) {
      router.push("/");
    }
  }, [loading, isAuthenticated, isAuthPage, router]);

  // Redirect unauthenticated users to login for protected pages
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, isAuthPage, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Loading screen
  if (loading || pageLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: newColors.background,
        }}
      >
        <div className="loader"></div>
      </Box>
    );
  }

  // Show auth pages without sidebar
  if (isAuthPage) {
    return (
      <Box sx={{ bgcolor: newColors.background, minHeight: "100vh" }}>
        {children}
      </Box>
    );
  }

  // Don't render protected content until we know auth state
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: newColors.background,
        }}
      >
        <div className="loader"></div>
      </Box>
    );
  }

  // Main layout with sidebar
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: newColors.background }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: isMobile
            ? "100%"
            : `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px)`,
          transition: "width 0.2s ease-in-out",
        }}
      >
        {/* Top App Bar */}
        <TopAppBar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            mt: "64px", // Height of app bar
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
