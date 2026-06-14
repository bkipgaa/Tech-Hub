/**
 * Admin Controller
 * Manages technician verification, subscription oversight, and user management
 */

// Import User model to interact with user accounts
const User = require('../models/User');
// Import Technician model to manage technician profiles
const Technician = require('../models/Technician');
// Import Booking model to access booking statistics
const Booking = require('../models/Booking');
// Import subscription plans configuration for plan details and validation
const { subscriptionPlans } = require('../utils/subscriptionPlans');

/**
 * Get all technicians with filtering options\
 * @route GET /api/admin/technicians
 */
exports.getAllTechnicians = async (req, res) => {
  // Try-catch block to handle any errors during database operations
  try {
    // Destructure query parameters from the request with default values
    const {
      status = 'all',               // Filter by verification status (all/pending/verified/rejected)
      verificationStatus,           // Specific verification status filter
      subscriptionPlan,             // Filter by subscription plan type
      search,                       // Search term for name/email lookup
      page = 1,                     // Current page number for pagination (default: 1)
      limit = 20                    // Number of records per page (default: 20)
    } = req.query;

    // Initialize empty query object to build MongoDB filter
    let query = {};

    // Filter by verification status logic
    if (verificationStatus && verificationStatus !== 'all') {
      // If specific verification status provided and not 'all', add to query
      query.verificationStatus = verificationStatus;
    } else if (status === 'pending') {
      // If status parameter is 'pending', filter for pending verification
      query.verificationStatus = 'pending';
    } else if (status === 'verified') {
      // If status parameter is 'verified', filter for verified technicians
      query.verificationStatus = 'verified';
    } else if (status === 'rejected') {
      // If status parameter is 'rejected', filter for rejected technicians
      query.verificationStatus = 'rejected';
    }

    // Filter by subscription plan if provided and not 'all'
    if (subscriptionPlan && subscriptionPlan !== 'all') {
      // Use dot notation to access nested subscription.plan field
      query['subscription.plan'] = subscriptionPlan;
    }

    // Search functionality - find users by name or email
    if (search) {
      // Find users matching the search term in firstName, lastName, or email fields
      const users = await User.find({
        $or: [  // $or operator matches any of the following conditions
          { firstName: { $regex: search, $options: 'i' } },  // Case-insensitive firstName match
          { lastName: { $regex: search, $options: 'i' } },   // Case-insensitive lastName match
          { email: { $regex: search, $options: 'i' } }       // Case-insensitive email match
        ]
      }).select('_id');  // Only return the _id field to minimize data transfer

      // Add user IDs to query to find associated technicians
      query.userId = { $in: users.map(u => u._id) };  // $in matches any of the found user IDs
    }

    // Calculate number of documents to skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute the main query to fetch technicians with pagination
    const technicians = await Technician.find(query)  // Find technicians matching the query
      .populate('userId', 'firstName lastName email phone profileImage')  // Populate user details
      .sort({ createdAt: -1 })  // Sort by creation date, newest first (-1 = descending)
      .skip(skip)               // Skip records for pagination
      .limit(parseInt(limit));  // Limit number of records per page

    // Count total documents matching the query (without pagination)
    const total = await Technician.countDocuments(query);

    // Add subscription status information to each technician object
    const techniciansWithStatus = technicians.map(tech => {
      // Convert MongoDB document to plain JavaScript object
      const techObj = tech.toObject();
      // Add subscription status (active/inactive/expired)
      techObj.subscriptionStatus = getSubscriptionStatus(tech);
      // Add boolean flag for active subscription
      techObj.isSubscriptionActive = isSubscriptionActive(tech);
      // Add number of days remaining in subscription
      techObj.daysRemaining = getSubscriptionDaysRemaining(tech);
      // Return the enhanced technician object
      return techObj;
    });

    // Send successful JSON response with technicians data and pagination info
    res.json({
      success: true,                    // Indicate successful operation
      data: techniciansWithStatus,      // Array of technicians with enhanced data
      pagination: {                     // Pagination metadata
        page: parseInt(page),           // Current page number
        limit: parseInt(limit),         // Records per page limit
        total,                          // Total number of records
        pages: Math.ceil(total / parseInt(limit))  // Total number of pages
      }
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error fetching technicians:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single technician details for admin
 * @route GET /api/admin/technicians/:id
 */
exports.getTechnicianDetails = async (req, res) => {
  try {
    // Find technician by ID from URL parameter and populate related data
    const technician = await Technician.findById(req.params.id)  // Find by ID parameter
      .populate('userId', 'firstName lastName email phone profileImage createdAt')  // Populate user details
      .populate({  // Populate reviews with user information
        path: 'reviews',  // Field to populate
        populate: { path: 'userId', select: 'firstName lastName' }  // Nested population
      });

    // Check if technician exists, return 404 if not found
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    // Get booking statistics using MongoDB aggregation pipeline
    const bookingStats = await Booking.aggregate([
      { $match: { technicianId: technician._id } },  // Match bookings for this technician
      { $group: {  // Group bookings by status
        _id: '$status',  // Group by status field
        count: { $sum: 1 }  // Count number of bookings in each group
      }}
    ]);

    // Calculate various booking statistics from the aggregation results
    const stats = {
      // Sum all booking counts to get total bookings
      totalBookings: bookingStats.reduce((acc, curr) => acc + curr.count, 0),
      // Find completed bookings count or default to 0
      completedBookings: bookingStats.find(b => b._id === 'completed')?.count || 0,
      // Find cancelled bookings count or default to 0
      cancelledBookings: bookingStats.find(b => b._id === 'cancelled')?.count || 0,
      // Find pending bookings count or default to 0
      pendingBookings: bookingStats.find(b => b._id === 'pending')?.count || 0
    };

    // Send successful response with technician details and statistics
    res.json({
      success: true,  // Indicate successful operation
      data: {  // Combine technician data with additional info
        ...technician.toObject(),  // Convert technician to object and spread properties
        stats,  // Add booking statistics
        subscriptionStatus: getSubscriptionStatus(technician),  // Add subscription status
        isSubscriptionActive: isSubscriptionActive(technician),  // Add active flag
        daysRemaining: getSubscriptionDaysRemaining(technician)  // Add days remaining
      }
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error fetching technician details:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify a technician
 * @route PUT /api/admin/technicians/:id/verify
 */
exports.verifyTechnician = async (req, res) => {
  try {
    // Extract remarks from request body
    const { remarks } = req.body;
    
    // Find technician by ID from URL parameter
    const technician = await Technician.findById(req.params.id);
    // Check if technician exists, return 404 if not found
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    // Update technician verification fields
    technician.verificationStatus = 'verified';  // Set status to verified
    technician.verifiedAt = new Date();  // Set current timestamp for verification
    technician.verifiedBy = req.user.userId;  // Store ID of admin who verified
    technician.verificationRemarks = remarks || 'Technician verified by admin';  // Add remarks or default

    // Save the updated technician document to database
    await technician.save();

    // Update the associated user's role to technician
    await User.findByIdAndUpdate(technician.userId, {
      role: 'technician'  // Set user role as technician
    });

    // Send success response with verified technician data
    res.json({
      success: true,  // Indicate successful operation
      message: 'Technician verified successfully',  // Success message
      data: technician  // Return updated technician object
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error verifying technician:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject a technician's verification
 * @route PUT /api/admin/technicians/:id/reject
 */
exports.rejectTechnician = async (req, res) => {
  try {
    // Extract rejection reason from request body
    const { reason } = req.body;
    
    // Validate that rejection reason is provided
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Find technician by ID from URL parameter
    const technician = await Technician.findById(req.params.id);
    // Check if technician exists, return 404 if not found
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    // Update technician verification fields for rejection
    technician.verificationStatus = 'rejected';  // Set status to rejected
    technician.verificationRemarks = reason;  // Store rejection reason as remarks
    technician.rejectedAt = new Date();  // Set current timestamp for rejection
    technician.rejectedBy = req.user.userId;  // Store ID of admin who rejected

    // Save the updated technician document to database
    await technician.save();

    // Send success response with rejected technician data
    res.json({
      success: true,  // Indicate successful operation
      message: 'Technician verification rejected',  // Success message
      data: technician  // Return updated technician object
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error rejecting technician:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get subscription statistics
 * @route GET /api/admin/subscription/stats
 */
exports.getSubscriptionStats = async (req, res) => {
  try {
    // Aggregate subscription statistics by plan type
    const stats = await Technician.aggregate([
      {
        $group: {  // Group technicians by subscription plan
          _id: '$subscription.plan',  // Group by plan field
          count: { $sum: 1 },  // Count total technicians per plan
          activeSubscriptions: {  // Count active subscriptions per plan
            $sum: {
              $cond: [  // Conditional sum based on active status
                {
                  $or: [  // Technician is active if either condition is true
                    { $eq: ['$subscription.plan', 'free'] },  // Free plan always active
                    { $gt: ['$subscription.endDate', new Date()] }  // Paid plan not expired
                  ]
                },
                1,  // Add 1 if condition is true
                0   // Add 0 if condition is false
              ]
            }
          }
        }
      }
    ]);

    // Count total number of technician documents
    const totalTechnicians = await Technician.countDocuments();
    // Count verified technicians
    const verifiedTechnicians = await Technician.countDocuments({ verificationStatus: 'verified' });
    // Count technicians pending verification
    const pendingVerification = await Technician.countDocuments({ verificationStatus: 'pending' });

    // Send success response with subscription statistics
    res.json({
      success: true,  // Indicate successful operation
      data: {  // Object containing all statistics
        totalTechnicians,        // Total technician count
        verifiedTechnicians,     // Count of verified technicians
        pendingVerification,     // Count of pending verification
        subscriptionBreakdown: stats  // Detailed breakdown by plan
      }
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error fetching subscription stats:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manually update technician subscription (admin override)
 * @route PUT /api/admin/technicians/:id/subscription
 */
exports.updateSubscription = async (req, res) => {
  try {
    // Destructure subscription parameters from request body
    const { planId, durationDays, isTrial } = req.body;
    
    // Find technician by ID from URL parameter
    const technician = await Technician.findById(req.params.id);
    // Check if technician exists, return 404 if not found
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    // Get plan details from subscription plans configuration
    const plan = subscriptionPlans[planId];
    // Validate that the plan exists in configuration
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // Calculate end date based on duration (default 30 days)
    const endDate = new Date();  // Start from current date
    endDate.setDate(endDate.getDate() + (durationDays || 30));  // Add duration days

    // Update technician's subscription object with new plan details
    technician.subscription = {
      plan: planId,  // Set the plan ID
      planDetails: {  // Store plan details for historical reference
        name: plan.name,  // Plan display name
        visibilityRadius: plan.visibilityRadius,  // Visibility radius in km
        price: plan.price,  // Plan price
        features: plan.features  // Array of plan features
      },
      startDate: new Date(),  // Set subscription start date to now
      endDate: planId !== 'free' ? endDate : null,  // Set end date (null for free plan)
      isTrial: isTrial || false,  // Set trial flag (default false)
      autoRenew: false,  // Auto-renewal disabled by default for admin overrides
      adminOverride: true,  // Flag indicating this is an admin override
      adminOverrideBy: req.user.userId,  // Store ID of admin who made the change
      adminOverrideAt: new Date()  // Timestamp of the override
    };

    // Update technician's service radius to match plan's visibility radius
    technician.serviceRadius = plan.visibilityRadius;
    // Save the updated technician document to database
    await technician.save();

    // Send success response with updated subscription data
    res.json({
      success: true,  // Indicate successful operation
      message: `Subscription updated to ${plan.name} plan`,  // Success message with plan name
      data: technician.subscription  // Return updated subscription object
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error updating subscription:', error);
    // Send error response with 500 status code
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper function to determine subscription status
 * @param {Object} technician - Technician document object
 * @returns {string} Status: 'active', 'inactive', or 'expired'
 */
function getSubscriptionStatus(technician) {
  // Return 'inactive' if technician has no subscription object
  if (!technician.subscription) return 'inactive';
  // Free plan is always considered active
  if (technician.subscription.plan === 'free') return 'active';
  // Handle trial subscription status
  if (technician.subscription.isTrial && technician.subscription.trialEndDate) {
    // Check if trial end date is in the future
    return new Date() < new Date(technician.subscription.trialEndDate) ? 'active' : 'expired';
  }
  // Handle paid subscription status
  if (technician.subscription.endDate) {
    // Check if subscription end date is in the future
    return new Date() < new Date(technician.subscription.endDate) ? 'active' : 'expired';
  }
  // Default to inactive if no conditions match
  return 'inactive';
}

/**
 * Helper function to check if subscription is active
 * @param {Object} technician - Technician document object
 * @returns {boolean} True if subscription is active, false otherwise
 */
function isSubscriptionActive(technician) {
  // Return boolean based on subscription status
  return getSubscriptionStatus(technician) === 'active';
}

/**
 * Helper function to calculate days remaining in subscription
 * @param {Object} technician - Technician document object
 * @returns {number} Days remaining (-1 for free plan, 0 for expired, positive number for active)
 */
function getSubscriptionDaysRemaining(technician) {
  // Return 0 if technician has no subscription
  if (!technician.subscription) return 0;
  // Return -1 for free plan (no expiration)
  if (technician.subscription.plan === 'free') return -1;
  
  // Determine which end date to use (trial or paid subscription)
  const endDate = technician.subscription.isTrial 
    ? technician.subscription.trialEndDate   // Use trial end date for trial subscriptions
    : technician.subscription.endDate;       // Use regular end date for paid subscriptions
    
  // Return 0 if no end date is set
  if (!endDate) return 0;
  
  // Calculate days remaining (ceil ensures we show whole days)
  const daysRemaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  // Return 0 if days remaining is negative (expired), otherwise return positive number
  return daysRemaining > 0 ? daysRemaining : 0;
}

// Export helper functions for use in other modules
exports.getSubscriptionStatus = getSubscriptionStatus;
exports.isSubscriptionActive = isSubscriptionActive;