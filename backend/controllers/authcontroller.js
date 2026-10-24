/**
 * Authentication Controller
 * =========================
 * 
 * Handles USER authentication (clients & technicians only).
 * 
 * Admin authentication has moved to a separate system:
 *   - AdminUser collection
 *   - /api/admin/auth/* endpoints
 *   - adminAuth middleware
 * 
 * This controller should NEVER create or manage admin accounts.
 */

const User = require('../models/User');
const Technician = require('../models/Technician');
const ServiceCatalog = require('../models/ServiceCatalog');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const { normalizeServiceSelection } = require('../utils/serviceSelection');
const { CATEGORY_IDS } = require('../utils/listingCategories');
const { updateCompletionStats, trialSubscriptionFields } = require('./technician/profile/helpers');

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────

/**
 * Generate a JWT for a regular user (client or technician).
 * Note: Admins never use this token — they use the admin JWT.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Signup and location fields the frontend uses to route people
 * (added to the user objects returned below).
 */
const signupFields = (user) => ({
  signupIntent: user.signupIntent || null,
  preferences: {
    mainCategory: user.preferences?.mainCategory || '',
    listingCategory: user.preferences?.listingCategory || '',
  },
  location: user.location?.lat != null ? user.location : null,
  address: user.address || {},
});

/**
 * Read { lat, lng } from the request; null when missing or not a real fix.
 */
const parseLocation = (raw) => {
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
  return valid ? { lat, lng } : null;
};

const SIGNUP_INTENTS = ['expert', 'client', 'lister', 'stay_seeker'];

// ─────────────────────────────────────────────────────────────
// REGISTER (client / technician only)
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * The signup form asks what the person is here for (signupIntent):
 *   expert      → technician account + expert profile from the categories
 *                 they picked (pending until an admin approves it)
 *   client      → client, with the kind of expert they're after
 *   lister      → client, with the Stays & Spaces category they'll list
 *   stay_seeker → client, with the Stays & Spaces category they want
 * Everyone must share their device location.
 *
 * Only 'client' and 'technician' roles are created here. Admins are
 * created by super admins via the admin panel.
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const signupIntent = req.body.signupIntent;
    if (!SIGNUP_INTENTS.includes(signupIntent)) {
      return res.status(400).json({
        success: false,
        message: 'Tell us how you will use Webafix (expert, client, list a property or find a stay).',
      });
    }
    const role = signupIntent === 'expert' ? 'technician' : 'client';

    const coords = parseLocation(req.body.location);
    if (!coords) {
      return res.status(400).json({
        success: false,
        message: 'Please share your location to sign up.',
      });
    }
    const address = {
      city: String(req.body.address?.city || '').trim(),
      state: String(req.body.address?.state || '').trim(),
      country: String(req.body.address?.country || '').trim() || 'Kenya',
    };
    if (!address.city || !address.state) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your town and county.',
      });
    }

    // What they picked on the form
    const preferences = {};
    let services = null;
    if (signupIntent === 'expert') {
      try {
        services = await normalizeServiceSelection(req.body.services);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    } else if (signupIntent === 'client') {
      const mainCategory = String(req.body.mainCategory || '').trim();
      const exists = mainCategory && await ServiceCatalog.exists({ mainCategory, isActive: true });
      if (!exists) {
        return res.status(400).json({ success: false, message: 'Pick the kind of expert you are looking for.' });
      }
      preferences.mainCategory = mainCategory;
    } else {
      const listingCategory = String(req.body.listingCategory || '');
      if (!CATEGORY_IDS.includes(listingCategory)) {
        return res.status(400).json({ success: false, message: 'Pick a Stays & Spaces category.' });
      }
      preferences.listingCategory = listingCategory;
    }

    // Duplicate check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const formattedAddress = String(req.body.location?.formattedAddress || '').slice(0, 300);

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      profileImage: '',
      isVerified: false,
      status: 'active',
      signupIntent,
      preferences,
      location: { ...coords, formattedAddress, updatedAt: new Date() },
      address,
    });

    await user.save();

    // Experts get their profile straight away; it waits for admin approval
    if (services) {
      try {
        const technician = new Technician({
          userId: user._id,
          ...services,
          address: { city: address.city, state: address.state, country: address.country },
          location: { type: 'Point', coordinates: [coords.lng, coords.lat], formattedAddress },
          locationUpdatedAt: new Date(),
          yearsOfExperience: 0,
          languages: [{ name: 'English', proficiency: 'Fluent' }],
          pricing: { paymentMethods: ['Cash', 'M-Pesa'] },
          verificationStatus: 'pending',
          awaitingApproval: true,
          ...trialSubscriptionFields(),
        });
        await technician.save();
        await updateCompletionStats(technician);
      } catch (err) {
        // Don't leave an expert account without a profile
        await User.deleteOne({ _id: user._id });
        throw err;
      }
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: `User registered successfully as ${user.role}`,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified,
        ...signupFields(user),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Login user (client or technician)
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Admins are rejected here — they must use /api/admin/auth/login.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ─── Block legacy admin users ──────────────────────────
    // Admins now live in a separate AdminUser collection.
    // Any User with role 'admin' is a legacy record.
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Admin accounts must log in via the admin portal at /admin/login.',
        code: 'USE_ADMIN_PORTAL',
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.firstName}!`,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified,
        ...signupFields(user),
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated - req.user missing',
      });
    }

    if (!req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user data in token',
      });
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified,
        ...signupFields(user),
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// BECOME TECHNICIAN
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Upgrade client → technician
 * @route   PUT /api/auth/become-technician
 * @access  Private (client)
 */
exports.becomeTechnician = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'technician') {
      return res.status(400).json({
        success: false,
        message: 'You are already a technician',
      });
    }

    // Defensive: legacy admin safety
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot become technicians',
      });
    }

    user.role = 'technician';
    await user.save();

    res.json({
      success: true,
      message:
        'You are now a technician! You can now create your technician profile.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
      },
    });
  } catch (error) {
    console.error('Become technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Update own profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        ...signupFields(user),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE LOCATION
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Save the device location (and town/county) on the account.
 *          For experts the profile location is moved too, so clients
 *          find them where they now are.
 * @route   PUT /api/auth/location
 * @access  Private
 */
exports.updateLocation = async (req, res) => {
  try {
    const coords = parseLocation(req.body.location);
    if (!coords) {
      return res.status(400).json({ success: false, message: 'Invalid location' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const formattedAddress = String(req.body.location?.formattedAddress || '').slice(0, 300);
    user.location = { ...coords, formattedAddress, updatedAt: new Date() };
    const city = String(req.body.address?.city || '').trim();
    const state = String(req.body.address?.state || '').trim();
    user.address = { ...(user.toObject().address || {}), ...(city && { city }), ...(state && { state }) };
    await user.save();

    if (user.role === 'technician') {
      const technician = await Technician.findOne({ userId: user._id });
      if (technician) {
        const current = technician.toObject();
        technician.location = { ...current.location, type: 'Point', coordinates: [coords.lng, coords.lat], formattedAddress };
        technician.locationUpdatedAt = new Date();
        if (city || state) {
          technician.address = { ...current.address, ...(city && { city }), ...(state && { state }) };
        }
        await technician.save();
      }
    }

    res.json({
      success: true,
      message: 'Location updated',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        ...signupFields(user),
      },
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Request password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    console.log(`🔍 Forgot password requested for: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ No user found for email: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address.',
      });
    }

    // Generate token (1 hour expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save({ validateBeforeSave: false });
    console.log(`✅ Reset token generated for user: ${email}`);

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('❌ FRONTEND_URL is not defined');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: missing frontend URL.',
      });
    }

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'WeBA-Hub Password Reset',
        html: message,
      });
      console.log(`✅ Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error('❌ Nodemailer error (full):', emailError);
      console.error('  - Code:', emailError.code);
      console.error('  - Command:', emailError.command);
      console.error('  - Response:', emailError.response);
      console.error('  - Stack:', emailError.stack);

      return res.status(500).json({
        success: false,
        message: 'Email sending failed. Please contact support.',
        details: emailError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    console.error('🚨 Unhandled forgot password error:', error);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Server error. Could not process your request.',
      details: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Could not reset password.',
    });
  }
};

// ============================================================
// REMOVED (now handled by the admin panel):
//   - registerAdmin()   → use scripts/createSuperAdmin.js
//                         or POST /api/admin/admin-users
//   - getAllUsers()     → use GET /api/admin/users
//   - updateUserRole()  → use PATCH /api/admin/users/:id/role
// ============================================================