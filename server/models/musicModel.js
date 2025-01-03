const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  authors: {
    type: [String],
    required: true,
  },
  album: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
  },
  releaseDate: {
    type: Date,
  },
  coverImage: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Music = mongoose.model("Music", musicSchema);
