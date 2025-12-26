const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    Unique: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    Unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Text = mongoose.model("Text", userSchema);
module.exports = Text;
