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

module.exports = router;
