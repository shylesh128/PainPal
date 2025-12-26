import { useState, useEffect, useRef } from "react";
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
  LinearProgress,
} from "@mui/material";
import { MdSend, MdShuffle, MdClose, MdRefresh, MdPersonAdd } from "react-icons/md";
import { useAuthStore } from "../services/stores/authStore";
import { useChatStore } from "../services/stores/chatStore";
import { useChatSocket } from "../services/hooks/useChat";
import { useAddFriend } from "../services/hooks/useUser";
import { newColors } from "../Themes/newColors";

/**
 * Random Chat Page
 * 1:1 random pairing with strangers
 */
export default function RandomChatPage() {
  const user = useAuthStore((state) => state.user);
  const {
    socket,
    isConnected,
    joinRandomPairing,
    endRandomPairing,
    sendMessage,
    checkRandomSession,
    partnerDisconnected,
    reconnectGracePeriod,
  } = useChatStore();

  // Initialize chat socket
  useChatSocket();
  
  // Add friend mutation
  const addFriendMutation = useAddFriend();

  const [status, setStatus] = useState("idle"); // idle, searching, paired, ended, reconnecting
  const [partner, setPartner] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!isConnected || !socket) {
        setCheckingSession(false);
        return;
      }
      
      try {
        const result = await checkRandomSession();
        
        if (result.reconnected && result.conversation) {
          setConversation(result.conversation);
          setStatus("paired");
          
          // Find the partner
          const otherParticipant = result.conversation.participants?.find(
            (p) => p.user?._id !== user?._id
          );
          setPartner(otherParticipant?.user || { name: "Stranger" });
          
          // Show reconnection message
          setMessages([{
            _id: `reconnected-${Date.now()}`,
            type: "system",
            content: "Reconnected to chat",
            createdAt: new Date(),
          }]);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [isConnected, socket]);

  // Listen for random pairing events
  useEffect(() => {
    if (!socket) return;

    const handlePaired = ({ conversation: conv }) => {
      setConversation(conv);
      setStatus("paired");
      setFriendRequestSent(false);
      // Find the partner (the other participant)
      const otherParticipant = conv.participants?.find(
        (p) => p.user?._id !== user?._id
      );
      setPartner(otherParticipant?.user || { name: "Stranger" });
    };

    const handleEnded = ({ conversationId, reason }) => {
      if (conversation?._id === conversationId) {
        setStatus("ended");
        const endMessage = reason === "disconnect_timeout" 
          ? "Partner disconnected (timeout)"
          : "Your partner has left the chat";
        setMessages((prev) => [
          ...prev,
          {
            _id: `ended-${Date.now()}`,
            type: "system",
            content: endMessage,
            createdAt: new Date(),
          },
        ]);
      }
    };

    const handleMessage = ({ message, conversationId }) => {
      if (conversation?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };
    
    const handlePartnerDisconnected = ({ conversationId, gracePeriod }) => {
      if (conversation?._id === conversationId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `disconnected-${Date.now()}`,
            type: "system",
            content: `Partner disconnected. Waiting ${gracePeriod}s for reconnection...`,
            createdAt: new Date(),
          },
        ]);
      }
    };
    
    const handlePartnerReconnected = ({ conversationId }) => {
      if (conversation?._id === conversationId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `reconnected-${Date.now()}`,
            type: "system",
            content: "Partner reconnected!",
            createdAt: new Date(),
          },
        ]);
      }
    };

    socket.on("random:paired", handlePaired);
    socket.on("random:ended", handleEnded);
    socket.on("message:receive", handleMessage);
    socket.on("random:partner-disconnected", handlePartnerDisconnected);
    socket.on("random:partner-reconnected", handlePartnerReconnected);

    return () => {
      socket.off("random:paired", handlePaired);
      socket.off("random:ended", handleEnded);
      socket.off("message:receive", handleMessage);
      socket.off("random:partner-disconnected", handlePartnerDisconnected);
      socket.off("random:partner-reconnected", handlePartnerReconnected);
    };
  }, [socket, conversation, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFindPartner = async () => {
    setStatus("searching");
    setMessages([]);
    setPartner(null);
    setConversation(null);

    try {
      const result = await joinRandomPairing();
      setConversation(result.conversation);

      if (result.status === "paired") {
        setStatus("paired");
        const otherParticipant = result.conversation.participants?.find(
          (p) => p.user?._id !== user?._id
        );
        setPartner(otherParticipant?.user || { name: "Stranger" });
      } else {
        // Waiting for partner
        setMessages([
          {
            _id: "waiting",
            type: "system",
            content: "Waiting for someone to join...",
            createdAt: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error joining random chat:", error);
      setStatus("idle");
    }
  };

  const handleEndChat = async () => {
    if (conversation) {
      try {
        await endRandomPairing(conversation._id);
      } catch (error) {
        console.error("Error ending chat:", error);
      }
    }
    setStatus("idle");
    setMessages([]);
    setPartner(null);
    setConversation(null);
  };

  const handleNewChat = () => {
    setStatus("idle");
    setMessages([]);
    setPartner(null);
    setConversation(null);
    setFriendRequestSent(false);
  };
  
  const handleAddFriend = async () => {
    if (!partner?._id || friendRequestSent) return;
    
    try {
      await addFriendMutation.mutateAsync(partner._id);
      setFriendRequestSent(true);
      setMessages((prev) => [
        ...prev,
        {
          _id: `friend-request-${Date.now()}`,
          type: "system",
          content: "Friend request sent!",
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !conversation || sending) return;

    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    try {
      await sendMessage(conversation._id, content);
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputValue(content);
    } finally {
      setSending(false);
    }
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

  // Loading state - checking for existing session
  if (checkingSession) {
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
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={40} sx={{ color: newColors.primary, mb: 2 }} />
          <Typography sx={{ color: "#888" }}>
            Checking for existing session...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Idle state - Show find partner button
  if (status === "idle") {
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
            <MdShuffle size={40} color={newColors.primary} />
          </Box>
          <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
            Random Chat
          </Typography>
          <Typography sx={{ color: "#888", mb: 3, lineHeight: 1.6 }}>
            Get paired with a random person for a 1:1 chat. Your identity stays
            anonymous until you choose to reveal it.
          </Typography>
          <Button
            variant="contained"
            onClick={handleFindPartner}
            disabled={!isConnected || !user}
            sx={{
              bgcolor: newColors.primary,
              color: "#1c1c1c",
              px: 4,
              py: 1.5,
              fontWeight: 600,
              "&:hover": { bgcolor: "#b899f0" },
            }}
          >
            Find a Partner
          </Button>
          {!user && (
            <Typography sx={{ color: "#ff6b6b", mt: 2, fontSize: 14 }}>
              Please log in to use random chat
            </Typography>
          )}
          {!isConnected && user && (
            <Typography sx={{ color: "#ff6b6b", mt: 2, fontSize: 14 }}>
              Connecting to chat server...
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Searching state
  if (status === "searching" && !partner) {
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
          <CircularProgress
            size={60}
            sx={{ color: newColors.primary, mb: 3 }}
          />
          <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
            Looking for a partner...
          </Typography>
          <Typography sx={{ color: "#888", mb: 3 }}>
            Please wait while we find someone to chat with
          </Typography>
          <Button
            variant="outlined"
            onClick={handleEndChat}
            sx={{
              color: "#ff6b6b",
              borderColor: "#ff6b6b",
              "&:hover": {
                borderColor: "#ff6b6b",
                bgcolor: "rgba(255, 107, 107, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }

  // Paired or ended state - Show chat
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
          flexDirection: "column",
          borderBottom: "1px solid #333",
          bgcolor: newColors.secondary,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={partner?.photo}
              sx={{
                bgcolor: newColors.primary,
                width: 40,
                height: 40,
              }}
            >
              {partner?.name?.[0]?.toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 500 }}>
                {partner?.name || "Stranger"}
              </Typography>
              <Chip
                label={
                  status === "ended" 
                    ? "Disconnected" 
                    : partnerDisconnected 
                      ? `Reconnecting (${reconnectGracePeriod}s)` 
                      : "Connected"
                }
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  bgcolor:
                    status === "ended"
                      ? "rgba(255, 107, 107, 0.2)"
                      : partnerDisconnected
                        ? "rgba(255, 193, 7, 0.2)"
                        : "rgba(81, 207, 102, 0.2)",
                  color: 
                    status === "ended" 
                      ? "#ff6b6b" 
                      : partnerDisconnected 
                        ? "#ffc107" 
                        : "#51cf66",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Add Friend Button */}
            {partner?._id && status !== "ended" && (
              <Button
                startIcon={<MdPersonAdd />}
                onClick={handleAddFriend}
                disabled={friendRequestSent || addFriendMutation.isPending}
                sx={{ 
                  color: friendRequestSent ? "#51cf66" : newColors.primary,
                  minWidth: "auto",
                }}
              >
                {friendRequestSent ? "Sent" : "Add Friend"}
              </Button>
            )}
            
            {status === "ended" ? (
              <Button
                startIcon={<MdRefresh />}
                onClick={handleNewChat}
                sx={{ color: newColors.primary }}
              >
                New Chat
              </Button>
            ) : (
              <Button
                startIcon={<MdClose />}
                onClick={handleEndChat}
                sx={{ color: "#ff6b6b" }}
              >
                End Chat
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Reconnection progress bar */}
        {partnerDisconnected && (
          <LinearProgress
            variant="determinate"
            value={(reconnectGracePeriod / 30) * 100}
            sx={{
              height: 3,
              bgcolor: "rgba(255, 193, 7, 0.1)",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#ffc107",
              },
            }}
          />
        )}
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {/* Connected message */}
        {status === "paired" && messages.length === 0 && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography
              sx={{
                color: "#51cf66",
                fontSize: 13,
                bgcolor: "rgba(81, 207, 102, 0.1)",
                display: "inline-block",
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
            >
              You are now connected with {partner?.name || "a stranger"}. Say
              hello!
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
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: newColors.primary,
                    fontSize: 14,
                  }}
                >
                  {partner?.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
              )}

              <Box sx={{ maxWidth: "70%" }}>
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
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #333",
          bgcolor: newColors.secondary,
        }}
      >
        {status === "ended" ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ color: "#888", mb: 2 }}>
              This chat has ended
            </Typography>
            <Button
              variant="contained"
              startIcon={<MdShuffle />}
              onClick={handleFindPartner}
              sx={{ bgcolor: newColors.primary, color: "#1c1c1c" }}
            >
              Find New Partner
            </Button>
          </Box>
        ) : (
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
                        bgcolor: inputValue.trim() ? "#b899f0" : "transparent",
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
        )}
      </Box>
    </Box>
  );
}
