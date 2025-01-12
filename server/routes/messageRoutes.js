const express = require("express");
const router = express.Router();

const { getConversation } = require("../controllers/messageController");

router.get("/:userId/:friendId", getConversation);
module.exports = router;
