import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  MdDone,
  MdDoneAll,
  MdMoreVert,
  MdReply,
  MdDelete,
  MdEdit,
} from "react-icons/md";
import { useAuthStore } from "../../services/stores/authStore";
import { UserAvatar } from "../common/UserAvatar";
import { newColors } from "../../Themes/newColors";

/**
 * Message Bubble Component
 * Displays individual messages with read receipts and actions
 */
const MessageBubble = ({
  message,
  showAvatar = true,
  onReply,
  onDelete,
  onEdit,
  isGroupChat = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isSender = message.sender?._id === user?._id;
  const isSystem = message.messageType === "system";

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReadStatus = () => {
    if (!isSender) return null;

    const readCount = message.readBy?.length || 0;
    const deliveredCount = message.deliveredTo?.length || 0;

    if (readCount > 0) {
      return (
        <Tooltip title={`Read by ${readCount}`}>
          <MdDoneAll size={14} color="#51cf66" />
        </Tooltip>
      );
    }

    if (deliveredCount > 0) {
      return (
        <Tooltip title="Delivered">
          <MdDoneAll size={14} color="#868e96" />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Sent">
        <MdDone size={14} color="#868e96" />
      </Tooltip>
    );
  };

  // System message styling
  if (isSystem) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 1,
        }}
      >
        <Typography
          sx={{
            color: "#666",
            fontSize: 12,
            bgcolor: "rgba(255,255,255,0.05)",
            px: 2,
            py: 0.5,
            borderRadius: 2,
          }}
        >
          {message.content}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSender ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 1,
        mb: 1.5,
        px: 2,
      }}
    >
      {/* Avatar */}
      {showAvatar && !isSender && (
        <UserAvatar
          user={message.sender}
          size={32}
          showActions={true}
          disableMessage={false}
        />
      )}

      {/* Message Content */}
      <Box
        sx={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isSender ? "flex-end" : "flex-start",
        }}
      >
        {/* Sender name (for group chats) */}
        {isGroupChat && !isSender && (
          <Typography
            sx={{
              color: newColors.primary,
              fontSize: 12,
              fontWeight: 500,
              mb: 0.3,
              ml: 1,
            }}
          >
            {message.sender?.name}
          </Typography>
        )}

        {/* Reply reference */}
        {message.replyTo && (
          <Box
            sx={{
              bgcolor: "rgba(167, 133, 235, 0.1)",
              borderLeft: `3px solid ${newColors.primary}`,
              borderRadius: "0 8px 8px 0",
              px: 1.5,
              py: 0.5,
              mb: 0.5,
              maxWidth: "100%",
            }}
          >
            <Typography sx={{ color: "#888", fontSize: 12 }}>
              {message.replyTo.content?.substring(0, 50)}
              {message.replyTo.content?.length > 50 ? "..." : ""}
            </Typography>
          </Box>
        )}

        {/* Message bubble */}
        <Box
          sx={{
            position: "relative",
            bgcolor: isSender ? newColors.primary : "#333",
            color: isSender ? "#1c1c1c" : "#fff",
            borderRadius: isSender
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            px: 2,
            py: 1,
            minWidth: 60,
            "&:hover .message-menu": {
              opacity: 1,
            },
          }}
        >
          {/* Message text */}
          <Typography
            sx={{
              fontSize: 14,
              lineHeight: 1.4,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
          </Typography>

          {/* Edited badge */}
          {message.isEdited && (
            <Typography
              sx={{
                fontSize: 10,
                color: isSender ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
                fontStyle: "italic",
              }}
            >
              (edited)
            </Typography>
          )}

          {/* Menu button */}
          <IconButton
            className="message-menu"
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              position: "absolute",
              top: -8,
              right: isSender ? "auto" : -8,
              left: isSender ? -8 : "auto",
              opacity: 0,
              transition: "opacity 0.2s",
              bgcolor: "#1c1c1c",
              "&:hover": { bgcolor: "#333" },
              width: 24,
              height: 24,
            }}
          >
            <MdMoreVert size={14} color="#fff" />
          </IconButton>
        </Box>

        {/* Time and read status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.3,
            px: 0.5,
          }}
        >
          <Typography sx={{ color: "#666", fontSize: 11 }}>
            {formatTime(message.createdAt)}
          </Typography>
          {getReadStatus()}
        </Box>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{
          "& .MuiPaper-root": {
            bgcolor: "#292929",
            color: "#fff",
            minWidth: 150,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onReply?.(message);
            setMenuAnchor(null);
          }}
        >
          <MdReply size={18} style={{ marginRight: 8 }} />
          Reply
        </MenuItem>

        {isSender && (
          <MenuItem
            onClick={() => {
              onEdit?.(message);
              setMenuAnchor(null);
            }}
          >
            <MdEdit size={18} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
        )}

        {isSender && (
          <MenuItem
            onClick={() => {
              onDelete?.(message);
              setMenuAnchor(null);
            }}
            sx={{ color: "#ff6b6b" }}
          >
            <MdDelete size={18} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;
