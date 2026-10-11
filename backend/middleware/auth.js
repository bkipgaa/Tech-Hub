/**
 * Authentication Middleware
 * =========================
 *
 * Handles JWT token validation and role-based authorization
 *
 * Features:
 * - Bearer token authentication
 * - Token expiration handling
 * - Role-based access control
 * - User loaded from the DB on every request, so role changes,
 *   suspensions and deletions take effect immediately
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Load the current user for a decoded token.
 * The token's role/email are never trusted — they come from the DB.
 * Returns null if the user no longer exists.
 */
const loadUser = (decoded) => {
  if (!decoded.userId) return null;
  return User.findById(decoded.userId).select('email role status');
};

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to req.user
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.',
        code: 'NO_TOKEN'
      });
    }

    // Check if header has Bearer prefix
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_FORMAT'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Validate token length
    if (!token || token.length < 10) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Token is too short.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate required fields in token
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure. Please login again.',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    // Load the user from the DB
    const user = await loadUser(decoded);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach user info to request object
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();

  } catch (error) {
    // Handle token expiration error
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    // Handle invalid token errors
    if (error.name === 'JsonWebTokenError') {
      let message = 'Invalid token';
      let code = 'INVALID_TOKEN';

      if (error.message === 'jwt malformed') {
        message = 'Malformed token. Please login again.';
        code = 'MALFORMED_TOKEN';
      } else if (error.message === 'invalid signature') {
        message = 'Invalid token signature. Please login again.';
        code = 'INVALID_SIGNATURE';
      } else if (error.message === 'jwt must be provided') {
        message = 'No token provided. Please login first.';
        code = 'NO_TOKEN_PROVIDED';
      }

      return res.status(401).json({
        success: false,
        message: message,
        code: code
      });
    }

    // Handle token not yet active error
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not yet active. Please try again.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // userId in the token is not a valid ObjectId
    if (error.name === 'CastError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    // Generic error response
    console.error('Auth middleware error:', error.name, error.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 *
 * @param {...string} roles - List of allowed roles
 * @returns {Function} Express middleware
 *
 * @example
 * // Allow only admins
 * router.get('/admin-only', auth, authorize('admin'));
 *
 * // Allow technicians or admins
 * router.get('/dashboard', auth, authorize('technician', 'admin'));
 *
 * // Allow only clients
 * router.post('/booking', auth, authorize('client'));
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(' or ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Optional authentication middleware
 * Tries to authenticate but continues even without valid token
 * Useful for routes that work for both authenticated and unauthenticated users
 *
 * @example
 * router.get('/public-with-auth', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated
 *   }
 * });
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await loadUser(decoded);
          if (user && user.status === 'active') {
            req.user = {
              userId: user._id.toString(),
              email: user.email,
              role: user.role
            };
          }
        } catch (error) {
          // Token is invalid but we don't care - just proceed without user
        }
      }
    }

    next();
  } catch (error) {
    // If something goes wrong, just continue without user
    next();
  }
};

/**
 * Role-specific authorization shortcuts
 */

// Allow only admin access
const requireAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

// Allow technician or admin access
const requireTechnicianOrAdmin = (req, res, next) => {
  return authorize('technician', 'admin')(req, res, next);
};

// Allow client or admin access
const requireClientOrAdmin = (req, res, next) => {
  return authorize('client', 'admin')(req, res, next);
};

// Export all middleware functions
module.exports = {
  auth,           // Main authentication middleware
  authorize,      // Role-based authorization factory
  optionalAuth,   // Optional authentication (doesn't block unauthenticated)
  requireAdmin,   // Shortcut for admin-only routes
  requireTechnicianOrAdmin, // Shortcut for technician/admin routes
  requireClientOrAdmin      // Shortcut for client/admin routes
};
