/**
 * Server Configuration
 * ====================
 * Main entry point for the Weba-Hub backend API
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

const cron = require('node-cron');
const { sendExpiryReminders } = require('./jobs/subscriptionReminders');

// Import routes
const authRoutes = require('./routes/authRoutes');
const technicianProfileRoutes = require('./routes/technicianProfileRoutes');
const serviceCatalogRoutes = require('./routes/serviceCatalogRoutes');
const searchRoutes = require('./routes/searchRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const uploads = require('./routes/upload');
const chatRoutes = require('./routes/chatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const commissionPaymentRoutes = require('./routes/commissionPaymentRoutes');
const adminRoutes = require('./routes/admin/index');
const chatSocket = require('./socket/chatSocket');
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');

dotenv.config();

// ===========================================
// ENVIRONMENT VARIABLES VALIDATION
// ===========================================
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

chatSocket(io);
app.set('io', io);

// ===========================================
// GLOBAL ERROR HANDLERS
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
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'https://tech-hub-frontend-lime.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Raw body parser for Paystack webhook
app.use(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/technician', technicianProfileRoutes);
app.use('/api/payments', commissionPaymentRoutes);
app.use('/api/service-catalog', serviceCatalogRoutes);
app.use('/api/technician-public', technicianRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploads);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);

// ===========================================
// DEBUG ENDPOINT — must come BEFORE the 404 handler
// ⚠️ REMOVE THIS IN PRODUCTION
// ===========================================
app.get('/api/debug/mpesa-check', async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (!checkoutRequestID) {
      return res.status(400).json({ error: 'checkoutRequestID required' });
    }

    const Technician = require('./models/Technician');
    const mpesaService = require('./services/mpesaService');
    const { subscriptionPlans } = require('./utils/subscriptionPlans');

    const tech = await Technician.findOne({
      'paymentPending.checkoutRequestID': checkoutRequestID,
    });

    if (!tech) {
      const processed = await Technician.findOne({
        'subscription.paymentHistory.transactionId': checkoutRequestID,
      });

      if (processed) {
        return res.json({
          success: true,
          alreadyProcessed: true,
          subscription: processed.subscription,
        });
      }

      return res.status(404).json({ error: 'No pending transaction found' });
    }

    let safaricomResponse = null;
    let safaricomError = null;
    try {
      safaricomResponse = await mpesaService.queryStatus(checkoutRequestID);
    } catch (err) {
      safaricomError = err.message;
    }

    let updated = false;
    if (safaricomResponse && String(safaricomResponse.ResultCode) === '0') {
      const planId = tech.paymentPending.planId;
      const plan = subscriptionPlans[planId];

      if (plan) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

        tech.subscription = {
          plan: planId,
          planDetails: {
            name: plan.name,
            visibilityRadius: plan.visibilityRadius,
            price: plan.price,
            features: plan.features,
          },
          startDate: new Date(),
          endDate,
          isTrial: false,
          autoRenew: false,
          paymentMethod: 'mpesa',
          lastPaymentDate: new Date(),
          nextPaymentDate: endDate,
          paymentHistory: [
            ...(tech.subscription?.paymentHistory || []),
            {
              amount: tech.paymentPending.amount,
              date: new Date(),
              transactionId: checkoutRequestID,
              status: 'success',
              plan: planId,
            },
          ],
        };

        tech.serviceRadius = plan.visibilityRadius;
        tech.paymentPending = undefined;
        await tech.save();
        updated = true;
      }
    }

    res.json({
      success: true,
      pendingTransaction: {
        planId: tech.paymentPending?.planId,
        amount: tech.paymentPending?.amount,
        initiatedAt: tech.paymentPending?.initiatedAt,
      },
      safaricomResponse,
      safaricomError,
      updated,
      subscription: tech.subscription,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// BASE ROUTE
// ===========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Weba-Hub API',
    version: '1.0.0',
    documentation: '/api/health',
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
// 404 + ERROR HANDLING — MUST come LAST
// ===========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a different value.`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===========================================
// SERVER START
// ===========================================
let server;
const activeConnections = new Set();

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
    console.log(`   - Subscriptions (Paystack + M-Pesa)`);
    console.log(`   - Admin Dashboard`);
    console.log(`   - Search & Filtering`);
    console.log(`\n✅ Server ready to accept connections\n`);
  });

  server.on('connection', (connection) => {
    activeConnections.add(connection);
    connection.on('close', () => {
      activeConnections.delete(connection);
    });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  // ─── Cron jobs ─────────────────────────────────────────
  cron.schedule('0 6 * * *', () => {
    console.log('⏰ Running daily subscription reminders...');
    sendExpiryReminders();
  }, {
    timezone: 'Africa/Nairobi'
  });
};

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal. Closing server gracefully...');

  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });

    setTimeout(() => {
      activeConnections.forEach(connection => {
        try { connection.destroy(); } catch (err) { /* ignore */ }
      });
      activeConnections.clear();
      process.exit(1);
    }, 10000);
  } else {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => process.exit(0));
    } else {
      process.exit(0);
    }
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ===========================================
// START
// ===========================================
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;