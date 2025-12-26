import { useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  MdClose,
  MdEdit,
  MdPersonAdd,
  MdPersonRemove,
  MdExitToApp,
} from "react-icons/md";
import { useAuthStore } from "../../services/stores/authStore";
import api from "../../services/api/axios";
import { newColors } from "../../Themes/newColors";

/**
 * Group Settings Component
 * Manage group name, participants, and admins
 */
const GroupSettings = ({ open, onClose, conversation, onUpdate }) => {
  const user = useAuthStore((state) => state.user);

  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || "");
  const [loading, setLoading] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);

  const isAdmin = conversation?.admins?.some(
    (admin) => admin._id === user?._id || admin === user?._id
  );

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === conversation?.name) {
      setEditingName(false);
      return;
    }

    setLoading(true);
    try {
      await api.put(`/chat/groups/${conversation._id}`, { name: groupName.trim() });
      onUpdate?.({ ...conversation, name: groupName.trim() });
      setEditingName(false);
    } catch (error) {
      console.error("Error updating group name:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm("Remove this member from the group?")) return;

    setLoading(true);
    try {
      await api.delete(`/chat/groups/${conversation._id}/participants/${participantId}`);
      onUpdate?.({
        ...conversation,
        participants: conversation.participants.filter(
          (p) => p.user._id !== participantId
        ),
      });
    } catch (error) {
      console.error("Error removing participant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    setLoading(true);
    try {
      await api.post(`/chat/conversations/${conversation._id}/leave`);
      onClose();
      // Redirect will be handled by parent
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!conversation) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: newColors.secondary,
          color: "#fff",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #333",
        }}
      >
        <Typography variant="h6">Group Settings</Typography>
        <IconButton onClick={onClose} sx={{ color: "#888" }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Group Name Section */}
        <Box sx={{ p: 3, borderBottom: "1px solid #333" }}>
          <Typography sx={{ color: "#888", fontSize: 12, mb: 1 }}>
            GROUP NAME
          </Typography>

          {editingName ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                size="small"
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#333",
                    color: "#fff",
                    "& fieldset": { borderColor: "#444" },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleUpdateName}
                disabled={loading}
                sx={{ bgcolor: newColors.primary }}
              >
                Save
              </Button>
              <Button onClick={() => setEditingName(false)}>Cancel</Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h5">{conversation.name}</Typography>
              {isAdmin && (
                <IconButton
                  onClick={() => setEditingName(true)}
                  sx={{ color: newColors.primary }}
                >
                  <MdEdit size={20} />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        {/* Participants Section */}
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography sx={{ color: "#888", fontSize: 12 }}>
              MEMBERS ({conversation.participants?.length || 0})
            </Typography>
            {isAdmin && (
              <Button
                startIcon={<MdPersonAdd />}
                size="small"
                onClick={() => setAddParticipantOpen(true)}
                sx={{ color: newColors.primary }}
              >
                Add
              </Button>
            )}
          </Box>

          <List sx={{ p: 0 }}>
            {conversation.participants?.map((participant) => {
              const p = participant.user;
              const isParticipantAdmin = conversation.admins?.some(
                (a) => a._id === p._id || a === p._id
              );
              const isCurrentUser = p._id === user?._id;

              return (
                <ListItem
                  key={p._id}
                  sx={{
                    px: 0,
                    borderRadius: 1,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={p.photo} sx={{ bgcolor: newColors.primary }}>
                      {p.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ color: "#fff" }}>
                          {p.name}
                          {isCurrentUser && " (You)"}
                        </Typography>
                        {isParticipantAdmin && (
                          <Chip
                            label="Admin"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              bgcolor: "rgba(167, 133, 235, 0.2)",
                              color: newColors.primary,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography sx={{ color: "#666", fontSize: 12 }}>
                        @{p.username || p.email}
                      </Typography>
                    }
                  />

                  {isAdmin && !isCurrentUser && (
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() => handleRemoveParticipant(p._id)}
                        sx={{ color: "#ff6b6b" }}
                        size="small"
                      >
                        <MdPersonRemove size={18} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ borderColor: "#333" }} />

        {/* Leave Group */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            startIcon={<MdExitToApp />}
            onClick={handleLeaveGroup}
            disabled={loading}
            sx={{
              color: "#ff6b6b",
              justifyContent: "flex-start",
              "&:hover": { bgcolor: "rgba(255, 107, 107, 0.1)" },
            }}
          >
            Leave Group
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettings;
