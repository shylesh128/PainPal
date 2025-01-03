const express = require("express");
const router = express.Router();
const ytdl = require("ytdl-core");
const fs = require("fs");
// router.get("/", getAllMusicController);

router.get("/download", function (req, res, next) {
  console.log("rputer calld");
  let url = "https://youtu.be/nD_NDngrEl8";
  ytdl(url).pipe(fs.createWriteStream("video.mp4"));
  res.end();
});

module.exports = router;
