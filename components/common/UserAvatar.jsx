import { useState } from "react";
import {
  Avatar,
  Box,
  Tooltip,
  IconButton,
  Fade,
  CircularProgress,
} from "@mui/material";
import { MdPersonAdd, MdMessage, MdCheck, MdPersonRemove } from "react-icons/md";
import { useRouter } from "next/router";
import { useAuthStore } from "../../services/stores/authStore";
import { useChatStore } from "../../services/stores/chatStore";
import { useAddFriend, useFriends, useRemoveFriend } from "../../services/hooks/useUser";
import { newColors } from "../../Themes/newColors";

/**
 * UserAvatar Component
 * Reusable avatar with hover actions for adding friends and messaging
 * 
 * Props:
 * - user: { _id, name, photo, username } - The user to display
 * - size: number - Avatar size (default: 40)
 * - showActions: boolean - Whether to show hover actions (default: true)
 * - onClick: function - Optional click handler
 * - disableMessage: boolean - Disable message button
 * - disableAddFriend: boolean - Disable add friend button
 */
export const UserAvatar = ({
  user,
  size = 40,
  showActions = true,
  onClick,
  disableMessage = false,
  disableAddFriend = false,
}) => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { startDirectChat } = useChatStore();
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();
  const { data: friendsData } = useFriends();
  
  const [isHovered, setIsHovered] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  
  // Don't show actions for own avatar
  const isOwnProfile = currentUser?._id === user?._id;
  
  // Check if user is already a friend - correct data path: { data: { friends: [...] } }
  const isFriend = friendsData?.data?.friends?.some(
    (friend) => friend._id === user?._id
  ) || false;
  
  const handleAddFriend = async (e) => {
    e.stopPropagation();
    if (!user?._id || friendRequestSent || isFriend) return;
    
    try {
      await addFriendMutation.mutateAsync(user._id);
      setFriendRequestSent(true);
    } catch (error) {
      // If already friends, just ignore the error
      if (error.response?.data?.message === "You are already friends.") {
        return;
      }
      console.error("Error adding friend:", error);
    }
  };
  
  const handleRemoveFriend = async (e) => {
    e.stopPropagation();
    if (!user?._id || !isFriend) return;
    
    try {
      await removeFriendMutation.mutateAsync(user._id);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };
  
  const handleMessage = async (e) => {
    e.stopPropagation();
    if (!user?._id) return;
    
    try {
      const conversation = await startDirectChat(user._id);
      router.push(`/chats/${conversation._id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };
  
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };
  
  if (!user) return null;
  
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar
        src={user.photo}
        onClick={handleClick}
        sx={{
          width: size,
          height: size,
          bgcolor: newColors.primary,
          cursor: onClick ? "pointer" : "default",
          transition: "transform 0.2s",
          "&:hover": onClick ? { transform: "scale(1.05)" } : {},
        }}
      >
        {user.name?.[0]?.toUpperCase() || "?"}
      </Avatar>
      
      {/* Hover Actions */}
      {showActions && !isOwnProfile && (
        <Fade in={isHovered}>
          <Box
            sx={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 0.5,
              mb: 0.5,
              p: 0.5,
              bgcolor: "rgba(0,0,0,0.9)",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          >
            {/* Add Friend / Unfriend Button */}
            {!disableAddFriend && (
              isFriend ? (
                <Tooltip title="Unfriend">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleRemoveFriend}
                      disabled={removeFriendMutation.isPending}
                      sx={{
                        color: "#ff6b6b",
                        "&:hover": { bgcolor: "rgba(255, 107, 107, 0.1)" },
                      }}
                    >
                      {removeFriendMutation.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <MdPersonRemove size={16} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title={friendRequestSent ? "Request sent" : "Add Friend"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleAddFriend}
                      disabled={friendRequestSent || addFriendMutation.isPending}
                      sx={{
                        color: friendRequestSent ? "#51cf66" : newColors.primary,
                        "&:hover": { bgcolor: "rgba(167, 133, 235, 0.1)" },
                      }}
                    >
                      {addFriendMutation.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : friendRequestSent ? (
                        <MdCheck size={16} />
                      ) : (
                        <MdPersonAdd size={16} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )
            )}
            
            {/* Message Button */}
            {!disableMessage && (
              <Tooltip title="Message">
                <IconButton
                  size="small"
                  onClick={handleMessage}
                  sx={{
                    color: newColors.primary,
                    "&:hover": { bgcolor: "rgba(167, 133, 235, 0.1)" },
                  }}
                >
                  <MdMessage size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default UserAvatar;


