import { Box, Button, TextField } from "@mui/material";
import React from "react";

const ChatInput = (props) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: 2,
        boxShadow: "0px -4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={props.newMessage}
        onChange={(e) => props.setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && props.sendMessage()}
        sx={{
          color: "#ffffff",
          "&:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #307ECC inset",
            WebkitTextFillColor: "ffffff",
          },
        }}
      />
      <Button
        onClick={props.sendMessage}
        variant="contained"
        sx={{
          marginLeft: 1,
        }}
      >
        Send
      </Button>
    </Box>
  );
};

export default ChatInput;
