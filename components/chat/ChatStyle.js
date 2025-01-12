import { Box, ListItem, Typography } from "@mui/material";
import { newColors } from "../../Themes/newColors";
import { localizeTime } from "../../utils/localize";

const ChatStyle = (props) => {
  return (
    <ListItem
      sx={{
        display: "flex",
        justifyContent:
          props.sender._id === props.user._id ? "flex-end" : "flex-start",
        padding: "4px",
      }}
    >
      <Box
        sx={{
          backgroundColor:
            props.sender._id === props.user._id
              ? newColors.secondary
              : newColors.secondary,
          color: newColors.text,
          borderRadius:
            props.sender._id === props.user._id
              ? "16px 4px 16px 16px"
              : "4px 16px 16px 16px",
          padding: "12px 16px",
          maxWidth: "60%",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          textAlign: props.sender._id === props.user._id ? "right" : "left",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          position: "relative",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            marginBottom: "4px",
          }}
        >
          {props.text}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#b0b0b0",
          }}
        >
          {localizeTime(props.timestamp)}
        </Typography>
      </Box>
    </ListItem>
  );
};

export default ChatStyle;
