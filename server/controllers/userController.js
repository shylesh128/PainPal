const mongoose = require("mongoose");
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

const addFriendController = catchAsync(async (req, res, next) => {
  const user = req.user;
  const userId = user._id;
  const { friendId } = req.params;

  // Convert friendId to an ObjectId
  const friendObjectId = new mongoose.Types.ObjectId(friendId);

  // Ensure userId and friendId are not the same
  if (userId.equals(friendObjectId)) {
    return next(new appError("You can't add yourself as a friend.", 400));
  }

  // Check if the friend exists
  const friend = await User.findById(friendObjectId);
  if (!friend) {
    return next(new appError("Friend not found.", 404));
  }

  // Ensure the user isn't already friends
  const isAlreadyFriend = user.friends.some((friend) =>
    friend.friendId.equals(friendObjectId)
  );
  if (isAlreadyFriend) {
    return next(new appError("You are already friends.", 400));
  }

  // Add friend to both users' friends list with addedAt timestamp
  user.friends.push({
    friendId: friendObjectId,
    addedAt: new Date(),
  });

  friend.friends.push({
    friendId: userId,
    addedAt: new Date(),
  });

  // Save both users
  await user.save();
  await friend.save();

  res.status(200).json({
    status: "success",
    message: "Friend added successfully.",
  });
});

const removeFriendController = catchAsync(async (req, res, next) => {
  const user = req.user;
  const userId = user._id;
  const { friendId } = req.params;

  if (userId === friendId) {
    return next(new appError("You can't remove yourself as a friend.", 400));
  }

  // Check if the friend exists
  const friend = await User.findById(friendId);
  if (!friend) {
    return next(new appError("Friend not found.", 404));
  }

  // Ensure the user and friend are currently friends
  if (!user.friends.includes(friendId)) {
    return next(new appError("You are not friends with this user.", 400));
  }

  // Remove friend from both users' friends list
  user.friends.pull(friendId);
  friend.friends.pull(userId);

  // Save both users
  await user.save();
  await friend.save();

  res.status(200).json({
    status: "success",
    message: "Friend removed successfully.",
  });
});

const getFriendsController = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!user || !user.friends) {
    return next(new appError("User data is incomplete or missing", 400));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = user.friends.length;

  if (total === 0) {
    return res.status(200).json({
      status: "success",
      results: 0,
      total: 0,
      data: {
        friends: [],
      },
    });
  }

  const friends = await User.aggregate([
    {
      $match: { _id: { $in: user.friends.map((friend) => friend.friendId) } },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "friendDetails",
      },
    },
    {
      $unwind: "$friendDetails",
    },
    {
      $project: {
        name: "$friendDetails.name",
        email: "$friendDetails.email",
        photo: "$friendDetails.photo",
        addedAt: {
          $let: {
            vars: {
              friendData: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: user.friends,
                      as: "friend",
                      cond: { $eq: ["$$friend.friendId", "$_id"] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$friendData.addedAt", null] },
          },
        },
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  res.status(200).json({
    status: "success",
    results: friends.length,
    total,
    data: {
      friends,
    },
  });
});

const getFriendsSuggestionsController = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!user || !user.friends) {
    return next(new appError("User data is incomplete or missing", 400));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Get array of friend IDs
  const friendIds = user.friends.map((friend) => friend.friendId);

  // Use the aggregation pipeline to find friends' suggestions
  const friends = await User.aggregate([
    {
      $match: {
        _id: {
          $nin: [...friendIds, user._id],
        },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        photo: 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  // Get the total number of users who are not the current user or in the user's friends list
  const total = await User.countDocuments({
    _id: { $nin: [...friendIds, user._id] },
  });

  res.status(200).json({
    status: "success",
    results: friends.length,
    total,
    data: {
      friends,
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
  addFriendController,
  removeFriendController,
  getFriendsController,
  getFriendsSuggestionsController,
};
