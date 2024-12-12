import React, { useState } from "react";
import { Paper, Typography, Box, IconButton, Button } from "@mui/material";

import FilePreview from "./Tweet/FilePreview";
import { letterToColorMap } from "../utils/alphaToColors";
import { newColors } from "../Themes/newColors";
import { localizeTime } from "../utils/localize";
import { IoMdHeart } from "react-icons/io";

const getColorForUsername = (username) => {
  const firstLetter = username.charAt(0).toUpperCase();
  return letterToColorMap[firstLetter] || "#000000";
};

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
  const formattedTime = localizeTime(timestamp);

  // State for like count and liked status
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  // Toggle like status and update like count
  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((prevCount) => (liked ? prevCount - 1 : prevCount + 1));
  };

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

      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Button
          onClick={toggleLike}
          sx={{
            color: liked ? newColors.primary : newColors.secondary,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <IoMdHeart />
        </Button>
        <Typography variant="body2" sx={{ color: newColors.primary }}>
          {likeCount} {likeCount === 1 ? "Like" : "Likes"}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Post;
