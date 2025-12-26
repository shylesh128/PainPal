import { Box, Typography, keyframes } from "@mui/material";
import { useChatStore } from "../../services/stores/chatStore";

// Bouncing dot animation
const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
`;

/**
 * Typing Indicator Component
 * Shows animated dots when users are typing
 */
const TypingIndicator = ({ conversationId }) => {
  const getTypingUsersForConversation = useChatStore(
    (state) => state.getTypingUsersForConversation
  );

  const typingUsers = getTypingUsersForConversation(conversationId);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    }
    return `${typingUsers.length} people are typing`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "rgba(167, 133, 235, 0.1)",
        borderRadius: 2,
        mb: 1,
      }}
    >
      {/* Animated dots */}
      <Box sx={{ display: "flex", gap: 0.3 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#a785eb",
              animation: `${bounce} 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>

      {/* Text */}
      <Typography
        sx={{
          color: "#a785eb",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        {getTypingText()}
      </Typography>
    </Box>
  );
};

export default TypingIndicator;
