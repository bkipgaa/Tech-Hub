/**
 * Job Controller - COMPLETE WORKING VERSION
 * ==========================================
 * 
 * Handles all job-related operations:
 * - Creating jobs (clients)
 * - Fetching available jobs
 * - Searching and filtering jobs
 * - Managing client's own jobs
 * - Admin verification (approve/reject)
 * - Job CRUD operations
 */

const Job = require('../models/Job');
const User = require('../models/User');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Check if user has admin access
 */
const checkAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return false;
  }
  return true;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return id && id.match(/^[0-9a-fA-F]{24}$/);
};

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

/**
 * @desc    Get available jobs (approved, not expired)
 * @route   GET /api/jobs/available
 * @access  Public
 */
exports.getAvailableJobs = async (req, res) => {
  try {
    const {
      mainCategory,
      serviceCategory,
      subService,
      location,
      minBudget,
      maxBudget,
      isUrgent,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build base query for approved and non-expired jobs
    const query = {
      status: 'approved',
      expiresAt: { $gt: new Date() }
    };

    // Apply category filters
    if (mainCategory && mainCategory !== 'all') {
      query.mainCategory = mainCategory;
    }
    if (serviceCategory && serviceCategory !== 'all') {
      query.serviceCategory = serviceCategory;
    }
    if (subService && subService !== 'all') {
      query.subService = subService;
    }

    // Apply location filter (case-insensitive partial match)
    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' };
    }

    // Apply urgency filter
    if (isUrgent === 'true') {
      query.isUrgent = true;
    }

    // Apply budget range filter
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseInt(minBudget);
      if (maxBudget) query.budget.$lte = parseInt(maxBudget);
    }

    // Apply text search if provided
    let jobsQuery = Job.find(query);
    if (search && search.length >= 2) {
      jobsQuery = Job.find({
        $and: [
          query,
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ]
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Job.countDocuments(jobsQuery._conditions || query);

    // Execute query with pagination and sorting
    const jobs = await jobsQuery
      .sort({ isFeatured: -1, isUrgent: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('clientId', 'firstName lastName profileImage')
      .select('-__v');

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single job details by ID
 * @route   GET /api/jobs/:jobId
 * @access  Public
 */
/**
 * @desc    Get single job details by ID
 * @route   GET /api/jobs/:jobId
 * @access  Public
 */
exports.getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Let Mongoose handle validation - just try to find
    const job = await Job.findById(jobId)
      .populate('clientId', 'firstName lastName email phone profileImage')
      .populate('hiredTechnicianId', 'firstName lastName phone profileImage');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found. Please check the job ID.'
      });
    }

    // Increment view count
    job.incrementViews().catch(err => console.error('Error incrementing views:', err));

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching job details:', error);
    
    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format. ID must be a 24-character hex string.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Approve a job (admin action)
 * @route   PUT /api/jobs/admin/:jobId/approve
 * @access  Private (Admin only)
 */
exports.approveJob = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { jobId } = req.params;
    const { adminNotes } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found. Please check the job ID.'
      });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve job with status: ${job.status}. Only pending jobs can be approved.`
      });
    }

    // Approve the job
    job.status = 'approved';
    job.approvedAt = new Date();
    if (adminNotes) job.adminNotes = adminNotes;
    
    await job.save();

    res.json({
      success: true,
      message: 'Job approved successfully',
      data: {
        jobId: job._id,
        title: job.title,
        status: job.status,
        approvedAt: job.approvedAt,
        clientId: job.clientId
      }
    });

  } catch (error) {
    console.error('Error approving job:', error);
    
    // Handle Mongoose CastError
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format. ID must be a 24-character hex string.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while approving job',
      error: error.message
    });
  }
};
/**
 * @desc    Search jobs by keyword
 * @route   GET /api/jobs/search
 * @access  Public
 */
exports.searchJobs = async (req, res) => {
  try {
    const { q, category, location } = req.query;

    // Validate search query
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Please provide at least 2 characters for search'
      });
    }

    // Build search query
    const query = {
      status: 'approved',
      expiresAt: { $gt: new Date() },
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    // Apply optional filters
    if (category && category !== 'all') {
      query.mainCategory = category;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const jobs = await Job.find(query)
      .sort({ isUrgent: -1, createdAt: -1 })
      .limit(30)
      .populate('clientId', 'firstName lastName profileImage');

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// CLIENT-ONLY ROUTES
// ===========================================

/**
 * @desc    Create a new job posting (Client only)
 * @route   POST /api/jobs
 * @access  Private (Client)
 */
exports.createJob = async (req, res) => {
  try {
    console.log('Creating job for user:', req.user.userId);
    
    const {
      title,
      description,
      mainCategory,
      serviceCategory,
      subService,
      address,
      location,
      budget,
      currency = 'KES',
      pricingType = 'fixed',
      hourlyRate,
      preferredStartDate,
      isUrgent = false,
      requirements = []
    } = req.body;

    // Validate required fields
    if (!title || !description || !mainCategory || !serviceCategory || 
        !subService || !address || !location || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get client information from authenticated User
    const client = await User.findById(req.user.userId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create job object with all required fields
    const jobData = {
      clientId: req.user.userId,
      title: title.trim(),
      description: description.trim(),
      mainCategory,
      serviceCategory,
      subService,
      address: address.trim(),
      location: location.trim(),
      budget: parseFloat(budget),
      currency,
      pricingType,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      preferredStartDate: preferredStartDate && preferredStartDate !== '' 
    ? new Date(preferredStartDate) 
    : null,
      requirements: requirements || [],
      isUrgent: isUrgent === true || isUrgent === 'true',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    // Create and save job
    const job = new Job(jobData);
    await job.save();

    console.log('Job created successfully:', job._id);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully! Awaiting admin approval.',
      data: {
        jobId: job._id,
        status: job.status,
        title: job.title,
        createdAt: job.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job',
      error: error.message
    });
  }
};

/**
 * @desc    Get jobs posted by the authenticated client
 * @route   GET /api/jobs/my-jobs
 * @access  Private (Client)
 */
exports.getMyJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query for client's jobs
    const query = { clientId: req.user.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('hiredTechnicianId', 'firstName lastName email phone profileImage');

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });

  } catch (error) {
    console.error('Error fetching my jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get job statistics for client dashboard
 * @route   GET /api/jobs/stats/my
 * @access  Private (Client)
 */
exports.getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { clientId: req.user.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          avgBudget: { $avg: '$budget' }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      filled: 0,
      expired: 0,
      cancelled: 0,
      totalBudget: 0,
      averageBudget: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
      if (stat._id === 'approved' || stat._id === 'filled') {
        result.totalBudget += stat.totalBudget;
      }
      if (stat._id === 'approved') {
        result.averageBudget = stat.avgBudget;
      }
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update a job (only if status is 'pending')
 * @route   PUT /api/jobs/:jobId
 * @access  Private (Client who owns the job)
 */
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      clientId: req.user.userId,
      status: 'pending'
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or cannot be edited (only pending jobs can be edited)'
      });
    }

    const updatableFields = [
      'title', 'description', 'address', 'location', 'budget',
      'requirements', 'isUrgent', 'preferredStartDate', 'estimatedDuration',
      'pricingType', 'hourlyRate', 'referenceImages'
    ];

    let hasUpdates = false;
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
        hasUpdates = true;
      }
    });

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    job.updatedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: {
        jobId: job._id,
        status: job.status,
        title: job.title,
        updatedAt: job.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a job (only if status is 'pending')
 * @route   DELETE /api/jobs/:jobId
 * @access  Private (Client who owns the job)
 */
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findOneAndDelete({
      _id: jobId,
      clientId: req.user.userId,
      status: 'pending'
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or cannot be deleted (only pending jobs can be deleted)'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully',
      data: {
        jobId: job._id,
        title: job.title
      }
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// ADMIN ROUTES (Verification & Management)
// ===========================================

/**
 * @desc    Get all jobs (admin view)
 * @route   GET /api/jobs/admin/all
 * @access  Private (Admin only)
 */
exports.getAllJobsAdmin = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { status, page = 1, limit = 20 } = req.query;
    const query = status && status !== 'all' ? { status } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('clientId', 'firstName lastName email phone')
      .populate('hiredTechnicianId', 'firstName lastName email phone');

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });

  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all pending jobs for admin review
 * @route   GET /api/jobs/admin/pending
 * @access  Private (Admin only)
 */
exports.getPendingJobs = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { page = 1, limit = 20 } = req.query;

    const query = { status: 'pending' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Job.countDocuments(query);
    
    const jobs = await Job.find(query)
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('clientId', 'firstName lastName email phone profileImage')
      .select('-__v');

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });

  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Approve a job (admin action)
 * @route   PUT /api/jobs/admin/:jobId/approve
 * @access  Private (Admin only)
 */
exports.approveJob = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { jobId } = req.params;
    const { adminNotes } = req.body;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve job with status: ${job.status}. Only pending jobs can be approved.`
      });
    }

    // Approve the job
    job.status = 'approved';
    job.approvedAt = new Date();
    if (adminNotes) job.adminNotes = adminNotes;
    
    await job.save();

    res.json({
      success: true,
      message: 'Job approved successfully',
      data: {
        jobId: job._id,
        title: job.title,
        status: job.status,
        approvedAt: job.approvedAt,
        clientId: job.clientId
      }
    });

  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving job',
      error: error.message
    });
  }
};

/**
 * @desc    Reject a job (admin action)
 * @route   PUT /api/jobs/admin/:jobId/reject
 * @access  Private (Admin only)
 */
exports.rejectJob = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { jobId } = req.params;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject job with status: ${job.status}. Only pending jobs can be rejected.`
      });
    }

    // Reject the job
    job.status = 'rejected';
    job.rejectionReason = reason;
    if (adminNotes) job.adminNotes = adminNotes;
    
    await job.save();

    res.json({
      success: true,
      message: 'Job rejected successfully',
      data: {
        jobId: job._id,
        title: job.title,
        status: job.status,
        rejectionReason: reason,
        rejectedAt: job.updatedAt
      }
    });

  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting job',
      error: error.message
    });
  }
};

/**
 * @desc    Feature a job (paid promotion)
 * @route   PUT /api/jobs/admin/:jobId/feature
 * @access  Private (Admin only)
 */
exports.featureJob = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { jobId } = req.params;
    const { days = 7 } = req.body;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved jobs can be featured'
      });
    }

    job.isFeatured = true;
    job.featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await job.save();

    res.json({
      success: true,
      message: `Job featured for ${days} days`,
      data: {
        jobId: job._id,
        title: job.title,
        isFeatured: job.isFeatured,
        featuredUntil: job.featuredUntil
      }
    });

  } catch (error) {
    console.error('Error featuring job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk approve multiple jobs
 * @route   POST /api/jobs/admin/bulk-approve
 * @access  Private (Admin only)
 */
exports.bulkApproveJobs = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { jobIds, adminNotes } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of job IDs'
      });
    }

    const result = await Job.updateMany(
      { 
        _id: { $in: jobIds },
        status: 'pending'
      },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          adminNotes: adminNotes || ''
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} jobs approved successfully`,
      data: {
        totalRequested: jobIds.length,
        approved: result.modifiedCount,
        failed: jobIds.length - result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error bulk approving jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get job statistics for admin dashboard
 * @route   GET /api/jobs/admin/stats
 * @access  Private (Admin only)
 
exports.getAdminStats = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    // Get counts by status
    const statusStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' }
        }
      }
    ]);

    // Get individual counts
    const pendingCount = await Job.countDocuments({ status: 'pending' });
    const approvedCount = await Job.countDocuments({ status: 'approved' });
    const rejectedCount = await Job.countDocuments({ status: 'rejected' });
    const filledCount = await Job.countDocuments({ status: 'filled' });
    const expiredCount = await Job.countDocuments({ status: 'expired' });
    const cancelledCount = await Job.countDocuments({ status: 'cancelled' });
    
    // Get jobs by category
    const categoryStats = await Job.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$mainCategory',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent jobs pending approval
    const recentPending = await Job.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'firstName lastName email');

    // Get total budget
    const totalBudgetData = await Job.aggregate([
      { $match: { status: { $in: ['approved', 'filled'] } } },
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: pendingCount + approvedCount + rejectedCount + filledCount + expiredCount + cancelledCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          filled: filledCount,
          expired: expiredCount,
          cancelled: cancelledCount
        },
        byStatus: statusStats,
        byCategory: categoryStats,
        recentPending: recentPending,
        totalBudgetApproved: totalBudgetData[0]?.total || 0,
        totalBudgetPending: statusStats.find(s => s._id === 'pending')?.totalBudget || 0
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};*/

module.exports = exports;