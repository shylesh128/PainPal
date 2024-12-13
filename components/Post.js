import {
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import FilePreview from "./Tweet/FilePreview";
import PostHeader from "./posts/PostHeader";
import { MdComment, MdThumbUp } from "react-icons/md";
import { use, useContext, useEffect, useState } from "react";
import { UserContext } from "../services/userContext";

const PostContent = ({ text }) => (
  <Typography
    component="div"
    sx={{ mb: 1, fontSize: "1rem", color: "#fff", opacity: 0.8 }}
  >
    {text.split("\n").map((line, index) => (
      <p key={index} style={{ margin: 0 }}>
        {line}
      </p>
    ))}
  </Typography>
);

function PostMoreOptions(props) {
  return (
    <div
      style={{
        marginTop: "16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <IconButton onClick={props.handleLike} color="primary">
        <MdThumbUp />{" "}
        <Typography
          sx={{
            ml: 1,
          }}
        >
          {props.likes.length}
        </Typography>
      </IconButton>
      <IconButton color="primary">
        <MdComment />{" "}
        <Typography
          sx={{
            ml: 1,
          }}
        >
          {props.length}
        </Typography>
      </IconButton>
    </div>
  );
}

const Post = ({ tweet }) => {
  const { sendLike, user } = useContext(UserContext);
  const [likes, setLikes] = useState(tweet?.likes?.length || 0);
  const [comments, setComments] = useState(tweet?.comments || []);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLikes(tweet?.likes);
  }, [tweet]);

  const handleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await sendLike(tweet?._id);
      setLikes(response.likes);
    } catch (error) {
      console.error("Error liking the tweet:", error);
    } finally {
      setLoading(false);
    }
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
      <PostHeader user={tweet?.userId} formattedTime={tweet?.timeStamp} />
      <PostContent text={tweet?.tweet} />
      {tweet?.files && tweet?.files.length > 0 && (
        <FilePreview files={tweet?.files} />
      )}
      <PostMoreOptions
        likes={likes}
        length={comments.length}
        handleLike={handleLike}
      />
    </Paper>
  );
};

export default Post;
