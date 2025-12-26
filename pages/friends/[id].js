import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Grid,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  MdArrowBack,
  MdPersonAdd,
  MdPersonRemove,
  MdMessage,
  MdEmail,
  MdCalendarToday,
} from "react-icons/md";
import api from "../../services/api/axios";
import { useAuthStore } from "../../services/stores/authStore";
import { useFriends, useAddFriend, useRemoveFriend } from "../../services/hooks/useUser";
import { newColors } from "../../Themes/newColors";
import { getColorForUsername } from "../../utils/alphaToColors";

/**
 * User Profile Page
 * Shows full profile of a user with add/remove friend options
 */
const UserProfilePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const currentUser = useAuthStore((state) => state.user);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const { data: friendsData } = useFriends();
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();

  // Check if this user is a friend - correct data path
  const isFriend = friendsData?.data?.friends?.some((f) => f._id === id) || false;
  const isOwnProfile = currentUser?._id === id;

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/users/${id}`);
        setUserData(response.data.data.user || response.data.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.response?.data?.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleAddFriend = async () => {
    try {
      await addFriendMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriendMutation.mutateAsync(id);
      setConfirmDialog(false);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleMessage = () => {
    router.push(`/chats/${id}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: newColors.background,
        }}
      >
        <CircularProgress sx={{ color: newColors.primary }} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: newColors.background,
          gap: 2,
        }}
      >
        <Typography sx={{ color: "#ff6b6b" }}>{error}</Typography>
        <Button
          onClick={handleBack}
          sx={{
            color: newColors.primary,
            textTransform: "none",
          }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!userData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: newColors.background,
        p: 3,
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={handleBack}
        sx={{
          color: "#fff",
          mb: 2,
          "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
        }}
      >
        <MdArrowBack size={24} />
      </IconButton>

      {/* Profile Card */}
      <Card
        sx={{
          maxWidth: 700,
          mx: "auto",
          bgcolor: "#2a2a2a",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Header Banner */}
        <Box
          sx={{
            height: 120,
            background: `linear-gradient(135deg, ${newColors.primary} 0%, #6c5ce7 100%)`,
          }}
        />

        {/* Profile Content */}
        <CardContent sx={{ position: "relative", pt: 0 }}>
          {/* Avatar */}
          <Avatar
            src={userData.photo}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid #2a2a2a",
              bgcolor: newColors.primary,
              fontSize: 48,
              position: "relative",
              top: -60,
              mb: -5,
            }}
          >
            {userData.name?.[0]?.toUpperCase() || "?"}
          </Avatar>

          {/* User Info */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography
                variant="h4"
                sx={{
                  color: getColorForUsername(userData.name || userData.username),
                  fontWeight: 700,
                }}
              >
                {userData.name || userData.username}
              </Typography>
              {isFriend && (
                <Chip
                  label="Friend"
                  size="small"
                  sx={{
                    bgcolor: "rgba(81, 207, 102, 0.1)",
                    color: "#51cf66",
                  }}
                />
              )}
              {isOwnProfile && (
                <Chip
                  label="Your Profile"
                  size="small"
                  sx={{
                    bgcolor: "rgba(167, 133, 235, 0.1)",
                    color: newColors.primary,
                  }}
                />
              )}
            </Box>

            <Typography sx={{ color: "#888", fontSize: 16, mt: 0.5 }}>
              @{userData.username}
            </Typography>

            {userData.bio && (
              <Typography sx={{ color: "#ccc", mt: 2, lineHeight: 1.6 }}>
                {userData.bio}
              </Typography>
            )}

            {/* Meta Info */}
            <Box sx={{ display: "flex", gap: 3, mt: 3, flexWrap: "wrap" }}>
              {userData.email && !isOwnProfile && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MdEmail size={18} color="#888" />
                  <Typography sx={{ color: "#888", fontSize: 14 }}>
                    {userData.email}
                  </Typography>
                </Box>
              )}
              {userData.createdAt && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MdCalendarToday size={18} color="#888" />
                  <Typography sx={{ color: "#888", fontSize: 14 }}>
                    Joined {formatDate(userData.createdAt)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <>
                <Divider sx={{ my: 3, borderColor: "#444" }} />
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {isFriend ? (
                    <Button
                      variant="outlined"
                      onClick={() => setConfirmDialog(true)}
                      startIcon={<MdPersonRemove />}
                      disabled={removeFriendMutation.isPending}
                      sx={{
                        color: "#ff6b6b",
                        borderColor: "#ff6b6b",
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#ff6b6b",
                          bgcolor: "rgba(255, 107, 107, 0.1)",
                        },
                      }}
                    >
                      {removeFriendMutation.isPending ? "Removing..." : "Unfriend"}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleAddFriend}
                      startIcon={<MdPersonAdd />}
                      disabled={addFriendMutation.isPending}
                      sx={{
                        bgcolor: newColors.primary,
                        color: "#1c1c1c",
                        textTransform: "none",
                        "&:hover": { bgcolor: "#b899f0" },
                      }}
                    >
                      {addFriendMutation.isPending ? "Adding..." : "Add Friend"}
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={handleMessage}
                    startIcon={<MdMessage />}
                    sx={{
                      color: "#4dabf7",
                      borderColor: "#4dabf7",
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#4dabf7",
                        bgcolor: "rgba(77, 171, 247, 0.1)",
                      },
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Confirm Unfriend Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: "#2a2a2a",
            color: "#fff",
          },
        }}
      >
        <DialogTitle>Remove Friend</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#ccc" }}>
            Are you sure you want to remove <strong>{userData.name || userData.username}</strong> from your friends list?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(false)}
            disabled={removeFriendMutation.isPending}
            sx={{ color: "#888" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemoveFriend}
            variant="contained"
            color="error"
            disabled={removeFriendMutation.isPending}
          >
            {removeFriendMutation.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfilePage;
