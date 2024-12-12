import { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { TweetList } from "../components/Tweet/TweetList";
import { TweetInput } from "../components/Tweet/TweetInput";
import { SnackbarNotification } from "../components/Notification/SnackbarNotification";
import { useDispatch, useSelector } from "react-redux";
import { fetchTweets, addPost } from "../store/tweetsSlice";

const Tweet = () => {
  const chatContainerRef = useRef(null);
  const { tweets, loading } = useSelector((state) => state.tweets);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [newPost, setNewPost] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [page, setPage] = useState(1);

  console.log(tweets);

  useEffect(() => {
    dispatch(fetchTweets(page)); // Dispatch fetchTweets when page changes
  }, [page, dispatch]);

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

      // Dispatch addPost action
      dispatch(addPost(formData));
      setNewPost(""); // Clear new post input
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

  return (
    <>
      <SnackbarNotification
        open={openSnackbar}
        handleClose={handleCloseSnackbar}
      />
      <TweetInput
        newPost={newPost}
        setNewPost={setNewPost}
        addNewTweet={addNewTweet}
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
      </Box>
    </>
  );
};

export default Tweet;
