import React from "react";
import { Box, Button, Typography } from "@mui/material";
import Post from "@/components/Post";

export const TweetList = ({ loading, tweets, loadMore }) => (
  <Box
    sx={{
      width: "100%",
      marginBottom: "20px",
      padding: "2rem 0",
      overflow: "auto",
    }}
  >
    {loading ? (
      <Typography
        style={{
          width: "100%",
          textAlign: "center",
          color: "#fff",
          fontSize: "20px",
          marginTop: "20px",
          fontWeight: "bold",
        }}
      >
        Loading...
      </Typography>
    ) : (
      <div>
        {tweets.map((tweet, index) => (
          <Post
            key={index}
            text={tweet.tweet}
            username={tweet.name}
            timestamp={tweet.timeStamp}
            files={tweet.files}
          />
        ))}
      </div>
    )}

    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button onClick={loadMore} sx={{ width: "250px" }}>
        Load More
      </Button>
    </Box>
  </Box>
);
