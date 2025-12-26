import { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Fade,
} from "@mui/material";
import { MdSearch, MdClose, MdPersonAdd, MdMessage, MdCheck } from "react-icons/md";
import { useRouter } from "next/router";
import { UserAvatar } from "./UserAvatar";
import { useSearchUsers, useAddFriend } from "../../services/hooks/useUser";
import { useChatStore } from "../../services/stores/chatStore";
import { newColors } from "../../Themes/newColors";

/**
 * UserSearch Component
 * Search for users by username or name with debounced input
 * 
 * Props:
 * - placeholder: string - Placeholder text for the search input
 * - onSelect: function(user) - Optional callback when a user is selected
 * - autoFocus: boolean - Whether to auto-focus the input
 */
const UserSearch = ({ 
  placeholder = "Search users...", 
  onSelect,
  autoFocus = false,
}) => {
  const router = useRouter();
  const { startDirectChat } = useChatStore();
  const addFriendMutation = useAddFriend();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  
  const { data, isLoading } = useSearchUsers(debouncedSearch);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Show results when there's a search term
  useEffect(() => {
    setShowResults(searchTerm.length >= 2);
  }, [searchTerm]);
  
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleClear = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setShowResults(false);
  };
  
  const handleUserClick = useCallback((user) => {
    if (onSelect) {
      onSelect(user);
    }
    handleClear();
  }, [onSelect]);
  
  const handleAddFriend = async (e, userId) => {
    e.stopPropagation();
    
    try {
      await addFriendMutation.mutateAsync(userId);
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };
  
  const handleMessage = async (e, userId) => {
    e.stopPropagation();
    
    try {
      const conversation = await startDirectChat(userId);
      router.push(`/chats/${conversation._id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };
  
  const users = data?.users || [];
  
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        autoFocus={autoFocus}
        onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        onBlur={() => {
          // Delay hiding results to allow click events
          setTimeout(() => setShowResults(false), 200);
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "#333",
            color: "#fff",
            borderRadius: 2,
            "& fieldset": { borderColor: "transparent" },
            "&:hover fieldset": { borderColor: "#444" },
            "&.Mui-focused fieldset": { borderColor: newColors.primary },
          },
          "& .MuiInputBase-input::placeholder": {
            color: "#888",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MdSearch size={20} color="#888" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: newColors.primary }} />
              ) : searchTerm ? (
                <IconButton size="small" onClick={handleClear}>
                  <MdClose size={18} color="#888" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />
      
      {/* Search Results */}
      <Fade in={showResults}>
        <Paper
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            mt: 1,
            bgcolor: newColors.secondary,
            borderRadius: 2,
            maxHeight: 300,
            overflow: "auto",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {users.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography sx={{ color: "#888", fontSize: 14 }}>
                {searchTerm.length < 2 
                  ? "Type at least 2 characters to search" 
                  : isLoading 
                    ? "Searching..." 
                    : "No users found"}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {users.map((user) => {
                const isFriendOrRequested = user.isFriend || sentRequests.has(user._id);
                
                return (
                  <ListItem
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    sx={{
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      },
                      "&:last-child": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <UserAvatar 
                        user={user} 
                        size={40} 
                        showActions={false}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 500 }}>
                            {user.name}
                          </Typography>
                          {user.isFriend && (
                            <Chip 
                              label="Friend" 
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                bgcolor: "rgba(81, 207, 102, 0.2)",
                                color: "#51cf66",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: "#888", fontSize: 13 }}>
                          @{user.username}
                        </Typography>
                      }
                    />
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleAddFriend(e, user._id)}
                        disabled={isFriendOrRequested || addFriendMutation.isPending}
                        sx={{
                          color: isFriendOrRequested ? "#51cf66" : newColors.primary,
                          "&:hover": { bgcolor: "rgba(167, 133, 235, 0.1)" },
                        }}
                      >
                        {isFriendOrRequested ? <MdCheck size={18} /> : <MdPersonAdd size={18} />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMessage(e, user._id)}
                        sx={{
                          color: newColors.primary,
                          "&:hover": { bgcolor: "rgba(167, 133, 235, 0.1)" },
                        }}
                      >
                        <MdMessage size={18} />
                      </IconButton>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};

export default UserSearch;


