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

router.get("/feedback", getAllFeedback);
router.post("/feedback", createFeedback);

router.post("/python", pythoncodeComplier);
router.post("/c", cCodeCompiler);

router.post("/alttext/:apikey", generateAltText);
router.post("/aichat/:apikey", geminiAIChat);

module.exports = router;
