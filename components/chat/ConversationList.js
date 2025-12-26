import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Skeleton,
} from "@mui/material";
import { MdSearch, MdAdd, MdPeople, MdPerson, MdPublic } from "react-icons/md";
import { useChat } from "../../services/chatContext";
import { newColors } from "../../Themes/newColors";
import OnlineStatus from "./OnlineStatus";

const ConversationList = ({ onSelectConversation, onCreateGroup }) => {
  const {
    conversations,
    fetchConversations,
    activeConversation,
    isUserOnline,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      await fetchConversations(activeTab === "all" ? null : activeTab);
      setLoading(false);
    };
    loadConversations();
  }, [activeTab, fetchConversations]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    // Search by name
    if (conv.name?.toLowerCase().includes(searchLower)) return true;

    // Search by participant names (for direct chats)
    if (conv.type === "direct") {
      return conv.participants?.some((p) =>
        p.user?.name?.toLowerCase().includes(searchLower)
      );
    }

    return false;
  });

  const getConversationName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.type === "direct") {
      // Get the other participant's name
      const otherParticipant = conv.participants?.find(
        (p) => p.user?._id !== conv.createdBy
      );
      return otherParticipant?.user?.name || "Direct Chat";
    }
    return "Conversation";
  };

  const getConversationAvatar = (conv) => {
    if (conv.type === "direct") {
      const otherParticipant = conv.participants?.find(
        (p) => p.user?._id !== conv.createdBy
      );
      return otherParticipant?.user?.photo;
    }
    return null;
  };

  const getOtherUserId = (conv) => {
    if (conv.type === "direct") {
      const otherParticipant = conv.participants?.find(
        (p) => p.user?._id !== conv.createdBy
      );
      return otherParticipant?.user?._id;
    }
    return null;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Today
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // This week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    // Older
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "group":
        return <MdPeople size={14} />;
      case "global":
        return <MdPublic size={14} />;
      default:
        return <MdPerson size={14} />;
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: newColors.secondary,
        borderRight: "1px solid #333",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #333" }}>
        <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
          Messages
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#333",
              color: "#fff",
              "& fieldset": { borderColor: "#444" },
              "&:hover fieldset": { borderColor: "#555" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch color="#888" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: "1px solid #333",
          "& .MuiTab-root": { color: "#888", minHeight: 48 },
          "& .Mui-selected": { color: newColors.primary },
          "& .MuiTabs-indicator": { bgcolor: newColors.primary },
        }}
      >
        <Tab label="All" value="all" />
        <Tab label="Direct" value="direct" />
        <Tab label="Groups" value="group" />
      </Tabs>

      {/* Create Group Button */}
      <Box sx={{ p: 1, borderBottom: "1px solid #333" }}>
        <IconButton
          onClick={onCreateGroup}
          sx={{
            width: "100%",
            borderRadius: 2,
            color: newColors.primary,
            bgcolor: "rgba(167, 133, 235, 0.1)",
            "&:hover": { bgcolor: "rgba(167, 133, 235, 0.2)" },
          }}
        >
          <MdAdd size={20} />
          <Typography sx={{ ml: 1, fontSize: 14 }}>New Group</Typography>
        </IconButton>
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {loading ? (
          // Loading skeletons
          [...Array(5)].map((_, i) => (
            <ListItem key={i} sx={{ borderBottom: "1px solid #333" }}>
              <ListItemAvatar>
                <Skeleton variant="circular" width={48} height={48} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton width="60%" />}
                secondary={<Skeleton width="80%" />}
              />
            </ListItem>
          ))
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#666" }}>
              {searchTerm ? "No conversations found" : "No conversations yet"}
            </Typography>
          </Box>
        ) : (
          filteredConversations.map((conv) => {
            const otherUserId = getOtherUserId(conv);
            const isOnline = otherUserId ? isUserOnline(otherUserId) : false;

            return (
              <ListItem
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                sx={{
                  cursor: "pointer",
                  borderBottom: "1px solid #333",
                  bgcolor:
                    activeConversation?._id === conv._id
                      ? "rgba(167, 133, 235, 0.15)"
                      : "transparent",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      conv.type === "direct" && isOnline ? (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: "#51cf66",
                            border: "2px solid #1c1c1c",
                          }}
                        />
                      ) : null
                    }
                  >
                    <Avatar
                      src={getConversationAvatar(conv)}
                      sx={{
                        bgcolor: newColors.primary,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {getTypeIcon(conv.type)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#fff",
                          fontWeight: conv.unreadCount > 0 ? 600 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "70%",
                        }}
                      >
                        {getConversationName(conv)}
                      </Typography>
                      <Typography sx={{ color: "#666", fontSize: 12 }}>
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: conv.unreadCount > 0 ? "#ccc" : "#666",
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "80%",
                        }}
                      >
                        {conv.lastMessage?.content || "No messages yet"}
                      </Typography>
                      {conv.unreadCount > 0 && (
                        <Badge
                          badgeContent={conv.unreadCount}
                          color="primary"
                          sx={{
                            "& .MuiBadge-badge": {
                              bgcolor: newColors.primary,
                              color: "#fff",
                            },
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );
};

export default ConversationList;

