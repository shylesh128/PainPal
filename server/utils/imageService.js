const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (files) => {
  const uploadPromises = files.map((file) =>
    cloudinary.uploader.upload(file.path, {
      folder: "tweets_images",
    })
  );

  try {
    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults.map((result) => result.secure_url);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Error uploading to Cloudinary");
  }
};

module.exports = {
  uploadToCloudinary,
};
