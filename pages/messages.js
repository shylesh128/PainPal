import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Chip, Avatar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useAuthStore } from "../services/stores/authStore";
import { useChatStore } from "../services/stores/chatStore";
import { useFriends } from "../services/hooks/useUser";
import api from "../services/api/axios";
import { newColors } from "../Themes/newColors";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import GroupSettings from "../components/chat/GroupSettings";
import MessageSearch from "../components/chat/MessageSearch";

/**
 * Messages Page
 * Unified chat page with conversation list and chat window
 */
export default function MessagesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    activeConversation,
    setActiveConversation,
    joinConversation,
    fetchMessages,
  } = useChatStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Dialog states
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Create group form
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use TanStack Query for friends
  const { data: friendsData } = useFriends(1, 100);
  const friends = friendsData?.data?.friends || [];

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Handle URL-based conversation selection
  useEffect(() => {
    const { conversationId } = router.query;
    if (conversationId && conversationId !== activeConversation?._id) {
      joinConversation(conversationId);
    }
  }, [router.query.conversationId]);

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    await joinConversation(conversation._id);
    await fetchMessages(conversation._id);

    // Update URL without navigation
    router.push(`/messages?conversationId=${conversation._id}`, undefined, {
      shallow: true,
    });
  };

  const handleBack = () => {
    setActiveConversation(null);
    router.push("/messages", undefined, { shallow: true });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setLoading(true);
    try {
      const response = await api.post("/chat/conversations", {
        type: "group",
        name: groupName.trim(),
        participantIds: selectedMembers.map((m) => m._id),
      });

      const conversation = response.data.data.conversation;
      setActiveConversation(conversation);
      setCreateGroupOpen(false);
      setGroupName("");
      setSelectedMembers([]);

      router.push(`/messages?conversationId=${conversation._id}`, undefined, {
        shallow: true,
      });
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Mobile view: show either list or chat
  if (isMobile) {
    return (
      <Box sx={{ height: "calc(100vh - 64px)", bgcolor: newColors.background }}>
        {!activeConversation ? (
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onCreateGroup={() => setCreateGroupOpen(true)}
          />
        ) : (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            onOpenSettings={() => setGroupSettingsOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}

        {/* Dialogs */}
        <CreateGroupDialog
          open={createGroupOpen}
          onClose={() => setCreateGroupOpen(false)}
          groupName={groupName}
          setGroupName={setGroupName}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          friends={friends}
          loading={loading}
          onCreate={handleCreateGroup}
        />

        <GroupSettings
          open={groupSettingsOpen}
          onClose={() => setGroupSettingsOpen(false)}
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

  // Desktop view: side by side
  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
        bgcolor: newColors.background,
      }}
    >
      {/* Conversation List */}
      <Box sx={{ width: 350, flexShrink: 0 }}>
        <ConversationList
          onSelectConversation={handleSelectConversation}
          onCreateGroup={() => setCreateGroupOpen(true)}
        />
      </Box>

      {/* Chat Window */}
      <Box sx={{ flex: 1 }}>
        <ChatWindow
          conversation={activeConversation}
          onOpenSettings={() => setGroupSettingsOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </Box>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        friends={friends}
        loading={loading}
        onCreate={handleCreateGroup}
      />

      <GroupSettings
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
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

// Create Group Dialog Component
function CreateGroupDialog({
  open,
  onClose,
  groupName,
  setGroupName,
  selectedMembers,
  setSelectedMembers,
  friends,
  loading,
  onCreate,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: newColors.secondary, color: "#fff" },
      }}
    >
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          sx={{
            mt: 2,
            mb: 3,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "#444" },
            },
            "& .MuiInputLabel-root": { color: "#888" },
          }}
        />

        <Autocomplete
          multiple
          options={friends}
          value={selectedMembers}
          onChange={(e, newValue) => setSelectedMembers(newValue)}
          getOptionLabel={(option) => option.name || option.email}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add Members"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "#444" },
                },
                "& .MuiInputLabel-root": { color: "#888" },
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option._id}
                avatar={<Avatar src={option.photo} />}
                label={option.name}
                sx={{
                  bgcolor: "rgba(167, 133, 235, 0.2)",
                  color: "#fff",
                }}
              />
            ))
          }
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              sx={{ display: "flex", gap: 1, color: "#fff", bgcolor: "#333" }}
            >
              <Avatar src={option.photo} sx={{ width: 32, height: 32 }} />
              <Box>
                <Typography>{option.name}</Typography>
                <Typography sx={{ fontSize: 12, color: "#888" }}>
                  @{option.username || option.email}
                </Typography>
              </Box>
            </Box>
          )}
          sx={{
            "& .MuiAutocomplete-popupIndicator": { color: "#888" },
            "& .MuiAutocomplete-clearIndicator": { color: "#888" },
          }}
          PaperComponent={({ children }) => (
            <Box sx={{ bgcolor: "#333", color: "#fff" }}>{children}</Box>
          )}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: "#888" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onCreate}
          disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
          sx={{ bgcolor: newColors.primary }}
        >
          {loading ? "Creating..." : "Create Group"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
