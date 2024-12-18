// middlewares/authenticateSocket.js
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/userModel");

const secretKey = process.env.SECRET_KEY;

// Replace with your actual secret key

const authenticateSocket = async (socket, next) => {
  try {
    // Parse cookies from the socket handshake headers
    const cookies = socket.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const userCookie = parsedCookies.pain;

    if (!userCookie) {
      return next(new Error("Authentication failed: Cookie not found."));
    }

    // Verify JWT and retrieve user
    const decoded = jwt.verify(userCookie, secretKey);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error("User not found."));
    }

    // Attach user data to the socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    return next(new Error("Connection error: Authentication failed."));
  }
};

module.exports = authenticateSocket;
