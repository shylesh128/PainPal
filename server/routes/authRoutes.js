const express = require("express");
const router = express.Router();

const { login, userByToken } = require("../controllers/loginController");
const {
  googleOauth,
  googleOauthCallback,
} = require("../controllers/googleController");

router.post("/login", login);
router.post("/isLoggedIn", userByToken);

router.get("/google", googleOauth);
router.get("/google/callback", googleOauthCallback);

module.exports = router;
