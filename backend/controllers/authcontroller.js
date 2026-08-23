/**
 * Authentication Controller
 * =========================
 * 
 * Handles user authentication, registration, and profile management
 * Supports three user roles: client, technician, admin
 * 
 * Admin Registration:
 * - Admins should be created via a secure admin registration endpoint
 * - Or manually in database for super admins
 * - Regular registration endpoint prevents admin role creation for security
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register a new user (client by default)
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * Security: Prevents users from registering as admin
 * Admin accounts must be created via separate admin registration
 */
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { email, password, firstName, lastName, phone, role = 'client' } = req.body;
    
    // SECURITY: Prevent users from registering as admin
    // Only 'client' or 'technician' roles are allowed via public registration
    const allowedRoles = ['client', 'technician'];
    const requestedRole = role || 'client';
    
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role selection. Admin accounts cannot be created through public registration.' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: requestedRole,
      profileImage: '',
      isVerified: false,
      status: 'active'
    });
    
    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully with ID:', user._id);
    
    // Generate token
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
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

/**
 * @desc    Register an admin user (Secure endpoint)
 * @route   POST /api/auth/register-admin
 * @access  Private/Admin (or use a secret key for initial setup)
 * 
 * This endpoint should be protected or only accessible during initial setup
 * For production, consider using an environment variable as a setup key
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, adminSecretKey } = req.body;
    
    // Verify admin secret key for security
    const validAdminKey = process.env.ADMIN_REGISTRATION_KEY || 'WeBA-Hub-Admin-2024!';
    
    if (adminSecretKey !== validAdminKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin registration key'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    // Create admin user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'admin',
      profileImage: '',
      isVerified: true, // Auto-verify admins
      status: 'active'
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
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
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during admin registration',
      error: error.message 
    });
  }
};

/**
 * @desc    Login user (supports all roles: client, technician, admin)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is not active. Please contact support.' 
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    // Generate token
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
        status: user.status
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    console.log('=== GET PROFILE DEBUG ===');
    console.log('req.user:', req.user);
    
    // Check if req.user exists
    if (!req.user) {
      console.log('req.user is undefined - auth middleware failed');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated - req.user missing' 
      });
    }

    console.log('Fetching profile for user ID:', req.user.userId);
    
    if (!req.user.userId) {
      console.log('userId missing in req.user');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid user data in token' 
      });
    }
    
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      console.log('User not found in database for ID:', req.user.userId);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('User found:', user.email, 'Role:', user.role);
    
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
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * @desc    Upgrade user role to technician
 * @route   PUT /api/users/become-technician
 * @access  Private
 */
exports.becomeTechnician = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if already a technician or admin
    if (user.role === 'technician') {
      return res.status(400).json({ 
        success: false,
        message: 'You are already a technician' 
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Admin users cannot become technicians' 
      });
    }
    
    // Update role to technician
    user.role = 'technician';
    await user.save();
    
    res.json({
      success: true,
      message: 'You are now a technician! You can now create your technician profile.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage || ''
      }
    });
    
  } catch (error) {
    console.error('Become technician error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
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
        profileImage: user.profileImage || ''
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { role, status, search, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/auth/users/:userId/role
 * @access  Private/Admin
 */
exports.updateUserRole = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { userId } = req.params;
    const { role } = req.body;
    
    const validRoles = ['client', 'technician', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`🔍 Forgot password requested for: ${email}`);

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ No user found for email: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address.',
      });
    }

    // 2. Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save({ validateBeforeSave: false });
    console.log(`✅ Reset token generated for user: ${email}`);

    // 3. Build reset URL (check that FRONTEND_URL is set)
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('❌ FRONTEND_URL is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: missing frontend URL.',
      });
    }
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // 4. Prepare email HTML
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // 5. Send email – catch specific errors from Nodemailer
    try {
      await sendEmail({
        email: user.email,
        subject: 'WeBA-Hub Password Reset',
        html: message,
      });
      console.log(`✅ Password reset email sent to: ${email}`);
    } catch (emailError) {
      // Log the full SMTP error
      console.error('❌ Nodemailer error (full):', emailError);
      console.error('  - Code:', emailError.code);
      console.error('  - Command:', emailError.command);
      console.error('  - Response:', emailError.response);
      console.error('  - Stack:', emailError.stack);

      // Return a detailed error response (remove in production)
      return res.status(500).json({
        success: false,
        message: 'Email sending failed. Please contact support.',
        details: emailError.message,  // Shows real cause (e.g., "Invalid login")
      });
    }

    // 6. Success
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
    });

  } catch (error) {
    // Catch any other unexpected errors (e.g., database issues)
    console.error('🚨 Unhandled forgot password error:', error);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Server error. Could not process your request.',
      // Remove `details` after debugging
      details: error.message,
    });
  }
};

/**
 * @desc    Reset password using token
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

    // Set new password
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