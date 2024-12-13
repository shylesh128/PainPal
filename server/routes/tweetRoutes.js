const express = require("express");
const router = express.Router();

const {
  getAllTweets,
  createTweet,
  likeTweetController,
} = require("../controllers/tweetController");
const { fileMiddleware } = require("../middlewares/filemiddleware");
const authMiddleware = require("../middlewares/authmiddleware");

router.use(authMiddleware);

router.get("/", getAllTweets);
router.post("/", fileMiddleware, createTweet);

router.post("/:tweetId/like", likeTweetController);

module.exports = router;
