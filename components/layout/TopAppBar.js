import { useRouter } from "next/router";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MdMenu, MdChat } from "react-icons/md";
import AccountMenu from "./AccountMenu";
import { useAuthStore } from "../../services/stores/authStore";
import { useChatStore } from "../../services/stores/chatStore";
import { newColors } from "../../Themes/newColors";

const TopAppBar = ({ onMenuClick, sidebarOpen }) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const totalUnread = useChatStore((state) => state.totalUnread);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const getPageTitle = () => {
    const path = router.pathname;
    
    if (path === "/") return "Home";
    if (path === "/messages") return "Messages";
    if (path === "/global") return "Global Chat";
    if (path === "/chat") return "Random Chat";
    if (path === "/list") return "Friends";
    if (path === "/profile") return "Profile";
    if (path.startsWith("/chats/")) return "Chat";
    if (path.startsWith("/friends/")) return "Friend Profile";
    
    return "Painit";
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: newColors.secondary,
        boxShadow: "0 1px 0 #333",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Menu button for mobile */}
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
            sx={{ mr: 2, color: "#fff" }}
          >
            <MdMenu size={24} />
          </IconButton>
        )}

        {/* Page Title */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: "#fff",
            fontWeight: 500,
            fontSize: { xs: 16, sm: 18 },
          }}
        >
          {getPageTitle()}
        </Typography>

        {/* Action Icons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Messages */}
          <Tooltip title="Messages">
            <IconButton
              onClick={() => router.push("/messages")}
              sx={{ color: "#888" }}
            >
              <Badge
                badgeContent={totalUnread}
                max={99}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#ff6b6b",
                    color: "#fff",
                    fontSize: 10,
                  },
                }}
              >
                <MdChat size={22} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Account Menu */}
          <AccountMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBar;
