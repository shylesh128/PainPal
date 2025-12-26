import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuthStore } from "../../services/stores/authStore";
import { useChatStore } from "../../services/stores/chatStore";
import { newColors } from "../../Themes/newColors";
import ChatWindow from "../../components/chat/ChatWindow";
import GroupSettings from "../../components/chat/GroupSettings";
import MessageSearch from "../../components/chat/MessageSearch";
import api from "../../services/api/axios";

/**
 * Direct Chat Page
 * Opens a direct conversation with a specific user by their ID
 */
export default function DirectChatPage() {
  const router = useRouter();
  const { Id } = router.query;
  const user = useAuthStore((state) => state.user);
  const {
    activeConversation,
    setActiveConversation,
    joinConversation,
    fetchMessages,
    isConnected,
  } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Create or get direct conversation with the user
  // Waits for socket to be connected before joining
  useEffect(() => {
    const initConversation = async () => {
      if (!Id || !user) return;

      setLoading(true);
      setError(null);

      try {
        // Create or get direct conversation
        const response = await api.post("/chat/conversations", {
          type: "direct",
          participantId: Id,
        });

        const conversation = response.data.data.conversation;
        setActiveConversation(conversation);
        // joinConversation now uses waitForSocket internally
        await joinConversation(conversation._id);
        await fetchMessages(conversation._id);
      } catch (err) {
        // Handle socket timeout gracefully
        if (err.message === "Socket connection timeout") {
          setError("Connection timeout. Please refresh the page.");
        } else {
          console.error("Error initializing conversation:", err);
          setError(err.response?.data?.message || "Failed to load conversation");
        }
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [Id, user, joinConversation, fetchMessages, setActiveConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, [setActiveConversation]);

  const handleBack = () => {
    router.back();
  };

  // Redirect if not logged in
  if (!user) {
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
        <Typography sx={{ color: "#888" }}>Please log in to chat</Typography>
      </Box>
    );
  }

  // Loading state
  if (loading) {
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
        <CircularProgress sx={{ color: newColors.primary }} />
      </Box>
    );
  }

  // Error state
  if (error) {
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
          <Typography sx={{ color: "#ff6b6b", mb: 2 }}>{error}</Typography>
          <Typography
            sx={{ color: newColors.primary, cursor: "pointer" }}
            onClick={handleBack}
          >
            Go back
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 64px)", bgcolor: newColors.background }}>
      <ChatWindow
        conversation={activeConversation}
        onBack={handleBack}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <GroupSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        conversation={activeConversation}
        onUpdate={(updated) => setActiveConversation(updated)}
      />

      <MessageSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        conversationId={activeConversation?._id}
      />
    </Box>
  );
}
