import React from "react";
import MessageBubble from "./MessageBubble";

const ChatSection = (props) => {
  return (
    <div id="chat-section">
      <ul id="messages" ref={props.messagesRef}>
        {props.messages.map((message, index) => (
          <li
            key={index}
            className={
              message.user === props.user.name
                ? "currentUserMessage"
                : "otherUserMessage"
            }
          >
            <div className="message-container">
              {message.user !== props.user.name && (
                <div className="message-wrapper">
                  <span className="username">{message.user}</span>
                </div>
              )}
              <MessageBubble
                sender={message.user === props.user.name}
                message={message.text}
                timestamp={message.time}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatSection;
