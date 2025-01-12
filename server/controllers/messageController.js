const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Message = require("../models/Message");

const getConversation = catchAsync(async (req, res, next) => {
  const { userId, friendId } = req.params;

  try {
    // Generate the conversationId
    const conversationId =
      userId < friendId ? `${userId}-${friendId}` : `${friendId}-${userId}`;

    // Fetch the messages for the conversation
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .populate("sender", "name photo")
      .populate("receiver", "name photo");

    // Fetch the friend details (excluding the current user)
    const friend = await User.findById(friendId).select("name photo");

    res.status(200).json({ messages, friend, conversationId });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Error fetching conversation" });
  }
});

module.exports = {
  getConversation,
};
