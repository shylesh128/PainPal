/**
 * @fileoverview Central configuration exports
 * @module config
 */

const { connectDatabase, closeDatabase } = require('./database');
const { cloudinary, uploadPresets } = require('./cloudinary');
const { createTransporter, emailTemplates } = require('./email');
const rateLimiters = require('./rateLimiter');

module.exports = {
  // Database
  connectDatabase,
  closeDatabase,
  
  // Cloudinary
  cloudinary,
  uploadPresets,
  
  // Email
  createTransporter,
  emailTemplates,
  
  // Rate Limiters
  ...rateLimiters,
};

