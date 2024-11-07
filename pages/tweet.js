import { useState, useEffect, useContext, useRef } from "react";
import { Box } from "@mui/material";
import { TweetService } from "@/services/TweetService";
import { SnackbarNotification } from "@/components/Notification/SnackbarNotification";
import { TweetList } from "@/components/Tweet/TweetList";
import { TweetInput } from "@/components/Tweet/TweetInput";
import { UserContext } from "@/services/userContext";

const Tweet = () => {
  const { user, fetchTweets, addPost } = useContext(UserContext);

  const [page, setPage] = useState(1);
  const [tweets, setTweets] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const chatContainerRef = useRef(null);

  const tweetService = new TweetService(fetchTweets, addPost);

  const fetchNewTweets = async () => {
    setLoading(true);
    const res = await tweetService.fetchTweets(page);
    setTweets([...tweets, ...res]);
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
      formData.append("name", user.name);
      formData.append("email", user.email);

      // Append each image file to the FormData object
      Array.from(selectedImages).forEach((file) => {
        formData.append("files", file);
      });

      try {
        const response = await tweetService.addPost(formData);
        setTweets([response, ...tweets]);
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

  useEffect(() => {
    fetchNewTweets();
  }, [page]);

  useEffect(() => {
    scrollToBottom();
  }, [tweets]);

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
        <TweetList loading={loading} tweets={tweets} loadMore={loadMore} />
        <TweetInput
          newPost={newPost}
          setNewPost={setNewPost}
          addNewTweet={addNewTweet}
        />
      </Box>
    </>
  );
};

export default Tweet;
