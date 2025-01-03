import React, { useState } from "react";
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Grid,
} from "@mui/material";

import { MdFavorite, MdOutlineFavorite, MdQueue } from "react-icons/md";
import EnhancedMusicPlayer from "../components/music/CompactMusicPlayer";

const Music = () => {
  const [currentSong, setCurrentSong] = useState({
    title: "SoundHelix Song 1",
    artist: "Artist 1",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    albumArt: "https://via.placeholder.com/150",
  });

  const [favorites, setFavorites] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const songs = [
    {
      title: "SoundHelix Song 1",
      artist: "Artist 1",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      albumArt: "https://via.placeholder.com/150",
    },
    {
      title: "SoundHelix Song 2",
      artist: "Artist 2",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      albumArt: "https://via.placeholder.com/150",
    },
    {
      title: "SoundHelix Song 3",
      artist: "Artist 3",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      albumArt: "https://via.placeholder.com/150",
    },
  ];

  const handleSongSelection = (index) => {
    setCurrentSong(songs[index]);
    setCurrentSongIndex(index);
  };

  const handleNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setCurrentSongIndex(nextIndex);
  };

  const handlePreviousSong = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setCurrentSongIndex(prevIndex);
  };

  const handleFavoriteToggle = (song) => {
    const isFavorite = favorites.includes(song);
    if (isFavorite) {
      setFavorites(favorites.filter((fav) => fav !== song));
    } else {
      setFavorites([...favorites, song]);
    }
  };

  const handleAddToQueue = (song) => {
    setQueue((prevQueue) => [...prevQueue, song]);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <EnhancedMusicPlayer
            song={currentSong}
            onNext={handleNextSong}
            onPrevious={handlePreviousSong}
            onAddToQueue={handleAddToQueue}
            onFavoriteToggle={handleFavoriteToggle}
            isFavorite={favorites.includes(currentSong)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Song List
          </Typography>
          <List>
            {songs.map((song, index) => (
              <React.Fragment key={index}>
                <ListItem
                  button
                  onClick={() => handleSongSelection(index)}
                  sx={{ display: "flex", gap: 2, alignItems: "center" }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={song.albumArt}
                      alt={song.title}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={song.title} secondary={song.artist} />
                  <IconButton
                    onClick={() => handleFavoriteToggle(song)}
                    color="error"
                  >
                    {favorites.includes(song) ? (
                      <MdFavorite />
                    ) : (
                      <MdOutlineFavorite />
                    )}
                  </IconButton>
                  <IconButton
                    onClick={() => handleAddToQueue(song)}
                    color="primary"
                  >
                    <MdQueue />
                  </IconButton>
                </ListItem>
                {index < songs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Music;
