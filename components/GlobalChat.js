import { useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Box, TextField, Button, Typography } from "@mui/material";
import { UserContext } from "../services/userContext";
import ChatSection from "./ChatSection";
import MessageBubble from "./MessageBubble";

const GlobalChat = () => {
  const { user } = useContext(UserContext);
  const messagesRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const globalId = user.globalId;

        // Create socket connection
        const newSocket = io("/api/chat/global", {
          withCredentials: true,
          query: { globalId },
        });

        setSocket(newSocket);

        newSocket.on("previousMessages", (previousMessages) => {
          setMessages(previousMessages.reverse());
        });

        newSocket.on("message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        newSocket.on("userCount", (count) => {
          setActiveUsers(count);
        });

        // Handle errors
        newSocket.on("error", (error) => {
          alert(error.message);
        });

        return () => newSocket.disconnect();
      } catch (error) {
        console.error("Error connecting to chat:", error.message);
      }
    };

    connectSocket();
  }, [user]);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.emit("message", input);
      setInput("");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    console.log(messagesRef.current);
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Global Chat</Typography>
      <Typography variant="subtitle1">Active Users: {activeUsers}</Typography>

      <div id="chat-section">
        <ul id="messages" ref={messagesRef}>
          {messages.map((message, index) => (
            <li
              key={index}
              className={
                message.user === user.name
                  ? "currentUserMessage"
                  : "otherUserMessage"
              }
            >
              <div className="message-container">
                {message.user !== user.name && (
                  <div className="message-wrapper">
                    <span className="username">{message.user}</span>
                  </div>
                )}
                <MessageBubble
                  sender={message.user === user.name}
                  message={message.text}
                  timestamp={message.time}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <TextField
        label="Type a message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        fullWidth
        sx={{ mt: 2 }}
      />
      <Button onClick={sendMessage} variant="contained" sx={{ mt: 1 }}>
        Send
      </Button>
    </Box>
  );
};

export default GlobalChat;
