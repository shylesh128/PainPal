import { useState, useEffect, useRef } from "react";
import {
  Card,
  Typography,
  Avatar,
  Box,
  IconButton,
  Slider,
} from "@mui/material";
import {
  MdPause,
  MdPlayArrow,
  MdSkipPrevious,
  MdSkipNext,
  MdFavorite,
  MdQueueMusic,
} from "react-icons/md";

const EnhancedMusicPlayer = ({
  song,
  onNext,
  onPrevious,
  onAddToQueue,
  onFavoriteToggle,
  isFavorite,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(song.url);
    audioRef.current.currentTime = currentTime;

    audioRef.current.addEventListener("loadedmetadata", () => {
      setDuration(audioRef.current.duration);
    });

    audioRef.current.addEventListener("timeupdate", () => {
      setCurrentTime(audioRef.current.currentTime);
    });

    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false);
    });

    if (isPlaying) {
      audioRef.current.play();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("loadedmetadata", () => {});
        audioRef.current.removeEventListener("timeupdate", () => {});
        audioRef.current.removeEventListener("ended", () => {});
        audioRef.current.pause();
      }
    };
  }, [song.url]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      setIsPlaying((prevState) => !prevState);
    }
  };

  const handleSkip = (direction) => {
    if (direction === "next" && onNext) {
      setCurrentTime(0);
      onNext();
    } else if (direction === "previous" && onPrevious) {
      setCurrentTime(0);
      onPrevious();
    }
  };

  const handleSliderChange = (e, newValue) => {
    if (audioRef.current) {
      const newTime = (newValue / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Card
      sx={{
        maxWidth: 500,
        padding: 2,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Header Section */}
      <Box textAlign="center">
        <Typography variant="h4" color="primary">
          {song.title}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {song.artist}
        </Typography>
      </Box>

      {/* Album Art */}
      <Avatar
        src={song.albumArt}
        alt="Album Art"
        variant="rounded"
        sx={{ width: 300, height: 300 }}
      />

      {/* Progress Slider */}
      <Box width="100%" mt={2}>
        <Slider
          value={(currentTime / duration) * 100 || 0}
          onChange={handleSliderChange}
          sx={{ width: "100%" }}
        />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption">{formatTime(currentTime)}</Typography>
          <Typography variant="caption">{formatTime(duration)}</Typography>
        </Box>
      </Box>

      {/* Controls Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        mt={2}
      >
        <IconButton onClick={() => onFavoriteToggle(song)} color="secondary">
          {isFavorite ? (
            <MdFavorite size="1.5rem" />
          ) : (
            <MdFavorite size="1.5rem" />
          )}
        </IconButton>
        <IconButton onClick={() => handleSkip("previous")} color="primary">
          <MdSkipPrevious size="2rem" />
        </IconButton>
        <IconButton onClick={handlePlayPause} color="primary">
          {isPlaying ? (
            <MdPause size="2.5rem" />
          ) : (
            <MdPlayArrow size="2.5rem" />
          )}
        </IconButton>
        <IconButton onClick={() => handleSkip("next")} color="primary">
          <MdSkipNext size="2rem" />
        </IconButton>
        <IconButton onClick={() => onAddToQueue(song)} color="secondary">
          <MdQueueMusic size="1.5rem" />
        </IconButton>
      </Box>
    </Card>
  );
};

export default EnhancedMusicPlayer;
