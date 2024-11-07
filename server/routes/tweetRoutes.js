const express = require("express");
const router = express.Router();

const { getAllTweets, createTweet } = require("../controllers/tweetController");

router.get("/", getAllTweets);
router.post("/", createTweet);

module.exports = router;
