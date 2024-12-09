import React from "react";
import { Paper, Typography, Box } from "@mui/material";

import FilePreview from "./Tweet/FilePreview";
import { letterToColorMap } from "../utils/alphaToColors";
import { newColors } from "../Themes/newColors";

// Utility functions
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getColorForUsername = (username) => {
  const firstLetter = username.charAt(0).toUpperCase();

  return letterToColorMap[firstLetter] || "#000000";
};

// File Component

// Post Component
const PostHeader = ({ username, formattedTime }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: "bold",
        mr: 1,
        color: getColorForUsername(username),
        opacity: 0.5,
        textTransform: "lowercase",
      }}
    >
      @{username}
    </Typography>
    <Box sx={{ flexGrow: 1 }} />
    <Typography variant="caption" sx={{ color: newColors.primary }}>
      {formattedTime}
    </Typography>
  </Box>
);

const PostContent = ({ text }) => (
  <Typography sx={{ mb: 1, fontSize: "1rem", color: "#fff", opacity: 0.8 }}>
    {text}
  </Typography>
);

// Main Post Component
const Post = ({ text, username, timestamp, files }) => {
  const formattedTime = formatTimestamp(timestamp);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        marginBottom: 2,
        width: "100%",
        backgroundColor: "#1c1c1c",
        color: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #bdbdbd",
      }}
    >
      <PostHeader username={username} formattedTime={formattedTime} />
      <PostContent text={text} />
      {files && files.length > 0 && <FilePreview files={files} />}
    </Paper>
  );
};

export default Post;
