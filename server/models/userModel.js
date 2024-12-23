const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  globalId: {
    type: String,
    default: null,
  },
  isOAuth: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
