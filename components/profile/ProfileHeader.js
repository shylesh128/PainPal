import React, { useContext, useRef, useState } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { MdEdit } from "react-icons/md";
import { UserContext } from "../../services/userContext";
import { getColorForUsername } from "../../utils/alphaToColors";

function ReplaceProfilePIcModal(props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.handleCloseDialog}
      sx={{
        minWidth: 500,
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.2rem",
        }}
      >
        Edit Profile Picture
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Avatar
          src={props.imagePreview}
          sx={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: 2,
          }}
          onClick={props.handleAvatarClick}
        />
        <input
          ref={props.fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={props.handleImageChange}
        />
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "space-between",
          padding: "8px 24px",
        }}
      >
        <Button
          onClick={props.handleCloseDialog}
          color="secondary"
          sx={{
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={props.handleSaveImage}
          color="primary"
          sx={{
            fontWeight: 600,
            textTransform: "none",
          }}
          disabled={!props.selectedImage}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const ProfileHeader = (props) => {
  const { updateProfilePic } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(props.profilePic);
  const [selectedImage, setSelectedImage] = useState([]);
  const fileInputRef = useRef(null);

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setImagePreview(props.profilePic);
    setSelectedImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(e.target.files);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveImage = async () => {
    if (selectedImage.length > 0) {
      const response = await updateProfilePic(selectedImage);
      setImagePreview(response.data.user.photo);
    }
    setOpen(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click(); // Trigger file input on avatar click
  };

  return (
    <>
      {props.loading ? (
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            width: "100%",
          }}
        ></Paper>
      ) : (
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            width: "100%",
          }}
        >
          <Grid container spacing={3}>
            <Grid
              item
              xs={12}
              sm={4}
              sx={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={props.profilePic}
                  sx={{
                    width: 120,
                    height: 120,
                    marginBottom: "10px",
                  }}
                />
                <IconButton
                  onClick={handleOpenDialog}
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "#fff",
                    borderRadius: "50%",
                    padding: "5px",
                    cursor: "pointer",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
                    "&:hover": {
                      background: "#fff",
                    },
                  }}
                >
                  <MdEdit />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  color: getColorForUsername(props.user?.name),
                }}
              >
                @{props.user?.name}
              </Typography>

              <Box
                sx={{
                  marginTop: "15px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    flex: 1,
                    color: "#d0d0d0",
                  }}
                >
                  {props.user?.bio || "Click the edit icon to add your bio."}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <ReplaceProfilePIcModal
            open={open}
            imagePreview={imagePreview}
            selectedImage={selectedImage}
            fileInputRef={fileInputRef}
            handleCloseDialog={handleCloseDialog}
            handleImageChange={handleImageChange}
            handleSaveImage={handleSaveImage}
            handleAvatarClick={handleAvatarClick}
          ></ReplaceProfilePIcModal>
        </Paper>
      )}
    </>
  );
};

export default ProfileHeader;
