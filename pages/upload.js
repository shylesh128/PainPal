import { useState } from "react";
import { TextField, Box, Typography, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { styles } from "../styles/login-style";

const SongUploadForm = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !artist) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("files", file);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("album", album);

    try {
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "0 auto", padding: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Upload Song
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Paper
        sx={{ padding: 2, marginBottom: 2, borderRadius: 2 }}
        elevation={2}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            placeholder="Song Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
              },
            }}
          />
          <TextField
            placeholder="Artist"
            fullWidth
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
              },
            }}
          />
          <TextField
            placeholder="Album (optional)"
            fullWidth
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
              },
            }}
          />
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            required
            style={{ marginBottom: 16 }}
          />
          <Box display="flex" justifyContent="center">
            <LoadingButton
              type="submit"
              variant="contained"
              color="primary"
              loading={loading}
            >
              Upload Song
            </LoadingButton>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default SongUploadForm;
