import { getColorForUsername } from "../../utils/alphaToColors";
import { localizeTime } from "../../utils/localize";
import { Box, Typography } from "@mui/material";
import { newColors } from "../../Themes/newColors";

const PostHeader = ({ user, formattedTime }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: "bold",
        mr: 1,
        color: getColorForUsername(user?.name),
        opacity: 0.5,
        textTransform: "lowercase",
      }}
    >
      @{user?.name}
    </Typography>
    <Box sx={{ flexGrow: 1 }} />
    <Typography variant="caption" sx={{ color: newColors.primary }}>
      {localizeTime(formattedTime)}
    </Typography>
  </Box>
);

export default PostHeader;
