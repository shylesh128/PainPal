const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const appError = require("../utils/appError");
const useragent = require("useragent");

const jwt = require("jsonwebtoken");
const DeviceLog = require("../models/deviceModel");
const { getClientIp } = require("../utils/clientIp");

const secretKey = process.env.SECRET_KEY;

const login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = getClientIp(req);

  // Fetch user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "User not found.",
    });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, secretKey, {
    expiresIn: "9999999d",
  });

  // Log the login attempt and device details
  const deviceLog = new DeviceLog({
    user: user._id,
    device: {
      device: agent.device || "unknown",
      os: agent.os || "unknown",
      browser: agent.toAgent() || "unknown",
    },
    ip: ip || "unknown",
  });

  await deviceLog.save(); // Save the device log to the database

  // Send the response with the token

  res.cookie("pain", token);
  res.status(200).json({
    status: "success",
    message: "User logged in successfully.",
    token: token,
    user: user,
  });
});

const userByToken = catchAsync(async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "fail",
      message: "Authorization header is missing or invalid.",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    if (!token) {
      throw new Error("Token is missing.");
    }
    const decoded = jwt.verify(token, secretKey);

    const user = await User.findById(decoded.userId);

    res.status(200).json({
      status: "success",
      message: "User fetched successfully.",
      user: user,
    });
  } catch (error) {
    // Handle token verification errors
    res.status(401).json({
      status: "fail",
      message: "Token verification failed.",
    });
  }
});

module.exports = { login, userByToken };
