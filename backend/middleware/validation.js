// backend/middleware/validation.js
const { body, validationResult } = require('express-validator');

// Emails are kept as typed, only trimmed and lowercased (the User model lowercases too).
// normalizeEmail() removed Gmail dots and "+tags", so such addresses couldn't sign in.
const validateRegistration = [
  body('email').trim().isEmail().toLowerCase(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty(),
  // Remove role validation or make it optional with default
  body('role').optional().isIn(['client', 'technician']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateLogin = [
  body('email').trim().isEmail().toLowerCase(),
  body('password').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateRegistration, validateLogin };