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
 * - Detailed logging for debugging
 */

const jwt = require('jsonwebtoken');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to req.user
 */
const auth = (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('1. Request path:', req.method, req.path);
    console.log('2. Headers received:', req.headers);
    
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    console.log('3. Authorization header:', authHeader);
    
    // Check if Authorization header exists
    if (!authHeader) {
      console.log('4. No Authorization header found');
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Please login first.',
        code: 'NO_TOKEN'
      });
    }
    
    // Check if header has Bearer prefix
    if (!authHeader.startsWith('Bearer ')) {
      console.log('5. Header does not start with Bearer');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_FORMAT'
      });
    }
    
    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);
    console.log('6. Token extracted (first 20 chars):', token.substring(0, 20) + '...');
    console.log('7. Token length:', token.length);
    
    // Validate token length
    if (!token || token.length < 10) {
      console.log('8. Token is too short or empty');
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
    console.log('9. JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('10. Decoded token payload:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Validate required fields in token
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.log('11. Token missing required fields');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token structure. Please login again.',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    console.log('12. ✅ Authentication successful for user:', {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    });
    
    next();
    
  } catch (error) {
    console.error('=== AUTH MIDDLEWARE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle token expiration error
    if (error.name === 'TokenExpiredError') {
      const expiredAt = new Date(error.expiredAt);
      console.error('Token expired at:', expiredAt.toISOString());
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
    
    // Generic error response
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
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          };
          console.log('Optional auth: User authenticated as:', req.user.role);
        } catch (error) {
          // Token is invalid but we don't care - just proceed without user
          console.log('Optional auth: Invalid token, proceeding as unauthenticated');
        }
      }
    }
    
    next();
  } catch (error) {
    // If something goes wrong, just continue without user
    console.log('Optional auth error:', error.message);
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