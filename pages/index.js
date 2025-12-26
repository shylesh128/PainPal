import { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { SnackbarNotification } from "../components/Notification/SnackbarNotification";
import { TweetList } from "../components/Tweet/TweetList";
import { TweetInput } from "../components/Tweet/TweetInput";
import { useAuthStore } from "../services/stores/authStore";
import { useTweetStore } from "../services/stores/tweetStore";
import { useCreateTweet } from "../services/hooks/useTweets";

const Tweet = () => {
  // All hooks must be called unconditionally at the top
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const { tweets, fetchTweets } = useTweetStore();
  const createTweetMutation = useCreateTweet();

  const [page, setPage] = useState(1);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const chatContainerRef = useRef(null);

  const fetchNewTweets = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await fetchTweets(page);
    } catch (error) {
      // Silently handle errors - tweetStore already handles this
    }
    setLoading(false);
  };

  const addNewTweet = async (newPost, selectedImages) => {
    if (newPost.trim() !== "") {
      if (newPost.length < 10) {
        setOpenSnackbar(true);
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append("tweet", newPost);
      formData.append("name", user?.name || "");
      formData.append("email", user?.email || "");

      // Append each image file to the FormData object
      Array.from(selectedImages).forEach((file) => {
        formData.append("files", file);
      });

      try {
        await createTweetMutation.mutateAsync(formData);
        setNewPost("");
      } catch (error) {
        console.error("Error creating tweet:", error);
      }
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const loadMore = () => {
    setPage(page + 1);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Only fetch tweets when authenticated and not loading
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchNewTweets();
    }
  }, [page, isAuthenticated, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [tweets]);

  // Don't render anything while checking auth or if not authenticated
  // The Layout component will handle the redirect
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <SnackbarNotification
        open={openSnackbar}
        handleClose={handleCloseSnackbar}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          maxWidth: "600px",
          margin: "auto",
        }}
        ref={chatContainerRef}
      >
        <TweetInput
          newPost={newPost}
          setNewPost={setNewPost}
          addNewTweet={addNewTweet}
        />
        <TweetList loading={loading} tweets={tweets} loadMore={loadMore} />
      </Box>
    </>
  );
};

export default Tweet;
