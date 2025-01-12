const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const Tweet = require("../models/tweetModel");
const { uploadToCloudinary } = require("../utils/imageService");
const { unlinkFiles } = require("../middlewares/filemiddleware");

const createTweet = catchAsync(async (req, res, next) => {
  const { tweet } = req.body;
  const files = req.files;
  const user = req.user;

  if (!tweet || !user) {
    return res.status(400).json({
      status: "fail",
      message: "Tweet and user are required fields.",
    });
  }

  let imageUrls = [];
  if (files && files.length > 0) {
    imageUrls = await uploadToCloudinary(files);
  }

  const newTweet = await Tweet.create({
    userId: user._id,
    tweet,
    files: imageUrls,
  });

  unlinkFiles(req.files);

  res.status(201).json({
    status: "success",
    data: {
      tweet: newTweet,
    },
  });
});

// const getAllTweets = catchAsync(async (req, res, next) => {
//   // Pagination
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const totalTweets = await Tweet.countDocuments();

//   const tweets = await Tweet.find()
//     .sort({ timeStamp: -1 })
//     .skip(skip)
//     .limit(limit)
//     .populate({
//       path: "userId",
//       select: "name email photo",
//     })
//     .populate({
//       path: "likes",
//       select: "name photo",
//     })
//     .populate({
//       path: "comments.userId",
//       select: "name photo",
//     });

//   const nextPage = totalTweets > skip + limit ? page + 1 : null;

//   res.status(200).json({
//     status: "success",
//     data: {
//       tweets,
//       pageInfo: {
//         totalTweets,
//         currentPage: page,
//         nextPage,
//       },
//     },
//   });
// });

const getAllTweets = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const totalTweets = await Tweet.countDocuments();
  const totalPages = Math.ceil(totalTweets / limit);

  const tweets = await Tweet.find()
    .sort({ timeStamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "userId",
      select: "name email photo",
    })
    .populate({
      path: "likes",
      select: "name photo",
    })
    .populate({
      path: "comments.userId",
      select: "name photo",
    });

  const hasNext = page < totalPages;
  const nextPage = hasNext ? page + 1 : null;

  res.status(200).json({
    status: "success",
    data: {
      tweets,
      pageInfo: {
        totalTweets,
        currentPage: page,
        totalPages,
        hasNext,
        nextPage,
      },
    },
  });
});

const likeTweetController = catchAsync(async (req, res, next) => {
  const tweetId = req.params.tweetId;
  const user = req.user;

  // Validate request
  if (!tweetId || !user) {
    return next(
      new AppError("Invalid request. Tweet ID or user missing.", 400)
    );
  }

  // Find the tweet and populate likes
  const tweet = await Tweet.findById(tweetId).populate({
    path: "likes",
    select: "name photo",
  });

  if (!tweet) {
    return next(new AppError("Tweet not found.", 404));
  }

  const userId = user._id.toString();

  // Toggle like
  const alreadyLiked = tweet.likes.some(
    (like) => like._id.toString() === userId
  );

  if (alreadyLiked) {
    tweet.likes = tweet.likes.filter((like) => like._id.toString() !== userId);
  } else {
    tweet.likes.push(userId);
  }

  await tweet.save();

  res.status(200).json({
    status: "success",
    data: {
      tweet,
      liked: !alreadyLiked, // Indicate the current state
    },
  });
});

module.exports = { createTweet, getAllTweets, likeTweetController };
