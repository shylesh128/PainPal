import { useState, useEffect, useRef, useContext, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Button,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { MdSend, MdPeople, MdRefresh } from "react-icons/md";
import io from "socket.io-client";
import { UserContext } from "../services/userContext";
import { newColors } from "../Themes/newColors";

/**
 * Global Chat Page
 * Real-time global chat room for all connected users
 */
export default function GlobalChatPage() {
  const { user, token } = useContext(UserContext);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Connect to global chat namespace
  const handleConnect = useCallback(() => {
    if (!user || !token) return;

    setConnecting(true);

    const newSocket = io("/api/v1/chat/global", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to global chat");
      setConnected(true);
      setConnecting(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Global chat error:", error);
      setConnecting(false);
    });

    newSocket.on("room:info", (info) => {
      setRoomInfo(info);
    });

    newSocket.on("message", ({ message, user: sender }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: message._id,
          content: message.content,
          sender,
          createdAt: message.createdAt,
        },
      ]);
    });

    newSocket.on("user:joined", ({ user: joinedUser, participantCount }) => {
      setRoomInfo((prev) => ({ ...prev, participantCount }));
      setMessages((prev) => [
        ...prev,
        {
          _id: `join-${Date.now()}`,
          type: "system",
          content: `${joinedUser.name} joined the chat`,
          createdAt: new Date(),
        },
      ]);
    });

    newSocket.on("user:left", ({ userId, participantCount }) => {
      setRoomInfo((prev) => ({ ...prev, participantCount }));
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(newSocket);
  }, [user, token]);

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setMessages([]);
      setRoomInfo(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !socket) return;

    socket.emit("message", inputValue.trim());
    setInputValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Not connected view
  if (!connected) {
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
        <Box
          sx={{
            textAlign: "center",
            p: 4,
            bgcolor: newColors.secondary,
            borderRadius: 3,
            maxWidth: 400,
          }}
        >
          <MdPeople size={64} color={newColors.primary} />
          <Typography variant="h5" sx={{ color: "#fff", mt: 2, mb: 1 }}>
            Global Chat Room
          </Typography>
          <Typography sx={{ color: "#888", mb: 3 }}>
            Connect to chat with everyone online. Messages are public and visible
            to all participants.
          </Typography>
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connecting || !user}
            sx={{
              bgcolor: newColors.primary,
              color: "#1c1c1c",
              px: 4,
              py: 1.5,
            }}
          >
            {connecting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Connect to Chat"
            )}
          </Button>
          {!user && (
            <Typography sx={{ color: "#ff6b6b", mt: 2, fontSize: 14 }}>
              Please log in to join the chat
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Connected view
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        bgcolor: newColors.background,
      }}
    >
      {/* Sidebar - Active Users */}
      <Box
        sx={{
          width: 250,
          bgcolor: newColors.secondary,
          borderRight: "1px solid #333",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ color: "#fff", fontWeight: 500 }}>
            Global Chat
          </Typography>
          <IconButton onClick={handleDisconnect} size="small" sx={{ color: "#ff6b6b" }}>
            <MdRefresh size={18} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ color: "#888", fontSize: 12, mb: 1 }}>
            PARTICIPANTS ({roomInfo?.participantCount || 0})
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header (mobile) */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid #333",
            bgcolor: newColors.secondary,
          }}
        >
          <Typography sx={{ color: "#fff" }}>
            Global Chat ({roomInfo?.participantCount || 0} online)
          </Typography>
          <Button onClick={handleDisconnect} size="small" sx={{ color: "#ff6b6b" }}>
            Leave
          </Button>
        </Box>

        {/* Messages */}
        <Box ref={containerRef} sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {messages.map((msg) => {
            const isSystem = msg.type === "system";
            const isSender = msg.sender?._id === user?._id;

            if (isSystem) {
              return (
                <Box key={msg._id} sx={{ textAlign: "center", py: 1 }}>
                  <Typography
                    sx={{
                      color: "#666",
                      fontSize: 12,
                      bgcolor: "rgba(255,255,255,0.05)",
                      display: "inline-block",
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Box>
              );
            }

            return (
              <Box
                key={msg._id}
                sx={{
                  display: "flex",
                  flexDirection: isSender ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {!isSender && (
                  <Avatar
                    src={msg.sender?.photo}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: newColors.primary,
                      fontSize: 14,
                    }}
                  >
                    {msg.sender?.name?.[0]?.toUpperCase()}
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: "70%",
                  }}
                >
                  {!isSender && (
                    <Typography
                      sx={{
                        color: newColors.primary,
                        fontSize: 12,
                        mb: 0.3,
                        ml: 1,
                      }}
                    >
                      {msg.sender?.name}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      bgcolor: isSender ? newColors.primary : "#333",
                      color: isSender ? "#1c1c1c" : "#fff",
                      borderRadius: isSender
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      px: 2,
                      py: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 14, wordBreak: "break-word" }}>
                      {msg.content}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: "#666",
                      fontSize: 11,
                      mt: 0.3,
                      textAlign: isSender ? "right" : "left",
                      px: 0.5,
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: "1px solid #333", bgcolor: newColors.secondary }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Send a message to everyone..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
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
                    disabled={!inputValue.trim()}
                    sx={{
                      bgcolor: inputValue.trim() ? newColors.primary : "transparent",
                      color: inputValue.trim() ? "#1c1c1c" : "#666",
                      "&:hover": {
                        bgcolor: inputValue.trim() ? "#b899f0" : "transparent",
                      },
                    }}
                  >
                    <MdSend size={20} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
