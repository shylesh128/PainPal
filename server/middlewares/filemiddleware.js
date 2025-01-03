const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Jimp = require("jimp");

async function resizeImage(inputFile) {
  const n = path.basename(inputFile);
  const outputPath = "./resuzed" + n;
  try {
    const image = await Jimp.read(inputFile);

    image.resize(500, Jimp.AUTO);

    await image.writeAsync(outputPath);
    return outputPath;
  } catch (err) {
    console.error("Error resizing image:", err);
    throw new Error("Image resizing failed");
  }
}

const resizeBy = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("Could not find the image file at the specified path.");
  }

  const stats = fs.statSync(filePath);
  let imgData;
  let resizedFilePath;
  console.log(stats);

  if (stats.size > 4096000) {
    // If the image size is greater than 4MB (4096 KB)
    resizedFilePath = await resizeImage(filePath);
    imgData = Buffer.from(fs.readFileSync(resizedFilePath));
  } else {
    imgData = Buffer.from(fs.readFileSync(filePath));
  }

  const imageBase64 = imgData.toString("base64");
  const image = `data:image/jpeg;base64,${imageBase64}`;

  // Clean up the resized image if it exists
  // if (resizedFilePath && fs.existsSync(resizedFilePath)) {
  //   fs.unlinkSync(resizedFilePath);
  // }

  // return { bufferString: image };

  return filePath;
};

const allowedFileTypes =
  /jpeg|jpg|png|pdf|csv|xlsx|docx|mp4|avi|mov|doc|ppt|pptx|xls|odt/;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // const extname = allowedFileTypes.test(
  //   path.extname(file.originalname).toLowerCase()
  // );

  // if (extname) {
  return cb(null, true);
  // } else {
  //   cb(new Error("File type not allowed"));
  // }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // Set max file size to 250MB
  fileFilter: fileFilter,
}).array("files");

// Middleware for file uploads
const fileMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size too large. Limit is 250MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Middleware to resize images if needed
const imageResizeMiddleware = async (req, res, next) => {
  if (req.files) {
    for (const file of req.files) {
      // Check if the file is an image and needs resizing
      if (file.mimetype.startsWith("image/")) {
        const resizedImage = await resizeBy(file.path);
        fs.unlinkSync(file.path);
        file.path = resizedImage;
      }
    }
  }
  next();
};

const unlinkFiles = (files) => {
  if (files) {
    files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Error unlinking file ${file.path}:`, err);
        } else {
          console.log(`Unlinked file ${file.path}`);
        }
      });
    });
  }
};

module.exports = {
  fileMiddleware,
  imageResizeMiddleware,
  resizeBy,
  unlinkFiles,
};
