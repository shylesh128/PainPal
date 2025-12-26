import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { Box, useMediaQuery, useTheme } from "@mui/material";

import TopAppBar from "./TopAppBar";
import Sidebar from "./Sidebar";
import { UserContext } from "../../services/userContext";
import { newColors } from "../../Themes/newColors";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

export const Layout = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pageLoading, setPageLoading] = useState(false);

  const handleRouteChange = () => {
    setPageLoading(true);
  };

  const handleRouteChangeComplete = () => {
    setPageLoading(false);
  };

  router?.events?.on("routeChangeStart", handleRouteChange);
  router?.events?.on("routeChangeComplete", handleRouteChangeComplete);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Pages that don't need the sidebar
  const noSidebarPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isNoSidebarPage = noSidebarPages.some((page) =>
    router.pathname.startsWith(page)
  );

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

  // Redirect logged in users from login
  if (!!user && router.pathname === "/login") {
    router.push("/");
  }

  // No sidebar for auth pages
  if (!user || isNoSidebarPage) {
    return (
      <Box sx={{ bgcolor: newColors.background, minHeight: "100vh" }}>
        {children}
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
