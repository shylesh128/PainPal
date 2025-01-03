const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authmiddleware");
const { fileMiddleware } = require("../middlewares/filemiddleware");

router.get("/", getUsers);

router.post("/", addUser);
router.post("/bulk", addUsers);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);
router.delete("/", deleteAllUsers);

router.use(authMiddleware);
router.get("/me", userDetails);

router.post("/me/photo", fileMiddleware, updateProfilePicController);

router.post("/me/friends/add/:friendId", addFriendController);
router.delete("/me/friends/remove/:friendId", removeFriendController);
router.get("/me/friends", getFriendsController);

router.get("/me/friends/suggestions", getFriendsSuggestionsController);

module.exports = router;
