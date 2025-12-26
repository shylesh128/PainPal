const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  userByToken,
  unlockAccount,
} = require("../controllers/loginController");

const {
  googleOauth,
  googleOauthCallback,
} = require("../controllers/googleController");

const {
  githubOauth,
  githubOauthCallback,
} = require("../controllers/githubController");

const authMiddleware = require("../middlewares/authmiddleware");

// Authentication routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);

// Token verification
router.post("/isLoggedIn", userByToken);

// Admin routes (should be protected in production)
router.post("/unlock/:userId", unlockAccount);

// Google OAuth routes
router.get("/google", googleOauth);
router.get("/google/callback", googleOauthCallback);

// GitHub OAuth routes
router.get("/github", githubOauth);
router.get("/github/callback", githubOauthCallback);

module.exports = router;
