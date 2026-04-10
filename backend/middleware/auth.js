// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('1. Headers received:', req.headers);
    
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('2. Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('3. No Authorization header found');
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }
    
    // Check if it starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.log('4. Header does not start with Bearer');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format. Use: Bearer <token>' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' from string
    console.log('5. Extracted token:', token.substring(0, 20) + '...');
    console.log('6. Token length:', token.length);
    
    if (!token || token.length < 10) {
      console.log('7. Token is too short or empty');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    // Verify token
    console.log('8. JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('9. Decoded token:', decoded);
    
    // Add user from payload to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    console.log('10. Auth successful for user:', req.user.userId);
    next();
    
  } catch (error) {
    console.error('=== AUTH MIDDLEWARE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};