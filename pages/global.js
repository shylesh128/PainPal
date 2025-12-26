import { useState, useEffect, useRef, useContext, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Button,
  CircularProgress,
  InputAdornment,
  Chip,
} from "@mui/material";
import { MdSend, MdPeople, MdExitToApp } from "react-icons/md";
import io from "socket.io-client";
import { UserContext } from "../services/userContext";
import { newColors } from "../Themes/newColors";

/**
 * Global Chat Page
 * Real-time global chat room for all connected users
 */
export default function GlobalChatPage() {
  const { user } = useContext(UserContext);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomInfo, setRoomInfo] = useState({ participantCount: 0 });

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Connect to global chat namespace
  const handleConnect = useCallback(() => {
    if (!user) return;

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
          _id: message._id || `msg-${Date.now()}`,
          content: message.content,
          sender,
          createdAt: message.createdAt || new Date(),
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

    newSocket.on("error", ({ message }) => {
      console.error("Socket error:", message);
    });

    setSocket(newSocket);
  }, [user]);

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setMessages([]);
      setRoomInfo({ participantCount: 0 });
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
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(167, 133, 235, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <MdPeople size={40} color={newColors.primary} />
          </Box>
          <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
            Global Chat Room
          </Typography>
          <Typography sx={{ color: "#888", mb: 3, lineHeight: 1.6 }}>
            Connect to chat with everyone online. Messages are public and visible
            to all participants in the room.
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
              fontWeight: 600,
              "&:hover": { bgcolor: "#b899f0" },
            }}
          >
            {connecting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Join Global Chat"
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
        flexDirection: "column",
        bgcolor: newColors.background,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #333",
          bgcolor: newColors.secondary,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: newColors.primary }}>
            <MdPeople size={24} />
          </Avatar>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 500 }}>
              Global Chat
            </Typography>
            <Chip
              label={`${roomInfo.participantCount} online`}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                bgcolor: "rgba(81, 207, 102, 0.2)",
                color: "#51cf66",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Box>
        </Box>
        <Button
          startIcon={<MdExitToApp />}
          onClick={handleDisconnect}
          sx={{ color: "#ff6b6b" }}
        >
          Leave
        </Button>
      </Box>

      {/* Messages */}
      <Box ref={containerRef} sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ color: "#666" }}>
              No messages yet. Say hello!
            </Typography>
          </Box>
        )}

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

              <Box sx={{ maxWidth: "70%" }}>
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
  );
}
