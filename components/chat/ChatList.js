import { Box, List } from "@mui/material";
import ChatStyle from "./ChatStyle";

const ChatList = (props) => {
  return (
    <Box
      ref={props.chatContainerRef}
      className="chat-container"
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        padding: 2,
        backgroundColor: "#4b4b4b",
      }}
    >
      <List sx={{ padding: 0 }}>
        {props.messages.map((msg, index) => (
          <ChatStyle
            key={index}
            sender={msg.sender}
            text={msg.text}
            user={props.user}
            name={props.name}
            timestamp={msg.timestamp}
          ></ChatStyle>
        ))}
        <div ref={props.messagesEndRef} />
      </List>
    </Box>
  );
};

export default ChatList;
