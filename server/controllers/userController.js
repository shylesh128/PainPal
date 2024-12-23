const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Tweet = require("../models/tweetModel");
const DeviceLog = require("../models/deviceModel");
const appError = require("../utils/appError");
const { unlinkFiles } = require("../middlewares/filemiddleware");
const { uploadToCloudinary } = require("../utils/imageService");

const deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required.",
    });
  }

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: "success",
    message: "User deleted successfully.",
  });
});

const getUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const queryString = req.query.query;

  let query = {};
  if (queryString) {
    const regexQuery = { $regex: new RegExp(queryString, "i") };
    query = {
      $or: [{ name: regexQuery }, { email: regexQuery }],
    };
  }

  const users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    status: "success",
    data: {
      users,
      count: users.length,
    },
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const { name, email } = req.body;

  if (!userId || !name || !email) {
    return res.status(400).json({
      status: "fail",
      message: "User ID, name, and email are required fields.",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      status: "fail",
      message: "User not found.",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

const addUser = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      status: "fail",
      message: "Name and email are required fields.",
    });
  }

  try {
    const newUser = await User.create({ name, email });
    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (e) {
    next(new appError(e.message, 401));
  }
});

const addUsers = catchAsync(async (req, res, next) => {
  const usersData = req.body;

  // Validate if usersData is an array
  if (!Array.isArray(usersData)) {
    return res.status(400).json({
      status: "fail",
      message: "An array of users is required.",
    });
  }

  // Validate each user in the array
  const invalidUsers = usersData.filter((user) => !user.name || !user.email);

  if (invalidUsers.length > 0) {
    return res.status(400).json({
      status: "fail",
      message: "Name and email are required fields for all users.",
    });
  }

  // Set a default role if none is provided
  const usersWithRole = usersData.map((user) => ({
    ...user,
  }));

  // Create many users

  try {
    const newUsers = await User.insertMany(usersWithRole);

    res.status(201).json({
      status: "success",
      data: {
        users: newUsers,
      },
    });
  } catch (e) {
    next(new appError(e.message, 401));
  }
});

const deleteAllUsers = catchAsync(async (req, res, next) => {
  // Delete all users
  await User.deleteMany();

  res.status(200).json({
    status: "success",
    message: "All users deleted successfully.",
  });
});

const userDetails = catchAsync(async (req, res, next) => {
  const user = req.user;

  const userDetails = await User.findById(user._id);

  const tweets = await Tweet.find({ userId: user._id })
    .populate("likes", "username")
    .populate("comments.userId", "username")
    .sort("-timeStamp");

  const likedTweets = await Tweet.find({ likes: user._id })
    .populate("userId", "username")
    .sort("-timeStamp");

  const userComments = await Tweet.aggregate([
    { $unwind: "$comments" },
    { $match: { "comments.userId": user._id } },
    {
      $lookup: {
        from: "users",
        localField: "comments.userId",
        foreignField: "_id",
        as: "commentUser",
      },
    },
    { $unwind: "$commentUser" },
    {
      $project: {
        tweetId: "$_id",
        tweet: "$tweet",
        comment: "$comments.comment",
        timeStamp: "$comments.timeStamp",
        user: "$commentUser.username",
      },
    },
  ]);

  const loginActivity = await DeviceLog.find({ user: user._id })
    .select("device ip loginAt")
    .sort("-loginAt");

  res.status(200).json({
    status: "success",
    data: {
      userDetails,
      tweets,
      likedTweets,
      userComments,
      loginActivity,
    },
  });
});

const updateProfilePicController = catchAsync(async (req, res, next) => {
  const user = req.user;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      status: "fail",
      data: {},
      message: "Profile picture is required.",
    });
  }

  let updatedPhotoUrl;

  const filesToSend = [files[0]];
  updatedPhotoUrl = await uploadToCloudinary(filesToSend);

  const updatedUser = await User.findByIdAndUpdate(user._id, {
    photo: updatedPhotoUrl?.toString(),
  });

  if (!updatedUser) {
    return res.status(404).json({ status: "" });
  }

  unlinkFiles(files);

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

module.exports = {
  addUser,
  deleteUser,
  getUsers,
  updateUser,
  addUsers,
  deleteAllUsers,
  userDetails,
  updateProfilePicController,
};
