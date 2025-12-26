/**
 * @fileoverview Main server entry point with Next.js and Express integration
 * @module server/index
 */

const express = require('express');
const next = require('next');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

require('dotenv').config();

// Configuration
const { connectDatabase } = require('./config/database');
const { apiLimiter } = require('./config/rateLimiter');

// Error handling
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Socket
const socketModule = require('./socket');

const PORT = process.env.PORT || 4008;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Connect to database
connectDatabase();

app
  .prepare()
  .then(() => {
    const server = express();
    const httpServer = http.createServer(server);

    // ==================== Security Middleware ====================
    
    // Set security HTTP headers
    server.use(helmet({
      contentSecurityPolicy: false, // Disable for Next.js compatibility
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    server.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:4008',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing
    server.use(express.json({ limit: '10kb' })); // Limit body size
    server.use(express.urlencoded({ extended: true, limit: '10kb' }));
    server.use(express.text());

    // Cookie parsing
    server.use(cookieParser());

    // Data sanitization against NoSQL query injection
    server.use(mongoSanitize());

    // Prevent parameter pollution
    server.use(hpp({
      whitelist: ['page', 'limit', 'sort', 'fields'],
    }));

    // ==================== Socket.IO ====================
    const io = socketModule(httpServer);

    // ==================== API Routes ====================
    const version = '/api/v1';

    // Apply rate limiting to all API routes
    server.use(`${version}/`, apiLimiter);

    // Routes
    server.use(`${version}/`, require('./routes/statusRoutes'));
    server.use(`${version}/auth`, require('./routes/authRoutes'));
    server.use(`${version}/tweets`, require('./routes/tweetRoutes'));
    server.use(`${version}/posts`, require('./routes/tweetRoutes')); // Alias for tweets
    server.use(`${version}/users`, require('./routes/userRoutes'));
    server.use(`${version}/other`, require('./routes/otherRoutes'));
    server.use(`${version}/music`, require('./routes/musicRoutes'));
    server.use(`${version}/conversations`, require('./routes/messageRoutes'));
    server.use(`${version}/servers`, require('./routes/serverRoutes'));

    // ==================== Next.js Handler ====================
    server.get('*', (req, res) => {
      return handle(req, res);
    });

    // ==================== Error Handling ====================
    
    // 404 handler for API routes
    server.all('/api/*', (req, res, next) => {
      next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
    });

    // Global error handler
    server.use(globalErrorHandler);

    // ==================== Start Server ====================
    httpServer.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`
🩹 PainPal Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 URL: http://localhost:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // ==================== Graceful Shutdown ====================
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      httpServer.close(async () => {
        console.log('HTTP server closed.');
        
        try {
          const { closeDatabase } = require('./config/database');
          await closeDatabase();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((ex) => {
    console.error('❌ Server failed to start:', ex.stack);
    process.exit(1);
  });
