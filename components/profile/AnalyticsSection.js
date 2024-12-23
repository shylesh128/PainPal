import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { IconButton } from "@mui/material";
import { MdOutlineTimeline, MdThumbUp, MdComment } from "react-icons/md";

const AnalyticsSection = ({ tweets, likes, comments }) => {
  return (
    <Box sx={{ width: "100%", marginTop: "30px" }}>
      <Typography
        variant="h6"
        sx={{ marginBottom: "20px", fontWeight: "bold", color: "text.primary" }}
      >
        Your Stats
      </Typography>
      <Grid container spacing={3}>
        {/* Tweets Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: "hidden" }}>
            <CardContent
              sx={{ padding: "16px", display: "flex", alignItems: "center" }}
            >
              <IconButton
                color="primary"
                sx={{ marginRight: "16px", fontSize: "28px" }}
              >
                <MdOutlineTimeline />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {tweets.length}
                </Typography>
                <Typography variant="body2" sx={{ color: "#d0d0d0" }}>
                  Tweets
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Likes Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: "hidden" }}>
            <CardContent
              sx={{ padding: "16px", display: "flex", alignItems: "center" }}
            >
              <IconButton
                color="primary"
                sx={{ marginRight: "16px", fontSize: "28px" }}
              >
                <MdThumbUp />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {likes.length}
                </Typography>
                <Typography variant="body2" sx={{ color: "#d0d0d0" }}>
                  Likes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Comments Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: "hidden" }}>
            <CardContent
              sx={{ padding: "16px", display: "flex", alignItems: "center" }}
            >
              <IconButton
                color="primary"
                sx={{ marginRight: "16px", fontSize: "28px" }}
              >
                <MdComment />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {comments.length}
                </Typography>
                <Typography variant="body2" sx={{ color: "#d0d0d0" }}>
                  Comments
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsSection;
