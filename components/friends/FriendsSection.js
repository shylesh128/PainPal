import React, { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../../services/userContext";
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
} from "@mui/material";
import { getColorForUsername } from "../../utils/alphaToColors";

const FriendsSection = () => {
  const { getFriends } = useContext(UserContext);

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFriends, setTotalFriends] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFriends = useCallback(
    async (page, limit = 10) => {
      setLoading(true);
      try {
        const response = await getFriends(page, limit);

        if (response?.data?.friends?.length > 0) {
          setFriends((prevFriends) => {
            const updatedFriends = [...prevFriends, ...response.data.friends];
            const moreFriendsAvailable = updatedFriends.length < response.total;
            setHasMore(moreFriendsAvailable);
            return updatedFriends;
          });
          setTotalFriends(response.total);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    },
    [getFriends]
  );

  const handleScroll = (e) => {
    const threshold = 50;

    const bottom =
      e.target.scrollHeight - e.target.scrollTop <=
      e.target.clientHeight + threshold;

    if (bottom && !loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    fetchFriends(page);
  }, [page, fetchFriends]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ marginTop: "30px", width: "100%" }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={12}>
          <TextField
            fullWidth
            label="Search Friends"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ marginBottom: "20px", backgroundColor: "#fff" }}
          />

          <div
            className="friends-container"
            onScroll={handleScroll}
            style={{
              height: "500px",
              overflowY: "auto",
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            {filteredFriends.length === 0 ? (
              <Typography variant="h6" color="textSecondary">
                No friends found.
              </Typography>
            ) : (
              filteredFriends.map((friend, index) => (
                <Card
                  key={index}
                  sx={{
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: 2,
                  }}
                >
                  <Avatar
                    src={friend.photo || "/default-avatar.png"}
                    sizes="40px"
                    sx={{ marginRight: "10px" }}
                  />
                  <CardContent sx={{ padding: 0 }}>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color={getColorForUsername(friend.name)}
                    >
                      @{friend.name}
                    </Typography>
                    <Typography variant="body2" color="#d0d0d0">
                      {friend.email}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}

            {loading && (
              <Box sx={{ textAlign: "center", marginTop: "20px" }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ marginTop: "10px" }}>
                  Loading more friends...
                </Typography>
              </Box>
            )}
            {!hasMore && !loading && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ textAlign: "center", marginTop: "10px" }}
              >
                No more friends to load
              </Typography>
            )}
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FriendsSection;
