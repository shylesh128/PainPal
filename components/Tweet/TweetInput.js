import React, { useState } from "react";
import {
  TextField,
  Box,
  Button,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import { MdCamera } from "react-icons/md";
import { newColors } from "../../Themes/newColors";

export const TweetInput = ({ addNewTweet }) => {
  const [newPost, setNewPost] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages((prevImages) => [...prevImages, ...files]);
  };

  const handleSubmit = () => {
    addNewTweet(newPost, selectedImages);
    setNewPost("");
    setSelectedImages([]);
    setIsModalOpen(false);
  };

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setNewPost("");
    setSelectedImages([]);
    setIsModalOpen(false);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Button variant="contained" color="primary" onClick={handleModalOpen}>
        Create Tweet
      </Button>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: newColors.background,
            p: 3,
            borderRadius: 2,
            width: "90%",
            maxWidth: 500,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            What's happening?
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your tweet here..."
            variant="outlined"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{
              marginBottom: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#555" },
                "&:hover fieldset": { borderColor: "#555" },
              },
            }}
          />

          <input
            accept="image/*"
            style={{ display: "none" }}
            id="icon-button-file"
            type="file"
            onChange={handleImageUpload}
            multiple
          />
          <label htmlFor="icon-button-file">
            <IconButton color="primary" component="span">
              <MdCamera />
            </IconButton>
          </label>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            {selectedImages.map((image, index) => (
              <Box key={index} sx={{ position: "relative" }}>
                <img
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
                <Button
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    color: "white",
                    background: "rgba(0, 0, 0, 0.5)",
                  }}
                  onClick={() => handleRemoveImage(index)}
                >
                  x
                </Button>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button variant="text" color="secondary" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Tweet
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
