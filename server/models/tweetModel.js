const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tweet: {
    type: String,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
  email: {
    type: String,
    required: true,
  },
  files: {
    type: [String],
    default: [],
  },
});

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
