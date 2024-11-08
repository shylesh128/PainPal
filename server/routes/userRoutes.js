const express = require("express");
const router = express.Router();

const {
  addUser,
  deleteUser,
  getUsers,
  updateUser,
  addUsers,
  deleteAllUsers,
} = require("../controllers/userController");

router.get("/", getUsers);

router.post("/", addUser);
router.post("/bulk", addUsers);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);
router.delete("/", deleteAllUsers);

module.exports = router;
