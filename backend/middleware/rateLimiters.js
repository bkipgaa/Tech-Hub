/**
 * rateLimiters.js
 * ===============
 * Rate limits for public authentication endpoints (brute-force and
 * email-spam protection). Limits are per client IP.
 */

const rateLimit = require('express-rate-limit');

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMITED', message },
  });

// Login: 10 attempts per 15 minutes
const loginLimiter = limiter(15, 10, 'Too many login attempts. Please try again in 15 minutes.');

// Admin login: separate counter from user login, same limit
const adminLoginLimiter = limiter(15, 10, 'Too many login attempts. Please try again in 15 minutes.');

// Registration: 5 accounts per hour
const registerLimiter = limiter(60, 5, 'Too many accounts created. Please try again later.');

// Forgot / reset password: 5 requests per hour
const passwordResetLimiter = limiter(60, 5, 'Too many password reset requests. Please try again later.');

module.exports = { loginLimiter, adminLoginLimiter, registerLimiter, passwordResetLimiter };
