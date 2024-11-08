const express = require("express");
const router = express.Router();

const { login, userByToken } = require("../controllers/loginController");

router.post("/login", login);
router.post("/isLoggedIn", userByToken);

module.exports = router;
