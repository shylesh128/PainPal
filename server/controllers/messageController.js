const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Message = require("../models/Message");

const getConversation = catchAsync(async (req, res, next) => {
  const { userId, friendId } = req.params;
  const { limit = 10, page = 1 } = req.query;

  try {
    const conversationId =
      userId < friendId ? `${userId}-${friendId}` : `${friendId}-${userId}`;

    const totalMessages = await Message.countDocuments({ conversationId });

    const totalPages = Math.ceil(totalMessages / limit);
    const hasNext = page < totalPages;

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("sender", "name photo")
      .populate("receiver", "name photo");

    const friend = await User.findById(friendId).select("name photo");

    res.status(200).json({
      messages,
      friend,
      conversationId,
      pagination: {
        currentPage: Number(page),
        totalPages,
        hasNext,
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Error fetching conversation" });
  }
});

module.exports = {
  getConversation,
};
