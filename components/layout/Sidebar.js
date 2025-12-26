import { useContext, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MdHome,
  MdChat,
  MdPeople,
  MdPublic,
  MdPerson,
  MdSettings,
  MdMenu,
  MdClose,
  MdShuffle,
  MdLogout,
} from "react-icons/md";
import { UserContext } from "../../services/userContext";
import { useChat } from "../../services/chatContext";
import { newColors } from "../../Themes/newColors";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

const Sidebar = ({ open, onToggle }) => {
  const router = useRouter();
  const { user, logout } = useContext(UserContext);
  const { totalUnread } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems = [
    {
      label: "Home",
      icon: MdHome,
      path: "/",
      active: router.pathname === "/",
    },
    {
      label: "Messages",
      icon: MdChat,
      path: "/messages",
      active: router.pathname.startsWith("/messages"),
      badge: totalUnread,
    },
    {
      label: "Global Room",
      icon: MdPublic,
      path: "/global",
      active: router.pathname === "/global",
    },
    {
      label: "Random 1:1",
      icon: MdShuffle,
      path: "/chat",
      active: router.pathname === "/chat",
    },
    {
      label: "Friends",
      icon: MdPeople,
      path: "/list",
      active: router.pathname === "/list" || router.pathname.startsWith("/friends"),
    },
    {
      label: "Profile",
      icon: MdPerson,
      path: "/profile",
      active: router.pathname === "/profile",
    },
  ];

  const handleNavClick = (path) => {
    router.push(path);
    if (isMobile) {
      onToggle();
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: newColors.secondary,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          p: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: newColors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdChat size={18} color="#1c1c1c" />
            </Box>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 18 }}>
              Painit
            </span>
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          sx={{ color: "#888", display: { xs: "flex", md: "flex" } }}
        >
          {open ? <MdClose size={20} /> : <MdMenu size={20} />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "#333" }} />

      {/* Navigation Items */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            title={!open ? item.label : ""}
            placement="right"
          >
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2,
                  bgcolor: item.active
                    ? "rgba(167, 133, 235, 0.15)"
                    : "transparent",
                  "&:hover": {
                    bgcolor: item.active
                      ? "rgba(167, 133, 235, 0.2)"
                      : "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : "auto",
                    justifyContent: "center",
                    color: item.active ? newColors.primary : "#888",
                  }}
                >
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    max={99}
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: "#ff6b6b",
                        color: "#fff",
                        fontSize: 10,
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  >
                    <item.icon size={22} />
                  </Badge>
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.label}
                    sx={{
                      "& .MuiTypography-root": {
                        color: item.active ? "#fff" : "#aaa",
                        fontWeight: item.active ? 500 : 400,
                        fontSize: 14,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Divider sx={{ borderColor: "#333" }} />

      {/* Settings and Logout at bottom */}
      <List sx={{ px: 1, py: 1 }}>
        <Tooltip title={!open ? "Settings" : ""} placement="right">
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavClick("/profile")}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                  color: "#888",
                }}
              >
                <MdSettings size={22} />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Settings"
                  sx={{
                    "& .MuiTypography-root": {
                      color: "#aaa",
                      fontSize: 14,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>

        <Tooltip title={!open ? "Sign Out" : ""} placement="right">
          <ListItem disablePadding>
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2,
                "&:hover": { bgcolor: "rgba(255, 107, 107, 0.1)" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                  color: "#ff6b6b",
                }}
              >
                <MdLogout size={22} />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Sign Out"
                  sx={{
                    "& .MuiTypography-root": {
                      color: "#ff6b6b",
                      fontSize: 14,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>
    </Box>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: newColors.secondary,
            borderRight: "1px solid #333",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop drawer
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          boxSizing: "border-box",
          bgcolor: newColors.secondary,
          borderRight: "1px solid #333",
          transition: "width 0.2s ease-in-out",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;

