import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  MdSend,
  MdArrowBack,
  MdMoreVert,
  MdClose,
  MdSearch,
} from "react-icons/md";
import { useChatStore } from "../../services/stores/chatStore";
import { useAuthStore } from "../../services/stores/authStore";
import { newColors } from "../../Themes/newColors";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import OnlineStatus from "./OnlineStatus";

/**
 * Chat Window Component
 * Main chat area with messages, input, and real-time features
 */
const ChatWindow = ({ conversation, onBack, onOpenSettings, onOpenSearch }) => {
  const user = useAuthStore((state) => state.user);
  const {
    messages,
    fetchMessages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    loadingMessages,
    isUserOnline,
  } = useChatStore();

  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Join conversation on mount
  useEffect(() => {
    if (conversation?._id) {
      joinConversation(conversation._id)
        .then(() => {
          fetchMessages(conversation._id).then((result) => {
            setHasMore(result?.hasMore || false);
            scrollToBottom();
          });
        })
        .catch((err) => {
          // Handle socket errors gracefully - socket methods now wait for connection
          console.error("Error joining conversation:", err);
        });

      return () => {
        leaveConversation(conversation._id);
      };
    }
  }, [conversation?._id]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversation?._id && messages.length > 0) {
      markAsRead(conversation._id);
    }
  }, [conversation?._id, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const firstMessage = messages[0];
    const result = await fetchMessages(conversation._id, firstMessage._id);
    setHasMore(result?.hasMore || false);
    setLoadingMore(false);
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop < 50 && hasMore && !loadingMore) {
      handleLoadMore();
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    setInputValue("");
    setSending(true);
    stopTyping(conversation._id);

    try {
      await sendMessage(conversation._id, content, replyTo?._id);
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputValue(content); // Restore on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    startTyping(conversation._id);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation._id);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const getConversationName = () => {
    if (conversation?.name) return conversation.name;
    if (conversation?.type === "direct") {
      const other = conversation.participants?.find(
        (p) => p.user?._id !== user?._id
      );
      return other?.user?.name || "Chat";
    }
    return "Conversation";
  };

  const getOtherUser = () => {
    if (conversation?.type === "direct") {
      return conversation.participants?.find(
        (p) => p.user?._id !== user?._id
      )?.user;
    }
    return null;
  };

  const otherUser = getOtherUser();

  if (!conversation) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: newColors.background,
        }}
      >
        <Typography sx={{ color: "#666" }}>
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        bgcolor: newColors.background,
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid #333",
          bgcolor: newColors.secondary,
        }}
      >
        {onBack && (
          <IconButton onClick={onBack} sx={{ color: "#fff", mr: 1 }}>
            <MdArrowBack size={24} />
          </IconButton>
        )}

        <Avatar
          src={otherUser?.photo}
          sx={{ width: 40, height: 40, bgcolor: newColors.primary }}
        >
          {getConversationName()[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ ml: 2, flex: 1 }}>
          <Typography sx={{ color: "#fff", fontWeight: 500 }}>
            {getConversationName()}
          </Typography>
          {conversation.type === "direct" && otherUser && (
            <OnlineStatus userId={otherUser._id} showText size="small" />
          )}
          {conversation.type === "group" && (
            <Typography sx={{ color: "#888", fontSize: 12 }}>
              {conversation.participants?.length} members
            </Typography>
          )}
        </Box>

        <IconButton onClick={onOpenSearch} sx={{ color: "#888" }}>
          <MdSearch size={20} />
        </IconButton>

        {conversation.type === "group" && (
          <IconButton onClick={onOpenSettings} sx={{ color: "#888" }}>
            <MdMoreVert size={20} />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflow: "auto",
          py: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Load more indicator */}
        {loadingMore && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} sx={{ color: newColors.primary }} />
          </Box>
        )}

        {/* Loading messages */}
        {loadingMessages && messages.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: newColors.primary }} />
          </Box>
        )}

        {/* No messages */}
        {!loadingMessages && messages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#666" }}>
              No messages yet. Say hello!
            </Typography>
          </Box>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const showAvatar =
            !prevMsg ||
            prevMsg.sender?._id !== msg.sender?._id ||
            new Date(msg.createdAt) - new Date(prevMsg.createdAt) > 300000; // 5 min gap

          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              showAvatar={showAvatar}
              isGroupChat={conversation.type === "group"}
              onReply={handleReply}
            />
          );
        })}

        {/* Typing indicator */}
        <TypingIndicator conversationId={conversation._id} />

        <div ref={messagesEndRef} />
      </Box>

      {/* Reply preview */}
      {replyTo && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            bgcolor: "rgba(167, 133, 235, 0.1)",
            borderLeft: `3px solid ${newColors.primary}`,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: newColors.primary, fontSize: 12 }}>
              Replying to {replyTo.sender?.name}
            </Typography>
            <Typography sx={{ color: "#888", fontSize: 13 }}>
              {replyTo.content?.substring(0, 50)}
              {replyTo.content?.length > 50 ? "..." : ""}
            </Typography>
          </Box>
          <IconButton onClick={() => setReplyTo(null)} size="small">
            <MdClose size={18} color="#888" />
          </IconButton>
        </Box>
      )}

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #333",
          bgcolor: newColors.secondary,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={sending}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#333",
              color: "#fff",
              borderRadius: 3,
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "#444" },
              "&.Mui-focused fieldset": { borderColor: newColors.primary },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  sx={{
                    bgcolor: inputValue.trim()
                      ? newColors.primary
                      : "transparent",
                    color: inputValue.trim() ? "#1c1c1c" : "#666",
                    "&:hover": {
                      bgcolor: inputValue.trim()
                        ? "#b899f0"
                        : "transparent",
                    },
                  }}
                >
                  {sending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <MdSend size={20} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;
