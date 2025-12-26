/**
 * @fileoverview Database configuration and connection management
 * @module config/database
 */

const mongoose = require('mongoose');

/**
 * MongoDB connection options
 * @type {mongoose.ConnectOptions}
 */
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Establishes connection to MongoDB Atlas
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
const connectDatabase = async () => {
  try {
    const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
    
    await mongoose.connect(DB, connectionOptions);
    
    console.log('✅ Database connection successful!');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected!');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Gracefully closes the database connection
 * @async
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('📦 Database connection closed.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

module.exports = {
  connectDatabase,
  closeDatabase,
};

