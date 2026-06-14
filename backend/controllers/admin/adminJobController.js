/**
 * ADMIN JOB CONTROLLER
 * ====================
 * 
 * PURPOSE:
 * This controller handles ALL admin-level operations for job management.
 * It's separate from the regular jobController to maintain clean code
 * separation and better security (admin-only functions).
 * 
 * WHAT IT DOES:
 * - View all jobs with advanced filtering (by status, category, date, etc.)
 * - Approve or reject pending job postings
 * - Feature/unfeature jobs for paid promotion
 * - Bulk operations (approve/reject multiple jobs at once)
 * - Generate analytics and statistics for dashboard
 * - Export job data to CSV/JSON
 * 
 * ACCESS CONTROL:
 * All functions in this controller require admin authentication.
 * Regular users cannot access these endpoints.
 * 
 * DEPENDENCIES:
 * - Job model for database operations
 * - User model for client/technician information
 * - MongoDB ObjectId validation
 */

const Job = require('../../models/Job');      // Job schema/model
const User = require('../../models/User');    // User model for populating client/tech data

// ===========================================
// HELPER FUNCTIONS (Internal utilities)
// ===========================================

/**
 * Validates if a string is a proper MongoDB ObjectId
 * 
 * WHY: MongoDB ObjectIds have a specific format (24 hex characters)
 * This prevents database errors when invalid IDs are provided
 * 
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId format, false otherwise
 * 
 * EXAMPLE USAGE:
 * isValidObjectId('507f1f77bcf86cd799439011') // returns true
 * isValidObjectId('invalid-id')               // returns false
 */
const isValidObjectId = (id) => {
  return id && id.match(/^[0-9a-fA-F]{24}$/);
};

/**
 * Formats a job document for API response
 * 
 * WHY: Mongoose documents have virtual fields and methods.
 * Converting to plain object and adding computed fields makes
 * the response cleaner and more useful for the frontend.
 * 
 * @param {Object} job - Mongoose job document
 * @returns {Object} - Formatted job object with virtual fields
 * 
 * EXAMPLE OUTPUT:
 * {
 *   _id: '...',
 *   title: 'Need Electrician',
 *   totalCost: 5500,    // budget + urgencyFee
 *   isOpen: true,        // status === 'approved' && not expired
 *   ...rest of fields
 * }
 */
const formatJobResponse = (job) => {
  const jobObj = job.toObject();  // Convert Mongoose doc to plain JS object
  return {
    ...jobObj,
    totalCost: job.totalCost,      // Virtual field from schema
    isOpen: job.isOpen              // Virtual field from schema
  };
};

// ===========================================
// JOB MANAGEMENT (Viewing & Listing)
// ===========================================

/**
 * GET /api/admin/jobs
 * 
 * PURPOSE:
 * Fetch all jobs with advanced filtering options for admin view.
 * This is the main endpoint for the admin jobs management page.
 * 
 * WHAT IT DOES:
 * - Applies multiple filters (status, category, location, dates, etc.)
 * - Supports pagination for large datasets
 * - Sorts results by any field
 * - Populates related data (client, technician, booking)
 * 
 * QUERY PARAMETERS (All optional):
 * - status: Filter by job status (pending, approved, rejected, filled, expired, cancelled, all)
 * - mainCategory: Filter by main service category
 * - serviceCategory: Filter by sub-category
 * - location: Search by city/location (partial match, case-insensitive)
 * - clientId: Filter jobs from specific client
 * - technicianId: Filter jobs assigned to specific technician
 * - isUrgent: Filter urgent jobs (true/false)
 * - isFeatured: Filter featured jobs (true/false)
 * - startDate: Filter jobs created after this date (ISO format)
 * - endDate: Filter jobs created before this date (ISO format)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: Sort direction - 'asc' or 'desc' (default: desc)
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   count: 20,           // Number of jobs in this page
 *   total: 150,          // Total jobs matching filters
 *   page: 1,
 *   totalPages: 8,
 *   data: [...]          // Array of job objects with populated relations
 * }
 */
exports.getAllJobs = async (req, res) => {
  try {
    // Extract all filter parameters from the request query string
    const {
      status,               // Job status filter
      mainCategory,         // Main service category
      serviceCategory,      // Sub-category
      location,             // City/location search
      clientId,             // Specific client's jobs
      technicianId,         // Specific technician's jobs
      isUrgent,             // Urgent flag
      isFeatured,           // Featured flag
      startDate,            // Date range start
      endDate,              // Date range end
      page = 1,             // Current page (default 1)
      limit = 20,           // Items per page (default 20)
      sortBy = 'createdAt', // Sort field (default creation date)
      sortOrder = 'desc'    // Sort order (default newest first)
    } = req.query;

    // Initialize empty query object - we'll add filters as needed
    const query = {};

    // ===========================================
    // APPLY FILTERS (Only add if parameter exists)
    // ===========================================
    
    // Filter by job status (if provided and not 'all')
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by main category (e.g., 'Electrical Services', 'Plumbing')
    if (mainCategory && mainCategory !== 'all') {
      query.mainCategory = mainCategory;
    }
    
    // Filter by service category (e.g., 'Residential Wiring')
    if (serviceCategory && serviceCategory !== 'all') {
      query.serviceCategory = serviceCategory;
    }
    
    // Filter by location - uses regex for case-insensitive partial matching
    // Example: 'Nairobi' will match 'Nairobi', 'NAIROBI', 'Nairobi West'
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by specific client (using their MongoDB ObjectId)
    if (clientId && isValidObjectId(clientId)) {
      query.clientId = clientId;
    }
    
    // Filter by hired technician (if job has been assigned)
    if (technicianId && isValidObjectId(technicianId)) {
      query.hiredTechnicianId = technicianId;
    }
    
    // Filter urgent jobs (true/false)
    if (isUrgent === 'true') {
      query.isUrgent = true;
    }
    
    // Filter featured jobs (true/false)
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    
    // Date range filtering - useful for "last 30 days" reports
    if (startDate || endDate) {
      query.createdAt = {};  // Create nested object for date operators
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);  // Greater than or equal
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);    // Less than or equal
      }
    }

    // ===========================================
    // PAGINATION & SORTING
    // ===========================================
    
    // Calculate how many documents to skip based on current page
    // Example: page 2 with limit 20 -> skip 20 documents
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object: { fieldName: -1 } for descending, 1 for ascending
    // -1 means newest first, 1 means oldest first
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // ===========================================
    // EXECUTE DATABASE QUERIES
    // ===========================================
    
    // First query: Get total count for pagination (without limit/skip)
    const total = await Job.countDocuments(query);
    
    // Second query: Get the actual jobs with pagination and sorting
    const jobs = await Job.find(query)
      .sort(sortOptions)                              // Apply sorting
      .skip(skip)                                     // Skip for pagination
      .limit(parseInt(limit))                         // Limit per page
      .populate('clientId', 'firstName lastName email phone profileImage')  // Get client details
      .populate('hiredTechnicianId', 'firstName lastName email phone profileImage')  // Get tech details
      .populate('resultingBookingId', 'status bookingDate totalAmount');    // Get booking if exists

    // Send success response with formatted data
    res.json({
      success: true,
      count: jobs.length,                    // Jobs in this page
      total,                                 // Total matching jobs
      page: parseInt(page),                  // Current page number
      totalPages: Math.ceil(total / parseInt(limit)),  // Total pages available
      data: jobs.map(formatJobResponse)      // Format each job before sending
    });

  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/jobs/pending
 * 
 * PURPOSE:
 * Get all jobs that are waiting for admin approval.
 * This is the main endpoint for the "Verify Jobs" page in admin dashboard.
 * 
 * WHAT IT DOES:
 * - Only returns jobs with status = 'pending'
 * - Sorts oldest first (FIFO - first in, first out)
 * - Populates client information for contact
 * - Supports pagination for large queues
 * 
 * WHY OLDEST FIRST:
 * Fairness - jobs that have been waiting longer should be reviewed first.
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: Sort direction (default: asc - oldest first)
 * 
 * RESPONSE:
 * Same structure as getAllJobs but only pending jobs
 */
exports.getPendingJobs = async (req, res) => {
  try {
    // Get pagination parameters with defaults
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',    // Sort by creation date by default
      sortOrder = 'asc'        // Ascending = oldest first (fair review queue)
    } = req.query;

    // Query for pending jobs only
    const query = { status: 'pending' };
    
    // Calculate pagination skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object (ascending = 1 for oldest first)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Get total count of pending jobs for pagination
    const total = await Job.countDocuments(query);
    
    // Fetch pending jobs with client information populated
    const jobs = await Job.find(query)
      .sort(sortOptions)                           // Sort as configured
      .skip(skip)                                  // Skip for pagination
      .limit(parseInt(limit))                      // Limit per page
      .populate('clientId', 'firstName lastName email phone profileImage')  // Get client contact info
      .select('-__v');                             // Exclude version field for cleaner response

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
 * GET /api/admin/jobs/:jobId
 * 
 * PURPOSE:
 * Get detailed information about a single job for admin review.
 * This provides more comprehensive data than the public job details endpoint.
 * 
 * WHAT IT DOES:
 * - Fetches complete job information
 * - Populates client details (including address)
 * - Populates technician details (if hired)
 * - Populates booking information (if exists)
 * - Adds application statistics
 * 
 * WHY ADMIN NEEDS MORE DETAILS:
 * - Need client contact info for follow-up
 * - Need to see if job already has a booking
 * - Need application statistics for decision making
 * 
 * URL PARAMETERS:
 * - jobId: MongoDB ObjectId of the job
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     // All job fields plus:
 *     totalCost: number,
 *     isOpen: boolean,
 *     applicationStats: {
 *       total: number,
 *       // More stats can be added later
 *     }
 *   }
 * }
 */
exports.getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Validate that the jobId is a proper MongoDB ObjectId
    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format. ID must be a 24-character hex string.'
      });
    }

    // Fetch job with all related data populated
    const job = await Job.findById(jobId)
      .populate('clientId', 'firstName lastName email phone profileImage address createdAt')  // Client with address
      .populate('hiredTechnicianId', 'firstName lastName email phone profileImage')           // Tech if hired
      .populate('resultingBookingId', 'status bookingDate totalAmount');                      // Booking if exists

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found. Please check the job ID.'
      });
    }

    // Add application statistics (currently just the count from job)
    // This can be expanded later when you implement applications system
    const applicationStats = {
      total: job.applicationCount || 0,
      // Future: add pending/approved/rejected counts
    };

    // Send response with formatted job and additional stats
    res.json({
      success: true,
      data: {
        ...formatJobResponse(job),  // Spread formatted job fields
        applicationStats             // Add application statistics
      }
    });

  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job details',
      error: error.message
    });
  }
};

// ===========================================
// JOB VERIFICATION (Approve/Reject)
// ===========================================

/**
 * PUT /api/admin/jobs/:jobId/approve
 * 
 * PURPOSE:
 * Approve a pending job posting, making it visible to technicians.
 * This is a critical action that determines which jobs go live on the platform.
 * 
 * WHAT IT DOES:
 * - Changes job status from 'pending' to 'approved'
 * - Records approval timestamp
 * - Stores admin notes for audit trail
 * - Records which admin approved the job
 * - Can optionally send notification to client (future feature)
 * 
 * VALIDATION:
 * - Job must exist
 * - Job must be in 'pending' status (can't approve already approved/rejected jobs)
 * 
 * URL PARAMETERS:
 * - jobId: MongoDB ObjectId of the job to approve
 * 
 * REQUEST BODY:
 * - adminNotes (optional): Internal notes for admin reference
 * - sendNotification (optional, default: true): Whether to email client
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: "Job approved successfully",
 *   data: {
 *     jobId: "...",
 *     title: "Job Title",
 *     status: "approved",
 *     approvedAt: "2024-01-01T00:00:00.000Z",
 *     client: { id, email, name }
 *   }
 * }
 */
exports.approveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { adminNotes, sendNotification = true } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format. ID must be a 24-character hex string.'
      });
    }

    // Find the job and populate client info for notification
    const job = await Job.findById(jobId).populate('clientId', 'email firstName lastName');

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found. Please check the job ID.'
      });
    }

    // Verify job is in pending status
    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve job with status: ${job.status}. Only pending jobs can be approved.`
      });
    }

    // ===========================================
    // UPDATE JOB WITH APPROVAL INFORMATION
    // ===========================================
    job.status = 'approved';                    // Change status to approved
    job.approvedAt = new Date();                // Record approval timestamp
    job.approvedBy = req.user.userId;           // Track which admin approved (from auth middleware)
    if (adminNotes) job.adminNotes = adminNotes; // Add admin notes if provided
    
    // Save changes to database
    await job.save();

    // TODO: Send notification email to client
    // This will be implemented when email service is added
    // if (sendNotification) {
    //   await notificationService.sendJobApprovedNotification(job);
    // }

    // Send success response with job details
    res.json({
      success: true,
      message: 'Job approved successfully',
      data: {
        jobId: job._id,
        title: job.title,
        status: job.status,
        approvedAt: job.approvedAt,
        client: {
          id: job.clientId._id,
          email: job.clientId.email,
          name: `${job.clientId.firstName} ${job.clientId.lastName}`
        }
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
 * PUT /api/admin/jobs/:jobId/reject
 * 
 * PURPOSE:
 * Reject a pending job posting with a reason.
 * This helps clients understand why their job wasn't approved and how to fix it.
 * 
 * WHAT IT DOES:
 * - Changes job status from 'pending' to 'rejected'
 * - Records rejection reason (required for client feedback)
 * - Stores admin notes for internal reference
 * - Tracks which admin rejected and when
 * - Can optionally send rejection reason to client (future feature)
 * 
 * VALIDATION:
 * - Job must exist
 * - Job must be in 'pending' status
 * - Rejection reason is REQUIRED (helps client understand why)
 * 
 * URL PARAMETERS:
 * - jobId: MongoDB ObjectId of the job to reject
 * 
 * REQUEST BODY:
 * - reason (required): Reason for rejection (shown to client)
 * - adminNotes (optional): Internal notes
 * - sendNotification (optional): Whether to email client
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: "Job rejected successfully",
 *   data: {
 *     jobId: "...",
 *     title: "Job Title",
 *     status: "rejected",
 *     rejectionReason: "Insufficient details",
 *     rejectedAt: "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
exports.rejectJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason, adminNotes, sendNotification = true } = req.body;

    // Validate that rejection reason is provided (required for client feedback)
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required. Please explain why the job is being rejected.'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format. ID must be a 24-character hex string.'
      });
    }

    // Find job and populate client info for notification
    const job = await Job.findById(jobId).populate('clientId', 'email firstName lastName');

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found. Please check the job ID.'
      });
    }

    // Verify job is in pending status
    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject job with status: ${job.status}. Only pending jobs can be rejected.`
      });
    }

    // ===========================================
    // UPDATE JOB WITH REJECTION INFORMATION
    // ===========================================
    job.status = 'rejected';                    // Change status to rejected
    job.rejectionReason = reason;               // Store reason for client
    job.rejectedBy = req.user.userId;           // Track which admin rejected
    job.rejectedAt = new Date();                // Record rejection timestamp
    if (adminNotes) job.adminNotes = adminNotes; // Add admin notes if provided
    
    // Save changes to database
    await job.save();

    // TODO: Send rejection notification email to client
    // This will be implemented when email service is added
    // if (sendNotification) {
    //   await notificationService.sendJobRejectedNotification(job, reason);
    // }

    // Send success response with rejection details
    res.json({
      success: true,
      message: 'Job rejected successfully',
      data: {
        jobId: job._id,
        title: job.title,
        status: job.status,
        rejectionReason: reason,
        rejectedAt: job.rejectedAt,
        client: {
          id: job.clientId._id,
          email: job.clientId.email
        }
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
 * POST /api/admin/jobs/bulk-approve
 * 
 * PURPOSE:
 * Approve multiple jobs at once to save time when there's a queue of good jobs.
 * 
 * WHAT IT DOES:
 * - Approves all pending jobs in the provided ID list
 * - Only approves jobs that are currently pending
 * - Ignores jobs that are already approved/rejected
 * - Tracks success/failure counts
 * 
 * WHEN TO USE:
 * - After reviewing multiple jobs and finding them all acceptable
 * - When a trusted client posts multiple jobs
 * - During low-traffic periods to clear the queue quickly
 * 
 * REQUEST BODY:
 * - jobIds (required): Array of job ObjectIds to approve
 * - adminNotes (optional): Notes to add to all approved jobs
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: "15 jobs approved successfully",
 *   data: {
 *     totalRequested: 15,
 *     approved: 15,
 *     failed: 0
 *   }
 * }
 */
exports.bulkApproveJobs = async (req, res) => {
  try {
    const { jobIds, adminNotes } = req.body;

    // Validate that jobIds array is provided and not empty
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of job IDs to approve'
      });
    }

    // Validate each ID in the array has correct format
    const invalidIds = jobIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid job ID format in: ${invalidIds.join(', ')}. IDs must be 24-character hex strings.`
      });
    }

    // Perform bulk update - only update jobs that are currently 'pending'
    // This prevents accidentally re-approving already approved jobs
    const result = await Job.updateMany(
      { 
        _id: { $in: jobIds },    // Match any job in the array
        status: 'pending'         // Only update pending jobs
      },
      {
        $set: {
          status: 'approved',                      // Set status to approved
          approvedAt: new Date(),                  // Timestamp for all
          approvedBy: req.user.userId,             // Track admin who performed bulk action
          adminNotes: adminNotes || 'Bulk approved by admin'  // Add notes
        }
      }
    );

    // Send response with statistics about the operation
    res.json({
      success: true,
      message: `${result.modifiedCount} jobs approved successfully`,
      data: {
        totalRequested: jobIds.length,                     // How many were requested
        approved: result.modifiedCount,                    // How many were actually approved
        failed: jobIds.length - result.modifiedCount,      // How many failed (already not pending)
        failedIds: result.modifiedCount < jobIds.length ?   // If some failed, list them
          jobIds.filter(id => !result.modifiedCount) : []
      }
    });

  } catch (error) {
    console.error('Error bulk approving jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk approving jobs',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/jobs/bulk-reject
 * 
 * PURPOSE:
 * Reject multiple jobs at once with a common reason.
 * Useful for rejecting spam or clearly inappropriate jobs.
 * 
 * WHAT IT DOES:
 * - Rejects all pending jobs in the provided ID list
 * - Applies the same rejection reason to all
 * - Records admin who performed the bulk action
 * 
 * WARNING:
 * Use with caution! Rejection is final (though client can resubmit).
 * Always provide a clear reason so clients know how to fix their posts.
 * 
 * REQUEST BODY:
 * - jobIds (required): Array of job ObjectIds to reject
 * - reason (required): Common rejection reason for all jobs
 * - adminNotes (optional): Internal notes
 * 
 * RESPONSE:
 * Same structure as bulkApproveJobs
 */
exports.bulkRejectJobs = async (req, res) => {
  try {
    const { jobIds, reason, adminNotes } = req.body;

    // Validate jobIds array
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of job IDs to reject'
      });
    }

    // Validate rejection reason is provided (important for client feedback)
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required for bulk reject. Provide a reason that applies to all selected jobs.'
      });
    }

    // Perform bulk update
    const result = await Job.updateMany(
      { 
        _id: { $in: jobIds },
        status: 'pending'          // Only reject pending jobs
      },
      {
        $set: {
          status: 'rejected',                      // Set status to rejected
          rejectionReason: reason,                 // Common reason for all
          rejectedBy: req.user.userId,             // Track admin
          rejectedAt: new Date(),                  // Timestamp
          adminNotes: adminNotes || `Bulk rejected: ${reason}`  // Add notes with reason
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} jobs rejected successfully`,
      data: {
        totalRequested: jobIds.length,
        rejected: result.modifiedCount,
        failed: jobIds.length - result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error bulk rejecting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// JOB PROMOTION (Feature/Unfeature)
// ===========================================

/**
 * PUT /api/admin/jobs/:jobId/feature
 * 
 * PURPOSE:
 * Feature a job to make it appear at the top of search results.
 * This is typically a paid service, but admins can also feature jobs manually.
 * 
 * WHAT IT DOES:
 * - Sets isFeatured flag to true
 * - Sets expiration date for the feature (e.g., 7 days from now)
 * - Records when it was featured and by whom
 * - Stores the price paid (for financial tracking)
 * 
 * FEATURED JOBS BEHAVIOR:
 * - Appear first in search results (sorted by isFeatured: -1)
 * - Have a visual "Featured" badge
 * - Get more visibility and applications
 * - Automatically expire after the duration
 * 
 * URL PARAMETERS:
 * - jobId: MongoDB ObjectId of the job to feature
 * 
 * REQUEST BODY:
 * - days (optional, default: 7): How many days to feature the job
 * - featurePrice (optional, default: 0): Amount paid for featuring (for tracking)
 * 
 * VALIDATION:
 * - Job must exist
 * - Job must be approved (can't feature pending or rejected jobs)
 */
exports.featureJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { days = 7, featurePrice = 0 } = req.body;

    // Validate ObjectId
    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    // Find the job
    const job = await Job.findById(jobId);

    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Only approved jobs can be featured
    // This ensures we don't feature jobs that aren't live
    if (job.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Only approved jobs can be featured. Current status: ${job.status}`
      });
    }

    // Calculate expiration date (current date + days)
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    // Update job with feature information
    job.isFeatured = true;                     // Enable featured flag
    job.featuredUntil = featuredUntil;         // Set expiration date
    job.featuredAt = new Date();               // Record when featured
    job.featuredBy = req.user.userId;          // Track which admin featured it
    job.featurePrice = featurePrice;           // Store price for accounting
    
    await job.save();

    res.json({
      success: true,
      message: `Job featured for ${days} days (until ${featuredUntil.toLocaleDateString()})`,
      data: {
        jobId: job._id,
        title: job.title,
        isFeatured: job.isFeatured,
        featuredUntil: job.featuredUntil,
        featuredAt: job.featuredAt,
        featurePrice: job.featurePrice
      }
    });

  } catch (error) {
    console.error('Error featuring job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while featuring job',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/jobs/:jobId/unfeature
 * 
 * PURPOSE:
 * Remove featured status from a job.
 * This can be done manually by admin or automatically when feature expires.
 * 
 * WHAT IT DOES:
 * - Sets isFeatured flag to false
 * - Clears featuredUntil date
 * - Records when it was unfeatured and by whom
 * 
 * WHEN TO USE:
 * - Job feature expired (automatic via cron job)
 * - Client requested to remove featured status
 * - Admin decision to stop promoting a job
 */
exports.unfeatureJob = async (req, res) => {
  try {
    const { jobId } = req.params;

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

    // Remove featured status
    job.isFeatured = false;
    job.featuredUntil = null;
    job.unfeaturedAt = new Date();        // Record when unfeatured
    job.unfeaturedBy = req.user.userId;   // Track who removed feature
    
    await job.save();

    res.json({
      success: true,
      message: 'Job unfeatured successfully',
      data: {
        jobId: job._id,
        title: job.title,
        isFeatured: job.isFeatured
      }
    });

  } catch (error) {
    console.error('Error unfeaturing job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// JOB ANALYTICS & STATISTICS
// ===========================================

/**
 * GET /api/admin/jobs/stats
 * 
 * PURPOSE:
 * Provide comprehensive statistics for the admin dashboard.
 * This is the main data source for charts, KPIs, and reports.
 * 
 * WHAT IT RETURNS:
 * 1. OVERVIEW: Total counts by status (pending, approved, rejected, etc.)
 * 2. BY STATUS: Detailed breakdown with budget totals
 * 3. BY CATEGORY: Top 10 categories by job count
 * 4. BY LOCATION: Top 10 cities by job count
 * 5. DAILY POSTINGS: Trend data for last 30 days
 * 6. RECENT JOBS: Latest pending and approved jobs
 * 7. BUDGET STATS: Total approved/pending budget, averages
 * 8. PERFORMANCE METRICS: Approval time, approval rate, fill rate
 * 
 * This endpoint uses MongoDB Aggregation Pipeline for efficient data processing.
 * Aggregation is faster than multiple separate queries.
 * 
 * USAGE:
 * Called when admin dashboard loads to populate all statistics cards and charts.
 */
exports.getJobStats = async (req, res) => {
  try {
    // ===========================================
    // 1. STATUS BREAKDOWN (using aggregation)
    // ===========================================
    // Groups all jobs by their status and calculates:
    // - count: number of jobs with that status
    // - totalBudget: sum of all budgets for that status
    // - avgBudget: average budget for that status
    const statusStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',                    // Group by status field
          count: { $sum: 1 },                // Count documents in each group
          totalBudget: { $sum: '$budget' },  // Sum budgets
          avgBudget: { $avg: '$budget' }     // Average budget
        }
      }
    ]);

    // ===========================================
    // 2. INDIVIDUAL COUNTS (for quick access)
    // ===========================================
    // Using countDocuments is faster than aggregation for simple counts
    const pendingCount = await Job.countDocuments({ status: 'pending' });
    const approvedCount = await Job.countDocuments({ status: 'approved' });
    const rejectedCount = await Job.countDocuments({ status: 'rejected' });
    const filledCount = await Job.countDocuments({ status: 'filled' });
    const expiredCount = await Job.countDocuments({ status: 'expired' });
    const cancelledCount = await Job.countDocuments({ status: 'cancelled' });
    const draftCount = await Job.countDocuments({ status: 'draft' });
    
    // ===========================================
    // 3. CATEGORY BREAKDOWN (Top 10)
    // ===========================================
    // Shows which service categories are most popular
    // Useful for marketing and platform development decisions
    const categoryStats = await Job.aggregate([
      { $match: { status: 'approved' } },                    // Only approved jobs
      {
        $group: {
          _id: '$mainCategory',                               // Group by category
          count: { $sum: 1 },                                 // Count jobs
          totalBudget: { $sum: '$budget' }                    // Sum budgets
        }
      },
      { $sort: { count: -1 } },                              // Sort by count descending
      { $limit: 10 }                                          // Get top 10 categories
    ]);

    // ===========================================
    // 4. LOCATION BREAKDOWN (Top 10)
    // ===========================================
    // Shows which cities have the most job postings
    // Helps identify markets with high demand
    const locationStats = await Job.aggregate([
      { $match: { status: 'approved' } },                    // Only approved jobs
      {
        $group: {
          _id: '$location',                                   // Group by city/location
          count: { $sum: 1 }                                 // Count jobs
        }
      },
      { $sort: { count: -1 } },                              // Sort by count descending
      { $limit: 10 }                                          // Get top 10 locations
    ]);

    // ===========================================
    // 5. DAILY POSTING TREND (Last 30 days)
    // ===========================================
    // Calculates date 30 days ago from now
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregation to count jobs created each day
    // Results are grouped by date and status for detailed trend analysis
    const dailyStats = await Job.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },    // Last 30 days only
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },  // Format date as YYYY-MM-DD
            status: '$status'                                                      // Include status
          },
          count: { $sum: 1 }                                 // Count jobs per day per status
        }
      },
      { $sort: { '_id.date': 1 } }                           // Sort by date ascending
    ]);

    // ===========================================
    // 6. RECENT JOBS (For "Recent Activity" section)
    // ===========================================
    // Get most recent pending jobs (need attention)
    const recentPending = await Job.find({ status: 'pending' })
      .sort({ createdAt: -1 })                               // Newest first
      .limit(10)                                              // Only 10 most recent
      .populate('clientId', 'firstName lastName email');     // Include client names

    // Get most recently approved jobs (recently went live)
    const recentApproved = await Job.find({ status: 'approved' })
      .sort({ approvedAt: -1 })                              // Sort by approval date
      .limit(10)                                              // Only 10 most recent
      .populate('clientId', 'firstName lastName');          // Include client names

    // ===========================================
    // 7. BUDGET STATISTICS
    // ===========================================
    // Calculate total and average budgets for different statuses
    const budgetStats = await Job.aggregate([
      {
        $group: {
          _id: null,                                          // Group all documents together
          totalApprovedBudget: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'filled']] }, '$budget', 0]  // Sum if approved or filled
            }
          },
          totalPendingBudget: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$budget', 0]  // Sum if pending
            }
          },
          avgApprovedBudget: {
            $avg: {
              $cond: [{ $in: ['$status', ['approved', 'filled']] }, '$budget', null]  // Average if approved
            }
          }
        }
      }
    ]);

    // ===========================================
    // 8. PERFORMANCE METRICS
    // ===========================================
    // Calculate average time to approve/reject a job
    const approvalTimeStats = await Job.aggregate([
      { 
        $match: { 
          status: { $in: ['approved', 'rejected'] },  // Only completed reviews
          approvedAt: { $exists: true }                // Must have approval/rejection date
        } 
      },
      {
        $project: {
          // Calculate difference between creation and approval in milliseconds
          approvalTime: { $subtract: ['$approvedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgApprovalTimeMs: { $avg: '$approvalTime' }  // Average in milliseconds
        }
      }
    ]);

    // Convert milliseconds to hours for human-readable format
    const avgApprovalHours = approvalTimeStats[0]?.avgApprovalTimeMs 
      ? Math.round(approvalTimeStats[0].avgApprovalTimeMs / (1000 * 60 * 60))
      : 0;

    // Calculate approval rate (percentage of reviewed jobs that were approved)
    const totalReviewed = approvedCount + rejectedCount;
    const approvalRate = totalReviewed > 0 
      ? ((approvedCount / totalReviewed) * 100).toFixed(1)  // One decimal place
      : 0;

    // Calculate fill rate (percentage of approved jobs that got filled)
    const fillRate = approvedCount > 0 
      ? ((filledCount / approvedCount) * 100).toFixed(1)
      : 0;

    // ===========================================
    // 9. SEND COMPREHENSIVE RESPONSE
    // ===========================================
    res.json({
      success: true,
      data: {
        // Quick overview numbers (for dashboard cards)
        overview: {
          total: pendingCount + approvedCount + rejectedCount + filledCount + expiredCount + cancelledCount + draftCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          filled: filledCount,
          expired: expiredCount,
          cancelled: cancelledCount,
          draft: draftCount
        },
        // Detailed breakdown by status
        byStatus: statusStats,
        // Top categories by popularity
        byCategory: categoryStats,
        // Top locations by demand
        byLocation: locationStats,
        // Daily trends for charts
        dailyPostings: dailyStats,
        // Recent activity for "Latest" sections
        recentPending,
        recentApproved,
        // Budget analytics
        budget: {
          totalApproved: budgetStats[0]?.totalApprovedBudget || 0,
          totalPending: budgetStats[0]?.totalPendingBudget || 0,
          averageApproved: Math.round(budgetStats[0]?.avgApprovedBudget || 0)
        },
        // Platform performance metrics
        performance: {
          averageApprovalTimeHours: avgApprovalHours,
          approvalRate: parseFloat(approvalRate),
          fillRate: parseFloat(fillRate)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/jobs/export
 * 
 * PURPOSE:
 * Export job data for reporting, analysis, or backup.
 * Supports both JSON and CSV formats for different use cases.
 * 
 * WHAT IT DOES:
 * - Fetches jobs based on filters (status, date range)
 * - Populates client and technician information
 * - Formats data for export
 * - Returns in requested format (JSON or CSV)
 * 
 * USE CASES:
 * - JSON: For API integration or data migration
 * - CSV: For Excel analysis, accounting, or stakeholder reports
 * 
 * QUERY PARAMETERS:
 * - status: Filter by status ('all' or specific status)
 * - format: Export format ('json' or 'csv', default: 'json')
 * - startDate: Export jobs after this date (ISO format)
 * - endDate: Export jobs before this date (ISO format)
 * 
 * RESPONSE:
 * For JSON: { success: true, count: number, data: [...] }
 * For CSV: File download with .csv extension
 */
exports.exportJobs = async (req, res) => {
  try {
    const { status, format = 'json', startDate, endDate } = req.query;

    // Build query based on filters
    const query = {};
    if (status && status !== 'all') query.status = status;
    
    // Apply date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Fetch jobs with related data populated
    const jobs = await Job.find(query)
      .populate('clientId', 'firstName lastName email phone')
      .populate('hiredTechnicianId', 'firstName lastName email')
      .sort({ createdAt: -1 });  // Newest first

    // ===========================================
    // CSV EXPORT (for Excel and spreadsheet software)
    // ===========================================
    if (format === 'csv') {
      // Define CSV column headers (in order)
      const csvHeaders = [
        'Job ID', 'Title', 'Status', 'Main Category', 'Service Category',
        'Sub Service', 'Location', 'Address', 'Budget', 'Currency',
        'Client Name', 'Client Email', 'Client Phone', 'Hired Technician',
        'Is Urgent', 'Is Featured', 'Views', 'Applications', 'Created At',
        'Approved At', 'Expires At'
      ];
      
      // Convert each job to a CSV row
      const csvRows = jobs.map(job => [
        job._id,                                      // Job ID
        job.title,                                    // Title
        job.status,                                   // Current status
        job.mainCategory,                             // Main category
        job.serviceCategory,                          // Service category
        job.subService,                               // Sub service
        job.location,                                 // City/location
        job.address,                                  // Full address
        job.budget,                                   // Budget amount
        job.currency || 'KES',                        // Currency
        job.clientId ? `${job.clientId.firstName} ${job.clientId.lastName}` : 'N/A',  // Client name
        job.clientId?.email || 'N/A',                 // Client email
        job.clientId?.phone || 'N/A',                 // Client phone
        job.hiredTechnicianId ? `${job.hiredTechnicianId.firstName} ${job.hiredTechnicianId.lastName}` : 'Not hired',  // Tech
        job.isUrgent ? 'Yes' : 'No',                  // Urgent flag
        job.isFeatured ? 'Yes' : 'No',                // Featured flag
        job.viewCount || 0,                           // View count
        job.applicationCount || 0,                    // Application count
        job.createdAt.toISOString(),                  // Creation date
        job.approvedAt?.toISOString() || 'Not approved',  // Approval date
        job.expiresAt?.toISOString() || 'N/A'         // Expiration date
      ]);

      // Combine headers and rows into CSV string
      // Wrap each cell in quotes to handle commas in content
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=jobs-export.csv');
      return res.send(csvContent);
    }

    // ===========================================
    // JSON EXPORT (for API or data migration)
    // ===========================================
    res.json({
      success: true,
      count: jobs.length,
      data: jobs.map(formatJobResponse)  // Format each job before sending
    });

  } catch (error) {
    console.error('Error exporting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting jobs',
      error: error.message
    });
  }
};

// Export all functions for use in routes
module.exports = exports;