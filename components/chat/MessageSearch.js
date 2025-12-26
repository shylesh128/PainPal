import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from "@mui/material";
import { MdSearch, MdClose, MdArrowForward } from "react-icons/md";
import { useChatStore } from "../../services/stores/chatStore";
import { newColors } from "../../Themes/newColors";

// Debounce helper
const useDebounce = (callback, delay) => {
  const [timeoutId, setTimeoutId] = useState(null);

  return useCallback(
    (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => callback(...args), delay);
      setTimeoutId(id);
    },
    [callback, delay, timeoutId]
  );
};

/**
 * Message Search Component
 * Search through messages in a conversation
 */
const MessageSearch = ({ open, onClose, conversationId, onSelectMessage }) => {
  const searchMessages = useChatStore((state) => state.searchMessages);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      try {
        const result = await searchMessages(conversationId, searchQuery);
        setResults(result.messages || []);
        setSearched(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, searchMessages]
  );

  const debouncedSearch = useDebounce(performSearch, 300);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSelectMessage = (message) => {
    onSelectMessage?.(message);
    onClose();
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: "rgba(167, 133, 235, 0.4)" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          minHeight: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #333",
          pb: 2,
        }}
      >
        <Typography variant="h6">Search Messages</Typography>
        <IconButton onClick={onClose} sx={{ color: "#888" }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: "1px solid #333" }}>
          <TextField
            fullWidth
            placeholder="Search messages..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#333",
                color: "#fff",
                "& fieldset": { borderColor: "#444" },
                "&:hover fieldset": { borderColor: "#555" },
                "&.Mui-focused fieldset": { borderColor: newColors.primary },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch color="#888" size={20} />
                </InputAdornment>
              ),
              endAdornment: loading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} sx={{ color: newColors.primary }} />
                </InputAdornment>
              ),
            }}
          />
          {query.length > 0 && query.length < 2 && (
            <Typography sx={{ color: "#888", fontSize: 12, mt: 1 }}>
              Enter at least 2 characters to search
            </Typography>
          )}
        </Box>

        {/* Results */}
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {!searched && !loading && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <MdSearch size={48} color="#444" />
              <Typography sx={{ color: "#666", mt: 2 }}>
                Search for messages in this conversation
              </Typography>
            </Box>
          )}

          {searched && results.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#666" }}>
                No messages found for "{query}"
              </Typography>
            </Box>
          )}

          {results.length > 0 && (
            <>
              <Typography sx={{ p: 2, color: "#888", fontSize: 12 }}>
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </Typography>
              <Divider sx={{ borderColor: "#333" }} />

              <List sx={{ p: 0 }}>
                {results.map((message) => (
                  <ListItem
                    key={message._id}
                    onClick={() => handleSelectMessage(message)}
                    sx={{
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            sx={{ color: newColors.primary, fontSize: 13 }}
                          >
                            {message.sender?.name}
                          </Typography>
                          <Typography sx={{ color: "#666", fontSize: 11 }}>
                            {formatDate(message.createdAt)} at{" "}
                            {formatTime(message.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          sx={{
                            color: "#ccc",
                            fontSize: 14,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {highlightMatch(message.content, query)}
                        </Typography>
                      }
                    />
                    <IconButton sx={{ color: "#666" }}>
                      <MdArrowForward size={18} />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MessageSearch;
