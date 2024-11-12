// controllers/chatController.js
const ChatMessage = require("../models/ChatMessage");

const getChatMessages = async (req, res) => {
  try {
    const { globalId } = req.params;
    const { skip = 0, limit = 50 } = req.query;

    const chatMessages = await ChatMessage.find({ globalId })
      .sort({ time: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.status(200).json(chatMessages);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching messages." });
  }
};

module.exports = { getChatMessages };
