import { Avatar, Box, IconButton, Typography } from "@mui/material";
import React from "react";
import { MdArrowBack } from "react-icons/md";

const ChatHeader = (props) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: 2,
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <IconButton onClick={() => props.back()}>
        <MdArrowBack color="#fff" />
      </IconButton>
      <Avatar
        alt={props.friend.name}
        src={props.friend.avatarUrl || "/default-avatar.png"}
      />
      <Typography
        variant="h6"
        sx={{
          marginLeft: 2,
        }}
      >
        {props.friend.name}
      </Typography>
    </Box>
  );
};

export default ChatHeader;
