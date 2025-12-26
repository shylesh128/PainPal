import { useContext, useState } from "react";
import { useRouter } from "next/router";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  MdPerson,
  MdSettings,
  MdLogout,
  MdNotifications,
  MdSecurity,
  MdHelp,
} from "react-icons/md";
import { UserContext } from "../../services/userContext";
import { newColors } from "../../Themes/newColors";

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useContext(UserContext);
  const router = useRouter();

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    router.push(path);
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 1 }}
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          src={user?.photo}
          sx={{
            width: 36,
            height: 36,
            bgcolor: newColors.primary,
            fontSize: 14,
            border: "2px solid #333",
          }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            bgcolor: "#292929",
            minWidth: 220,
            borderRadius: 2,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.05)",
              },
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "#292929",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #333" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src={user?.photo}
              sx={{
                width: 40,
                height: 40,
                bgcolor: newColors.primary,
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 500, fontSize: 14 }}>
                {user?.name}
              </Typography>
              <Typography sx={{ color: "#888", fontSize: 12 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <MenuItem onClick={() => handleNavigation("/profile")}>
          <ListItemIcon>
            <MdPerson size={20} color="#888" />
          </ListItemIcon>
          <ListItemText
            primary="View Profile"
            sx={{ "& .MuiTypography-root": { color: "#fff", fontSize: 14 } }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleNavigation("/profile")}>
          <ListItemIcon>
            <MdSettings size={20} color="#888" />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            sx={{ "& .MuiTypography-root": { color: "#fff", fontSize: 14 } }}
          />
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <MdNotifications size={20} color="#888" />
          </ListItemIcon>
          <ListItemText
            primary="Notifications"
            sx={{ "& .MuiTypography-root": { color: "#fff", fontSize: 14 } }}
          />
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <MdSecurity size={20} color="#888" />
          </ListItemIcon>
          <ListItemText
            primary="Privacy & Security"
            sx={{ "& .MuiTypography-root": { color: "#fff", fontSize: 14 } }}
          />
        </MenuItem>

        <Divider sx={{ borderColor: "#333", my: 1 }} />

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <MdHelp size={20} color="#888" />
          </ListItemIcon>
          <ListItemText
            primary="Help & Support"
            sx={{ "& .MuiTypography-root": { color: "#fff", fontSize: 14 } }}
          />
        </MenuItem>

        <Divider sx={{ borderColor: "#333", my: 1 }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <MdLogout size={20} color="#ff6b6b" />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            sx={{ "& .MuiTypography-root": { color: "#ff6b6b", fontSize: 14 } }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountMenu;
