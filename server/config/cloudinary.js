/**
 * @fileoverview Cloudinary configuration for media uploads
 * @module config/cloudinary
 */

const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary with environment credentials
 */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID,
  api_secret: process.env.API_SECRET,
});

/**
 * Upload options for different media types
 */
const uploadPresets = {
  avatar: {
    folder: 'painpal/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
    ],
  },
  banner: {
    folder: 'painpal/banners',
    transformation: [
      { width: 1500, height: 500, crop: 'fill' },
      { quality: 'auto:good' },
    ],
  },
  post: {
    folder: 'painpal/posts',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
  serverIcon: {
    folder: 'painpal/servers/icons',
    transformation: [
      { width: 256, height: 256, crop: 'fill' },
      { quality: 'auto:good' },
    ],
  },
  serverBanner: {
    folder: 'painpal/servers/banners',
    transformation: [
      { width: 960, height: 540, crop: 'fill' },
      { quality: 'auto:good' },
    ],
  },
};

module.exports = {
  cloudinary,
  uploadPresets,
};

