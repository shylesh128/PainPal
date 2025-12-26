import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Button,
} from "@mui/material";
import { MdSearch, MdPersonAdd, MdPersonRemove, MdMessage, MdCheck } from "react-icons/md";
import { useSearchUsers, useFriends, useAddFriend, useRemoveFriend } from "../services/hooks/useUser";
import { useAuthStore } from "../services/stores/authStore";
import { newColors } from "../Themes/newColors";
import { getColorForUsername } from "../utils/alphaToColors";

/**
 * Search Users Page
 * Full page search with user profiles
 */
export default function SearchPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(debouncedQuery, { limit: 20 });
  const { data: friendsData } = useFriends();
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();

  // Check if user is friend - correct data path
  const isFriend = useCallback((userId) => {
    return friendsData?.data?.friends?.some((f) => f._id === userId) || false;
  }, [friendsData]);

  const handleAddFriend = async (userId) => {
    try {
      await addFriendMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriend = async (userId) => {
    try {
      await removeFriendMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleViewProfile = (userId) => {
    router.push(`/friends/${userId}`);
  };

  const handleMessage = (userId) => {
    router.push(`/chats/${userId}`);
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: newColors.background,
        p: 3,
      }}
    >
      {/* Search Header */}
      <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            mb: 3,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Find People
        </Typography>

        <TextField
          fullWidth
          autoFocus
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#2a2a2a",
              color: "#fff",
              borderRadius: 3,
              "& fieldset": { borderColor: "#444" },
              "&:hover fieldset": { borderColor: "#555" },
              "&.Mui-focused fieldset": { borderColor: newColors.primary },
            },
            "& .MuiInputBase-input::placeholder": { color: "#888" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch size={22} color="#888" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Search Results */}
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {/* Loading State */}
        {searchLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: newColors.primary }} />
          </Box>
        )}

        {/* Empty State - No Query */}
        {!searchQuery && !searchLoading && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <MdSearch size={64} color="#444" />
            <Typography sx={{ color: "#666", mt: 2 }}>
              Start typing to search for users
            </Typography>
          </Box>
        )}

        {/* Empty State - No Results */}
        {searchQuery && !searchLoading && (!searchResults?.users || searchResults.users.length === 0) && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ color: "#666" }}>
              No users found for "{searchQuery}"
            </Typography>
          </Box>
        )}

        {/* Results Grid */}
        {searchResults?.users?.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {searchResults.users.map((user) => {
              const isUserFriend = isFriend(user._id);
              const isOwnProfile = user._id === currentUser?._id;

              return (
                <Card
                  key={user._id}
                  sx={{
                    bgcolor: "#2a2a2a",
                    borderRadius: 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    },
                  }}
                  onClick={() => handleViewProfile(user._id)}
                >
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Avatar */}
                    <Avatar
                      src={user.photo}
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: newColors.primary,
                        fontSize: 24,
                      }}
                    >
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </Avatar>

                    {/* User Info */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          sx={{
                            color: getColorForUsername(user.name || user.username),
                            fontWeight: 600,
                            fontSize: 18,
                          }}
                        >
                          {user.name || user.username}
                        </Typography>
                        {isUserFriend && (
                          <Chip
                            label="Friend"
                            size="small"
                            sx={{
                              bgcolor: "rgba(81, 207, 102, 0.1)",
                              color: "#51cf66",
                              fontSize: 11,
                              height: 20,
                            }}
                          />
                        )}
                        {isOwnProfile && (
                          <Chip
                            label="You"
                            size="small"
                            sx={{
                              bgcolor: "rgba(167, 133, 235, 0.1)",
                              color: newColors.primary,
                              fontSize: 11,
                              height: 20,
                            }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ color: "#888", fontSize: 14 }}>
                        @{user.username}
                      </Typography>
                      {user.bio && (
                        <Typography
                          sx={{
                            color: "#aaa",
                            fontSize: 13,
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.bio}
                        </Typography>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    {!isOwnProfile && (
                      <Box
                        sx={{ display: "flex", gap: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Add/Remove Friend */}
                        {isUserFriend ? (
                          <Tooltip title="Unfriend">
                            <IconButton
                              onClick={() => handleRemoveFriend(user._id)}
                              disabled={removeFriendMutation.isPending}
                              sx={{
                                color: "#ff6b6b",
                                bgcolor: "rgba(255, 107, 107, 0.1)",
                                "&:hover": { bgcolor: "rgba(255, 107, 107, 0.2)" },
                              }}
                            >
                              {removeFriendMutation.isPending ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <MdPersonRemove size={20} />
                              )}
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Add Friend">
                            <IconButton
                              onClick={() => handleAddFriend(user._id)}
                              disabled={addFriendMutation.isPending}
                              sx={{
                                color: newColors.primary,
                                bgcolor: "rgba(167, 133, 235, 0.1)",
                                "&:hover": { bgcolor: "rgba(167, 133, 235, 0.2)" },
                              }}
                            >
                              {addFriendMutation.isPending ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <MdPersonAdd size={20} />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Message */}
                        <Tooltip title="Message">
                          <IconButton
                            onClick={() => handleMessage(user._id)}
                            sx={{
                              color: "#4dabf7",
                              bgcolor: "rgba(77, 171, 247, 0.1)",
                              "&:hover": { bgcolor: "rgba(77, 171, 247, 0.2)" },
                            }}
                          >
                            <MdMessage size={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

