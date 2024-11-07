const express = require("express");
const router = express.Router();

const {
  getAllFeedback,
  createFeedback,
} = require("../controllers/feedbackController");
const { pythoncodeComplier } = require("../controllers/pythonController");
const { cCodeCompiler } = require("../controllers/cProgController");
const {
  generateAltText,
  geminiAIChat,
} = require("../controllers/GeminiController");

router.get("/api/feedback", getAllFeedback);
router.post("/api/feedback", createFeedback);

router.post("/api/python", pythoncodeComplier);
router.post("/api/c", cCodeCompiler);

router.post("/api/alttext/:apikey", generateAltText);
router.post("/api/aichat/:apikey", geminiAIChat);

module.exports = router;
