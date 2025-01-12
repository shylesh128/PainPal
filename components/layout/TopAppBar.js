import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import React from "react";
import AccountMenu from "./AccountMenu";

const TopAppBar = () => {
  return (
    <AppBar
      position="fixed"
      sx={{
        background: "#1c1c1c",
        // boxShadow: "none",
      }}
    >
      <Toolbar>
        <Box
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },
          }}
        ></Box>

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        ></Typography>

        <AccountMenu />
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBar;
