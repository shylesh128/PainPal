import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Box,
  Grid,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { MdHub, MdLink, MdTab } from "react-icons/md";

const FriendPage = () => {
  const [friendData, setFriendData] = useState(null);

  useEffect(() => {
    // Dummy data to simulate fetching data
    const data = {
      avatar: "https://randomuser.me/api/portraits/men/10.jpg",
      name: "John Doe",
      bio: "A passionate coder who loves technology and open-source contributions.",
      location: "San Francisco, CA",
      website: "https://johndoe.dev",
      socialLinks: {
        github: "https://github.com/johndoe",
        linkedin: "https://linkedin.com/in/johndoe",
        twitter: "https://twitter.com/johndoe",
      },
      tweets: [
        {
          id: 1,
          content: "Excited to start working with MUI! #React #MaterialUI",
        },
        {
          id: 2,
          content: "Just solved a tough algorithm on LeetCode! #coding",
        },
      ],
      posts: [
        {
          id: 1,
          title: "My Journey with React",
          content: "I've been learning React for the past few months...",
        },
        {
          id: 2,
          title: "The Importance of Code Reviews",
          content: "Code reviews are essential for maintaining code quality...",
        },
      ],
    };

    // Simulate a delay for fetching data
    setTimeout(() => {
      setFriendData(data);
    }, 1500);
  }, []);

  if (!friendData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box padding={3}>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={friendData.avatar}
                alt={`${friendData.name}'s avatar`}
                sx={{ width: 100, height: 100 }}
              />
            </Grid>
            <Grid item>
              <Typography variant="h4">{friendData.name}</Typography>
              <Typography variant="body1" color="textSecondary">
                {friendData.bio}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {friendData.location}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <a
                  href={friendData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {friendData.website}
                </a>
              </Typography>
              <Box>
                <IconButton
                  href={friendData.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MdHub />
                </IconButton>
                <IconButton
                  href={friendData.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MdLink />
                </IconButton>
                <IconButton
                  href={friendData.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MdTab />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <section>
        <Typography variant="h5" gutterBottom>
          Tweets
        </Typography>
        {friendData.tweets.map((tweet) => (
          <Card key={tweet.id} sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="body1">{tweet.content}</Typography>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Typography variant="h5" gutterBottom>
          Posts
        </Typography>
        {friendData.posts.map((post) => (
          <Card key={post.id} sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6">{post.title}</Typography>
              <Typography variant="body1">{post.content}</Typography>
            </CardContent>
          </Card>
        ))}
      </section>
    </Box>
  );
};

export default FriendPage;
