/**
 * Admin Authentication Middleware
 * ===============================
 * 
 * Checks if the authenticated user has admin role
 * Use this middleware after the auth middleware
 */

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = adminAuth;