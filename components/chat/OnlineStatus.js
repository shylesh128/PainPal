import { Box, Typography, Tooltip } from "@mui/material";
import { useChat } from "../../services/chatContext";

/**
 * Online Status Badge Component
 * Shows online/offline status with optional last seen
 */
const OnlineStatus = ({
  userId,
  showText = false,
  size = "small",
  showLastSeen = true,
}) => {
  const { isUserOnline, getLastSeen } = useChat();

  const isOnline = isUserOnline(userId);
  const lastSeen = getLastSeen(userId);

  const sizes = {
    small: { dot: 8, fontSize: 11 },
    medium: { dot: 10, fontSize: 12 },
    large: { dot: 12, fontSize: 14 },
  };

  const currentSize = sizes[size] || sizes.small;

  const formatLastSeen = (date) => {
    if (!date) return "Unknown";

    const now = new Date();
    const lastSeenDate = new Date(date);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastSeenDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const statusColor = isOnline ? "#51cf66" : "#868e96";
  const statusText = isOnline ? "Online" : `Last seen ${formatLastSeen(lastSeen)}`;

  const content = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box
        sx={{
          width: currentSize.dot,
          height: currentSize.dot,
          borderRadius: "50%",
          bgcolor: statusColor,
          flexShrink: 0,
        }}
      />
      {showText && (
        <Typography
          sx={{
            fontSize: currentSize.fontSize,
            color: isOnline ? "#51cf66" : "#868e96",
          }}
        >
          {isOnline ? "Online" : showLastSeen ? formatLastSeen(lastSeen) : "Offline"}
        </Typography>
      )}
    </Box>
  );

  if (!showText) {
    return (
      <Tooltip title={statusText} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default OnlineStatus;

