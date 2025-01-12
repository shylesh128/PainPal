import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/router";
import { Box } from "@mui/material";
import io from "socket.io-client";
import { UserContext } from "../../services/userContext";
import ChatList from "../../components/chat/ChatList";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";

let socket;

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
  const chatContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const chatContainerStyle = {
    flex: 1,
    overflowY: "auto",
    scrollBehavior: "smooth",
    transition: "all 0.3s ease-in-out",
    WebkitOverflowScrolling: "touch",
  };

  const messageContainerStyle = {
    transition: "all 0.3s ease-in-out",
    opacity: isFetching ? 0.7 : 1,
  };

  const fetchConversation = async (page = 1) => {
    if (user && Id && !isFetching && (hasNextPage || page === 1)) {
      setIsFetching(true);
      try {
        const response = await getConversationWithFriend(user._id, Id, {
          page,
        });

        const prevHeight = chatContainerRef.current?.scrollHeight || 0;

        setMessages((prevMessages) => {
          const newMessages = [...response.messages.reverse(), ...prevMessages];

          if (page !== 1) {
            requestAnimationFrame(() => {
              if (chatContainerRef.current) {
                const newHeight = chatContainerRef.current.scrollHeight;
                const scrollOffset = newHeight - prevHeight;

                chatContainerRef.current.style.scrollBehavior = "auto";
                chatContainerRef.current.scrollTop = scrollOffset;

                requestAnimationFrame(() => {
                  chatContainerRef.current.style.scrollBehavior = "smooth";
                });
              }
            });
          }

          return newMessages;
        });

        setFriend(response.friend);
        setConversationId(response.conversationId);
        setCurrentPage(page);
        setHasNextPage(response.pagination.hasNext);
        setTotalPages(response.pagination.totalPages);

        if (page === 1) {
          setInitialLoadComplete(true);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setTimeout(() => {
          setIsFetching(false);
        }, 300);
      }
    }
  };

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL, {
      query: { token },
    });

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

      setMessages((prevMessages) => [...prevMessages, structured]);
    });

    return () => {
      socket.off("message");
    };
  }, [conversationId, isRoomJoined, friend, user]);

  const handleScroll = (e) => {
    const scrollTop = Math.abs(e.target.scrollTop);
    if (scrollTop < 50 && !isFetching && hasNextPage) {
      const nextPage = currentPage + 1;
      fetchConversation(nextPage);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    let scrollTimeout;

    const throttledScroll = (e) => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll(e);
          scrollTimeout = null;
        }, 100);
      }
    };

    chatContainer.addEventListener("scroll", throttledScroll);

    return () => {
      chatContainer.removeEventListener("scroll", throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [currentPage, isFetching]);

  useEffect(() => {
    if (initialLoadComplete || messages.length === 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete && messages.length > 0) {
      const chatContainer = chatContainerRef.current;
      if (!chatContainer) return;

      const isNearBottom =
        chatContainer.scrollHeight -
          chatContainer.scrollTop -
          chatContainer.clientHeight <
        100;

      if (isNearBottom) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    }
  }, [messages, initialLoadComplete]);

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
      <ChatHeader back={router.back} friend={friend} />
      <Box ref={chatContainerRef} style={chatContainerStyle}>
        <Box style={messageContainerStyle}>
          <ChatList
            user={user}
            messages={messages}
            name={friend.name}
            messagesEndRef={messagesEndRef}
          />
        </Box>
      </Box>
      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
      />
    </Box>
  );
}
