const Text = require("../models/textModel");
const catchAsync = require("../utils/catchAsync");

const getTexts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const query = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (page - 1) * limit;

  const users = await Text.find(query).skip(skip).limit(limit);
  const totalTexts = await Text.countDocuments(query);

  const totalPages = Math.ceil(totalTexts / limit);
  const hasNextPage = page < totalPages;

  res.status(200).json({
    page: page,
    limit: limit,
    totalTexts: totalTexts,
    totalPages: totalPages,
    users: users,
    hasNextPage: hasNextPage,
  });
});

const addBulkTexts = catchAsync(async (req, res) => {
  const numUsers = req.query.numUsers || 500;

  const firstNames = [
    "John",
    "Jane",
    "Alex",
    "Emily",
    "Chris",
    "Katie",
    "David",
    "Sarah",
    "Michael",
    "Olivia",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Garcia",
    "Rodriguez",
    "Martinez",
  ];

  // Helper function to generate random names
  const generateRandomName = () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };

  const generateRandomEmail = (name) => {
    const username = name.toLowerCase().replace(/\s+/g, "");
    return `${username}@painpal.com`;
  };

  const texts = [];
  for (let i = 0; i < numUsers; i++) {
    const name = generateRandomName();
    const email = generateRandomEmail(name);
    texts.push({ name, email });
  }

  const result = await Text.insertMany(texts);
  res.status(201).json({ message: "Texts added successfully", result });
});

module.exports = {
  getTexts,
  addBulkTexts,
};
