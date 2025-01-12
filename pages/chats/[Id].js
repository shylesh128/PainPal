import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import io from "socket.io-client";
import { UserContext } from "../../services/userContext";
import { MdArrowBack } from "react-icons/md";
import { newColors } from "../../Themes/newColors";

let socket;

function ChatList(props) {
  return (
    <List sx={{ padding: 0 }}>
      {props.messages.map((msg, index) => (
        <ListItem
          key={index}
          sx={{
            display: "flex",
            justifyContent:
              msg.sender._id === props.user._id ? "flex-end" : "flex-start",
            padding: "4px",
            // marginBottom: "8px",
          }}
        >
          <Box
            sx={{
              backgroundColor:
                msg.sender._id === props.user._id
                  ? newColors.secondary
                  : newColors.secondary,
              color: newColors.text,
              borderRadius:
                msg.sender._id === props.user._id
                  ? "16px 4px 16px 16px"
                  : "4px 16px 16px 16px",
              padding: "12px 16px",
              maxWidth: "60%",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              textAlign: msg.sender._id === props.user._id ? "right" : "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              position: "relative",
            }}
          >
            <Typography variant="body1" sx={{ marginBottom: "4px" }}>
              {msg.text}
            </Typography>
            <Typography variant="caption" sx={{ color: "#b0b0b0" }}>
              {msg.sender._id === props.user._id ? "You" : props.name}
            </Typography>
          </Box>
        </ListItem>
      ))}
      <div ref={props.messagesEndRef} />
    </List>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { Id } = router.query;
  const { user, token, getConversationWithFriend } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friend, setFriend] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL, {
      query: { token },
    });

    const fetchConversation = async () => {
      if (user && Id) {
        try {
          const response = await getConversationWithFriend(user._id, Id);
          setMessages(response.messages);
          setFriend(response.friend);
          setConversationId(response.conversationId);
        } catch (error) {
          console.error("Error fetching conversation:", error);
        }
      }
    };

    if (Id) fetchConversation();

    return () => {
      socket.disconnect();
    };
  }, [Id, user, token]);

  useEffect(() => {
    if (conversationId && !isRoomJoined) {
      socket.emit("joinRoom", conversationId);
      setIsRoomJoined(true);
    }

    socket.on("message", (message) => {
      const isSender = message.sender === user._id;
      const structured = {
        _id: message._id,
        receiver: friend,
        sender: {
          name: isSender ? user.name : friend.name,
          avatarUrl: isSender ? user.photo : friend.photo,
          _id: isSender ? user._id : friend._id,
        },
        text: message.text,
        timestamp: message.timestamp,
      };

      console.log("Received message:", structured);

      setMessages((prevMessages) => [...prevMessages, structured]);
    });

    return () => {
      socket.off("message");
    };
  }, [conversationId, isRoomJoined, friend, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        sender: user._id,
        receiver: Id,
        text: newMessage,
      };
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    }
  };

  return (
    <Box sx={{ height: "90vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          borderBottom: "1px solid #ccc",
        }}
      >
        <IconButton onClick={() => router.back()}>
          <MdArrowBack />
        </IconButton>
        <Avatar
          alt={friend.name}
          src={friend.avatarUrl || "/default-avatar.png"}
        />
        <Typography variant="h6" sx={{ marginLeft: 2 }}>
          {friend.name}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", padding: 2 }}>
        <ChatList
          user={user}
          messages={messages}
          name={friend.name}
          messagesEndRef={messagesEndRef}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          borderTop: "1px solid #ccc",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          sx={{
            color: "#ffffff",
            "&:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 100px #307ECC inset",
              WebkitTextFillColor: "ffffff",
            },
          }}
        />
        <Button
          onClick={sendMessage}
          variant="contained"
          sx={{ marginLeft: 1 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
