/**
 * Server Configuration
 * ====================
 * 
 * Main entry point for the Weba-Hub backend API
 * Includes job posting and application features
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/authRoutes');
const technicianProfileRoutes = require('./routes/technicianProfileRoutes');
const serviceCatalogRoutes = require('./routes/serviceCatalogRoutes');
const searchRoutes = require('./routes/searchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const technicianRoutes = require('./routes/technicianRoutes');

// Job and Application routes
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');

dotenv.config();

const app = express();

// ===========================================
// GLOBAL ERROR HANDLERS (Must be before any other code)
// ===========================================

/**
 * Handle uncaught exceptions (synchronous errors)
 * Prevents the app from crashing on connection resets during shutdown
 */
process.on('uncaughtException', (err) => {
  // ECONNRESET happens when a client disconnects abruptly during server shutdown
  // This is expected behavior and shouldn't crash the app
  if (err.code === 'ECONNRESET') {
    console.log('🔌 Client disconnected during operation (expected, ignoring)');
    return; // Don't crash on connection resets
  }
  
  // For other uncaught exceptions, log and attempt graceful shutdown
  console.error('💥 Uncaught Exception:', err);
  if (typeof gracefulShutdown === 'function') {
    gracefulShutdown();
  } else {
    process.exit(1);
  }
});

/**
 * Handle unhandled promise rejections (async errors)
 * Prevents memory leaks and ensures clean shutdown
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (typeof gracefulShutdown === 'function') {
    gracefulShutdown();
  } else {
    process.exit(1);
  }
});

// ===========================================
// MIDDLEWARE
// ===========================================

// Security middleware - adds various HTTP headers for security
app.use(helmet());

// CORS configuration - controls which domains can access the API
app.use(cors({
  origin: process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'https://tech-hub-frontend-lime.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware - converts request bodies to JavaScript objects
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for development environment only
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ===========================================
// API ROUTES
// ===========================================

/**
 * Health check endpoint
 * Used by monitoring systems and load balancers to verify server status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Weba-Hub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['jobs', 'applications', 'subscriptions', 'service-catalog', 'technician-profiles']
  });
});

// Authentication routes - login, register, password reset
app.use('/api/auth', authRoutes);

// Admin routes - dashboard, user management, analytics
app.use('/api/admin', adminRoutes);

// Subscription routes - plans, payments, billing
app.use('/api/subscription', subscriptionRoutes);

// Technician profile routes - profiles, skills, ratings
app.use('/api/technician', technicianProfileRoutes);

// Service catalog routes - services, categories, pricing
app.use('/api/service-catalog', serviceCatalogRoutes);

// Search technicians public profiles and stats (no authentication needed)
app.use('/api/technician-public', technicianRoutes);

// Search routes - find technicians, jobs, services
app.use('/api/search', searchRoutes);

// ===========================================
// JOB & APPLICATION ROUTES
// ===========================================

// Job routes - posting, viewing, managing job listings
app.use('/api/jobs', jobRoutes);

// Job application routes - applying, accepting, rejecting applications
app.use('/api/job-applications', jobApplicationRoutes);

// ===========================================
// BASE ROUTE
// ===========================================

/**
 * Root endpoint - API information and documentation
 * Provides an overview of available endpoints
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Weba-Hub API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      subscription: '/api/subscription',
      technician: '/api/technician',
      technician: '/api/technician/public',
      serviceCatalog: '/api/service-catalog',
      search: '/api/search',
      jobs: '/api/jobs',
      jobApplications: '/api/job-applications'
    }
  });
});

// ===========================================
// DATABASE CONNECTION
// ===========================================

/**
 * Establishes connection to MongoDB database
 * Includes retry logic and connection event handlers
 * 
 * @returns {Promise<boolean>} - True if connection successful, false otherwise
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tech-hub';
    
    // MongoDB driver v4+ uses default options that work well
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
    
    // Handle connection events for monitoring and recovery
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Retry connection after 5 seconds instead of crashing
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
    return false;
  }
};

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================

/**
 * 404 handler for undefined routes
 * Returns helpful error message with available endpoints
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableEndpoints: {
      auth: '/api/auth',
      jobs: '/api/jobs',
      applications: '/api/job-applications',
      admin: '/api/admin',
      technician: '/api/technician',
      serviceCatalog: '/api/service-catalog',
      search: '/api/search',
      subscription: '/api/subscription'
    }
  });
});

/**
 * Global error handler middleware
 * Handles different types of errors and returns appropriate responses
 */
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error (invalid data format)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  // Mongoose duplicate key error (unique constraint violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a different value.`
    });
  }
  
  // JWT authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.'
    });
  }
  
  // Default error response for unhandled errors
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===========================================
// SERVER INSTANCE AND CONNECTION TRACKING
// ===========================================

// Declare server variable in the correct scope for graceful shutdown
let server;

/**
 * Track all active client connections
 * This allows us to forcefully close connections if they don't close gracefully
 * during server shutdown, preventing ECONNRESET errors
 */
const activeConnections = new Set();

// ===========================================
// START SERVER
// ===========================================

/**
 * Initialize and start the server
 * First establishes database connection, then starts the HTTP server
 * 
 * @returns {Promise<void>}
 */
const startServer = async () => {
  // Connect to database first
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will not start.');
    process.exit(1);
  }
  
  const PORT = process.env.PORT || 5000;
  
  // Start HTTP server
  server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`\n✨ Available Features:`);
    console.log(`   - Authentication & Authorization`);
    console.log(`   - Job Posting & Management`);
    console.log(`   - Job Applications & Tracking`);
    console.log(`   - Technician Profiles`);
    console.log(`   - Service Catalog`);
    console.log(`   - Subscriptions`);
    console.log(`   - Admin Dashboard`);
    console.log(`   - Search & Filtering`);
    console.log(`\n✅ Server ready to accept connections`);
    console.log(`💡 Press Ctrl+C to gracefully shut down the server\n`);
  });
  
  /**
   * Track each new connection to enable graceful shutdown
   * This prevents ECONNRESET errors when closing the server
   */
  server.on('connection', (connection) => {
    // Add new connection to our tracking Set
    activeConnections.add(connection);
    
    // Remove connection from tracking when it closes naturally
    connection.on('close', () => {
      activeConnections.delete(connection);
    });
  });
  
  // Handle server-specific errors (e.g., port already in use)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please use a different port or stop the other process.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });
};

// ===========================================
// GRACEFUL SHUTDOWN (Fixes ECONNRESET errors)
// ===========================================

/**
 * Gracefully shuts down the server and all connections
 * This prevents ECONNRESET errors that occur when clients disconnect abruptly
 * 
 * The shutdown process:
 * 1. Stop accepting new connections
 * 2. Wait for existing connections to complete (5 seconds)
 * 3. Force-close any lingering connections
 * 4. Close database connection
 * 5. Exit the process
 */
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal. Closing server gracefully...');
  
  if (server) {
    // Step 1: Stop accepting new connections
    // server.close() prevents new connections but keeps existing ones
    server.close(() => {
      console.log('✅ HTTP server closed (no longer accepting new connections)');
      
      // Step 4: Close MongoDB connection after HTTP server is closed
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        console.log('👋 Shutdown complete');
        process.exit(0);
      });
    });
    
    // Step 2 & 3: Handle existing connections with a timeout
    // Give existing connections 5 seconds to complete naturally
    setTimeout(() => {
      const remainingConnections = activeConnections.size;
      
      if (remainingConnections > 0) {
        console.log(`⚠️ Force closing ${remainingConnections} active connection(s) that didn't close gracefully...`);
        
        // Force-destroy any remaining connections
        // This is necessary because some clients (like browsers) don't close connections properly
        activeConnections.forEach(connection => {
          try {
            connection.destroy(); // Forcefully terminate the connection
          } catch (err) {
            // Ignore errors during force destroy - connection might already be closing
            if (err.code !== 'ECONNRESET') {
              console.error('Error destroying connection:', err.message);
            }
          }
        });
        
        // Clear the Set after destroying all connections
        activeConnections.clear();
        console.log('✅ All remaining connections forcefully closed');
      } else {
        console.log('✅ No active connections remaining');
      }
    }, 5000); // Wait 5 seconds for graceful completion
    
    // Step 5: Ultimate safety net - force exit after 10 seconds
    // This ensures the process doesn't hang forever if something goes wrong
    setTimeout(() => {
      console.error('⚠️ Could not close all connections within timeout period (10 seconds)');
      console.error('⚠️ Forcefully shutting down process');
      process.exit(1);
    }, 10000);
    
  } else {
    // Handle case where server hasn't started yet or already closed
    console.log('⚠️ No active server instance found');
    
    // Still need to close database connection if it's open
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      console.log('Closing MongoDB connection...');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    } else {
      console.log('✅ No active connections to close');
      process.exit(0);
    }
  }
};

// ===========================================
// SHUTDOWN SIGNAL HANDLERS
// ===========================================

/**
 * Handle different shutdown signals
 * SIGTERM: Used by process managers (PM2, systemd) and orchestrators (Kubernetes)
 * SIGINT: Sent when pressing Ctrl+C in terminal
 */
process.on('SIGTERM', gracefulShutdown);  // Process termination signal
process.on('SIGINT', gracefulShutdown);   // Interrupt signal (Ctrl+C)

// ===========================================
// START THE APPLICATION
// ===========================================

// Initialize the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Export app for testing purposes
module.exports = app;