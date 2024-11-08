import { ListItemIcon, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";

const colors = {
  colorActive: "#ffffff",
  // colorInActive: "#002A56",
  // bgColorActive: "#002A56",
  colorInActive: "#ffa31a",
  bgColorActive: "#ffa31a",
  bgColorInActive: "#f8f9fd",
  buttonColorInactive: "#002A5685",
  // backColor: "#dae8ff",
  backColor: "#F3F3F3",
  lightBgColor: "#f8f9fd",
  checkBox: "#0053B3",
  iconInActive: "#000000",
  linkInActive: "#0053B3",
  primaryLight: "#ffa31a",
  titleColor: "#0053B3",
};

const MenuItemAcc = ({ text, icon, onClick, logout = false, active }) => {
  const [hover, setHover] = useState(false);

  return (
    <MenuItem
      sx={{
        bgcolor: active ? colors.primaryLight : "#000",
        color: "white",
        ":hover": {
          bgcolor: colors.primaryLight,
          color: colors.white,
        },
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <ListItemIcon>{icon("white")}</ListItemIcon>
      <Typography
        variant="caption"
        sx={{
          color: "white",
        }}
      >
        {text}
      </Typography>
    </MenuItem>
  );
};

export default MenuItemAcc;
