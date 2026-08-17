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
const http = require('http');              // ← Required for Socket.io

// Import routes
const authRoutes = require('./routes/authRoutes');
const technicianProfileRoutes = require('./routes/technicianProfileRoutes');
const serviceCatalogRoutes = require('./routes/serviceCatalogRoutes');
const searchRoutes = require('./routes/searchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const uploads = require('./routes/upload');
const chatRoutes = require('./routes/chatRoutes');  // ← Chat REST routes

// Import Socket.io chat handler
const chatSocket = require('./socket/chatSocket');  // ← Real-time chat socket
// Job and Application routes
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');

dotenv.config();

// ===========================================
// ENVIRONMENT VARIABLES VALIDATION
// ===========================================
// Ensure required environment variables are present
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PAYSTACK_SECRET_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// ===========================================
// CREATE HTTP SERVER (Required for Socket.io)
// ===========================================
const httpServer = http.createServer(app);

// ===========================================
// INITIALIZE SOCKET.IO
// ===========================================
const io = require('socket.io')(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL, 'https://tech-hub-frontend-lime.vercel.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Initialize chat event handlers
chatSocket(io);

// Make io accessible globally
app.set('io', io);

// ===========================================
// GLOBAL ERROR HANDLERS (Must be before any other code)
// ===========================================

process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET') {
    console.log('🔌 Client disconnected during operation (expected, ignoring)');
    return;
  }
  console.error('💥 Uncaught Exception:', err);
  if (typeof gracefulShutdown === 'function') {
    gracefulShutdown();
  } else {
    process.exit(1);
  }
});

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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'https://tech-hub-frontend-lime.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ===========================================
// 🔥 CRITICAL: RAW BODY PARSER FOR WEBHOOK
// ===========================================
/**
 * Paystack webhook needs the raw body to verify the X-Paystack-Signature.
 * This must be placed BEFORE the global express.json() middleware.
 * 
 * The route path must match exactly: /api/subscription/webhook
 * This ensures only that endpoint receives the raw body.
 */
app.use(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' })
);

// Body parsing middleware for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ===========================================
// API ROUTES
// ===========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Weba-Hub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['jobs', 'applications', 'subscriptions', 'service-catalog', 'technician-profiles']
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Subscription routes (includes webhook - now raw parser is applied above)
app.use('/api/subscription', subscriptionRoutes);

// Technician profile routes
app.use('/api/technician', technicianProfileRoutes);

// Service catalog routes
app.use('/api/service-catalog', serviceCatalogRoutes);

// Technician public routes
app.use('/api/technician-public', technicianRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Search routes
app.use('/api/search', searchRoutes);

// Upload routes
app.use('/api/upload', uploads);

// Job and application routes
app.use('/api/jobs', jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);

// ===========================================
// BASE ROUTE
// ===========================================

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
      technicianpublic: '/api/technician-public',
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

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tech-hub';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
    
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
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
    return false;
  }
};

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================

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
      technicianpublic: '/api/technician-public',
      serviceCatalog: '/api/service-catalog',
      search: '/api/search',
      subscription: '/api/subscription'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a different value.`
    });
  }
  
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

let server;
const activeConnections = new Set();

// ===========================================
// START SERVER
// ===========================================

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will not start.');
    process.exit(1);
  }
  
  const PORT = process.env.PORT || 5000;
  
  server = httpServer.listen(PORT, () => {
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
    console.log(`   - Subscriptions (Paystack enabled)`);
    console.log(`   - Admin Dashboard`);
    console.log(`   - Search & Filtering`);
    console.log(`\n✅ Server ready to accept connections`);
    console.log(`💡 Press Ctrl+C to gracefully shut down the server\n`);
  });
  
  server.on('connection', (connection) => {
    activeConnections.add(connection);
    connection.on('close', () => {
      activeConnections.delete(connection);
    });
  });
  
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
// GRACEFUL SHUTDOWN
// ===========================================

const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal. Closing server gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed (no longer accepting new connections)');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        console.log('👋 Shutdown complete');
        process.exit(0);
      });
    });
    
    setTimeout(() => {
      const remainingConnections = activeConnections.size;
      if (remainingConnections > 0) {
        console.log(`⚠️ Force closing ${remainingConnections} active connection(s) that didn't close gracefully...`);
        activeConnections.forEach(connection => {
          try {
            connection.destroy();
          } catch (err) {
            if (err.code !== 'ECONNRESET') {
              console.error('Error destroying connection:', err.message);
            }
          }
        });
        activeConnections.clear();
        console.log('✅ All remaining connections forcefully closed');
      } else {
        console.log('✅ No active connections remaining');
      }
    }, 5000);
    
    setTimeout(() => {
      console.error('⚠️ Could not close all connections within timeout period (10 seconds)');
      console.error('⚠️ Forcefully shutting down process');
      process.exit(1);
    }, 10000);
    
  } else {
    console.log('⚠️ No active server instance found');
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

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ===========================================
// START THE APPLICATION
// ===========================================

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Export app for testing
module.exports = app;