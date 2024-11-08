const express = require("express");
const router = express.Router();

const { getAllTweets, createTweet } = require("../controllers/tweetController");
const {
  fileMiddleware,
  imageResizeMiddleware,
} = require("../middlewares/filemiddleware");

router.get("/", getAllTweets);
router.post("/", fileMiddleware, createTweet);

module.exports = router;
