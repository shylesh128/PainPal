const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");

const authMiddleware = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    token = req.cookies["pain"];
  }

  if (!token) {
    return next(new AppError("Token not found", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const encryptedId = decoded.id || decoded.userId;

    let user = await User.findById(encryptedId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Invalid token", 401));
  }
});

module.exports = authMiddleware;
