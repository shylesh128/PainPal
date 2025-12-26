import React, { useEffect, useState } from "react";
import { useFriends, useRemoveFriend } from "../../services/hooks/useUser";
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { MdDelete, MdMessage } from "react-icons/md";
import { useRouter } from "next/router";
import { getColorForUsername } from "../../utils/alphaToColors";

const FriendsSection = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allFriends, setAllFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false, friend: null });
  
  const { data: friendsData, isLoading: loading, refetch } = useFriends(page, 10);
  const removeFriendMutation = useRemoveFriend();
  
  const handleRemoveFriend = async () => {
    if (!confirmDialog.friend) return;
    
    try {
      await removeFriendMutation.mutateAsync(confirmDialog.friend._id);
      // Remove from local state
      setAllFriends((prev) => prev.filter((f) => f._id !== confirmDialog.friend._id));
      setConfirmDialog({ open: false, friend: null });
      refetch();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };
  
  const handleMessageFriend = (friendId) => {
    router.push(`/chats/${friendId}`);
  };

  useEffect(() => {
    if (friendsData?.data?.friends) {
      if (page === 1) {
        setAllFriends(friendsData.data.friends);
      } else {
        setAllFriends((prev) => [...prev, ...friendsData.data.friends]);
      }
    }
  }, [friendsData, page]);

  const hasMore = allFriends.length < (friendsData?.total || 0);
  const totalFriends = friendsData?.total || 0;

  const handleScroll = (e) => {
    const threshold = 50;

    const bottom =
      e.target.scrollHeight - e.target.scrollTop <=
      e.target.clientHeight + threshold;

    if (bottom && !loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFriends = allFriends.filter(
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
                  key={friend._id || index}
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
                  <CardContent sx={{ padding: 0, flex: 1 }}>
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
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Message">
                      <IconButton
                        size="small"
                        onClick={() => handleMessageFriend(friend._id)}
                        sx={{ color: "#a785eb" }}
                      >
                        <MdMessage />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Unfriend">
                      <IconButton
                        size="small"
                        onClick={() => setConfirmDialog({ open: true, friend })}
                        sx={{ color: "#ff6b6b" }}
                      >
                        <MdDelete />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
      
      {/* Confirm Remove Friend Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, friend: null })}
      >
        <DialogTitle>Remove Friend</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{confirmDialog.friend?.name}</strong> from your friends list?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, friend: null })}
            disabled={removeFriendMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRemoveFriend} 
            color="error" 
            variant="contained"
            disabled={removeFriendMutation.isPending}
          >
            {removeFriendMutation.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FriendsSection;
