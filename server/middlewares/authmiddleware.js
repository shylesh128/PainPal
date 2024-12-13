const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");

const authMiddleware = catchAsync(async (req, res, next) => {
  const cookie = req.cookies["pain"];

  try {
    const decoded = jwt.verify(cookie, process.env.SECRET_KEY);

    const encryptedId = decoded.id || decoded.userId;

    let user = await User.findById(encryptedId);

    req.user = user;

    next();
  } catch (error) {
    return next(new AppError("Invalid token", 401));
  }
});

module.exports = authMiddleware;
