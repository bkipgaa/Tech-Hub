/**
 * Job Application Controller
 * ==========================
 * 
 * Handles all job application operations:
 * - Technicians applying for jobs
 * - Clients managing applications
 * - Application messaging system
 * 
 * This controller is fully synchronized with:
 * - JobApplication model (schema fields)
 * - Job model (references and updates)
 * - User model (technician data)
 */

const Job = require('../models/Job');
const JobApplication = require('../models/jobApplication');
const User = require('../models/User');

// ===========================================
// TECHNICIAN ROUTES
// ===========================================

/**
 * @desc    Apply for a job (Technician only)
 * @route   POST /api/job-applications/apply/:jobId
 * @access  Private (Technician)
 * 
 * @param   {string} req.params.jobId - ID of the job being applied for
 * @body    {string} coverMessage - Message explaining why technician is suitable
 * @body    {number} proposedPrice - Proposed price for the job
 * @body    {number} estimatedDays - Estimated days to complete
 * @body    {number} estimatedHours - Alternative estimated hours (optional)
 * @body    {Date} availableFrom - When technician is available from (optional)
 * @body    {Date} availableUntil - When technician is available until (optional)
 */
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      coverMessage, 
      proposedPrice, 
      estimatedDays, 
      estimatedHours, 
      availableFrom, 
      availableUntil 
    } = req.body;

    // Validate required fields
    if (!coverMessage) {
      return res.status(400).json({
        success: false,
        message: 'Cover message is required'
      });
    }

    // Check if job exists and is approved (not expired, not filled)
    const job = await Job.findOne({
      _id: jobId,
      status: 'approved',
      expiresAt: { $gt: new Date() }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer available'
      });
    }

    // Check if technician has already applied for this job
    const existingApplication = await JobApplication.findOne({
      jobId,
      technicianId: req.user.userId,
      isActive: true
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get technician details for denormalized fields
    const technician = await User.findById(req.user.userId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    // Create application with all required fields matching the model
    const application = await JobApplication.create({
      // Relationships
      jobId,
      technicianId: req.user.userId,
      
      // Application details
      coverMessage,
      proposedPrice: proposedPrice || job.budget,
      estimatedDays: estimatedDays || Math.ceil(job.estimatedDuration?.value || 1),
      estimatedHours: estimatedHours || null,
      availableFrom: availableFrom || null,
      availableUntil: availableUntil || null,
      
      // Denormalized technician information
      technicianName: `${technician.firstName} ${technician.lastName}`,
      technicianEmail: technician.email,
      technicianPhone: technician.phone || '',
      technicianProfileImage: technician.profileImage || '',
      technicianRating: technician.rating || 0,
      technicianCompletedJobs: technician.completedJobs || 0,
      
      // Skills & qualifications (from technician profile)
      relevantSkills: technician.skills || [],
      yearsOfExperience: technician.yearsOfExperience || 0,
      certifications: technician.certifications || [],
      portfolioImages: [],
      
      // Status
      status: 'pending',
      
      // System fields
      isActive: true,
      priorityScore: 50,
      source: 'direct'
    });

    // Add to job's applications array and increment count
    await Job.findByIdAndUpdate(jobId, {
      $push: { applications: application._id },
      $inc: { applicationCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application',
      error: error.message
    });
  }
};

/**
 * @desc    Get my applications (Technician view)
 * @route   GET /api/job-applications/my-applications
 * @access  Private (Technician)
 * 
 * @query   {string} status - Filter by status (pending, accepted, rejected, etc.)
 * @query   {number} page - Page number for pagination
 * @query   {number} limit - Items per page
 */
exports.getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { 
      technicianId: req.user.userId, 
      isActive: true 
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await JobApplication.countDocuments(query);

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title description mainCategory serviceCategory budget location isUrgent status')
      .sort({ appliedAt: -1 })  // Using appliedAt from schema (not createdAt)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: applications
    });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Withdraw an application (Technician only)
 * @route   PUT /api/job-applications/:applicationId/withdraw
 * @access  Private (Technician)
 * 
 * @param   {string} req.params.applicationId - ID of the application to withdraw
 * @body    {string} reason - Reason for withdrawal (optional)
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    // Find application owned by this technician and still pending
    const application = await JobApplication.findOne({
      _id: applicationId,
      technicianId: req.user.userId,
      status: 'pending',
      isActive: true
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be withdrawn'
      });
    }

    // Use the model's withdraw method if available, or update directly
    if (typeof application.withdraw === 'function') {
      await application.withdraw(reason);
    } else {
      application.status = 'withdrawn';
      application.withdrawnAt = new Date();
      application.rejectionReason = reason || 'Withdrawn by technician';
      await application.save();
    }

    // Remove from job's applications array
    await Job.findByIdAndUpdate(application.jobId, {
      $pull: { applications: applicationId },
      $inc: { applicationCount: -1 }
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// CLIENT ROUTES
// ===========================================

/**
 * @desc    Get applications for my jobs (Client view)
 * @route   GET /api/job-applications/my-job-applications
 * @access  Private (Client)
 * 
 * @query   {string} jobId - Filter by specific job ID (optional)
 * @query   {string} status - Filter by application status (optional)
 * @query   {number} page - Page number for pagination
 * @query   {number} limit - Items per page
 */
exports.getApplicationsForMyJobs = async (req, res) => {
  try {
    const { jobId, status, page = 1, limit = 20 } = req.query;

    // Get all jobs posted by this client
    const jobsQuery = { clientId: req.user.userId };
    if (jobId) {
      jobsQuery._id = jobId;
    }

    const jobs = await Job.find(jobsQuery).select('_id');
    const jobIds = jobs.map(job => job._id);

    if (jobIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page),
        totalPages: 0,
        data: []
      });
    }

    const query = { 
      jobId: { $in: jobIds },
      isActive: true 
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await JobApplication.countDocuments(query);

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title budget location status')
      .populate('technicianId', 'firstName lastName email phone profileImage rating')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: applications
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Accept an application (Client only)
 * @route   PUT /api/job-applications/:applicationId/accept
 * @access  Private (Client)
 * 
 * When an application is accepted:
 * 1. Application status becomes 'accepted'
 * 2. Job status becomes 'in-progress' (or 'filled')
 * 3. Technician is assigned to the job
 * 4. All other pending applications for this job are rejected
 * 
 * @param   {string} req.params.applicationId - ID of the application to accept
 */
exports.acceptApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Find application with populated job details
    const application = await JobApplication.findById(applicationId)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify the job belongs to this client
    if (application.jobId.clientId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this application'
      });
    }

    // Check if application is still pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This application has already been ${application.status}`
      });
    }

    // Update application status using model method if available
    if (typeof application.accept === 'function') {
      await application.accept();
    } else {
      application.status = 'accepted';
      application.respondedAt = new Date();
      await application.save();

      // Update job status and assign technician
      await Job.findByIdAndUpdate(application.jobId._id, {
        status: 'in-progress',
        hiredTechnicianId: application.technicianId,
        filledAt: new Date()
      });

      // Reject all other pending applications for this job
      await JobApplication.updateMany(
        {
          jobId: application.jobId._id,
          _id: { $ne: applicationId },
          status: 'pending'
        },
        { 
          status: 'rejected',
          respondedAt: new Date(),
          rejectionReason: 'Another application was accepted'
        }
      );
    }

    res.json({
      success: true,
      message: 'Application accepted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Reject an application (Client only)
 * @route   PUT /api/job-applications/:applicationId/reject
 * @access  Private (Client)
 * 
 * @param   {string} req.params.applicationId - ID of the application to reject
 * @body    {string} rejectionReason - Reason for rejection (optional)
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify the job belongs to this client
    if (application.jobId.clientId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this application'
      });
    }

    // Check if application is still pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This application has already been ${application.status}`
      });
    }

    // Update application status using model method if available
    if (typeof application.reject === 'function') {
      await application.reject(rejectionReason);
    } else {
      application.status = 'rejected';
      application.respondedAt = new Date();
      application.rejectionReason = rejectionReason || 'Not selected by client';
      await application.save();
    }

    res.json({
      success: true,
      message: 'Application rejected',
      data: application
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get application statistics for a specific job
 * @route   GET /api/job-applications/job/:jobId/stats
 * @access  Private (Client who owns the job)
 * 
 * Returns aggregate statistics including:
 * - Total applications count
 * - Count by status (pending, accepted, rejected, withdrawn)
 * - Average proposed price
 * - Average estimated days
 * 
 * @param   {string} req.params.jobId - ID of the job to get stats for
 */
exports.getJobApplicationStats = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to client
    const job = await Job.findOne({
      _id: jobId,
      clientId: req.user.userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not authorized'
      });
    }

    const stats = await JobApplication.aggregate([
      { $match: { jobId: job._id, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProposedPrice: { $avg: '$proposedPrice' },
          avgEstimatedDays: { $avg: '$estimatedDays' }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      expired: 0,
      countered: 0,
      averageProposedPrice: 0,
      averageEstimatedDays: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
      if (stat._id === 'pending') {
        result.averageProposedPrice = stat.avgProposedPrice || 0;
        result.averageEstimatedDays = stat.avgEstimatedDays || 0;
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting application stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// SHARED ROUTES (Client + Technician)
// ===========================================

/**
 * @desc    Get single application details
 * @route   GET /api/job-applications/:applicationId
 * @access  Private (Technician who applied OR Client who owns the job)
 * 
 * Returns full application details including:
 * - Job information
 * - Technician information
 * - Application status and history
 * - Messages
 * 
 * @param   {string} req.params.applicationId - ID of the application
 */
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId)
      .populate('jobId')
      .populate('technicianId', 'firstName lastName email phone profileImage rating bio skills yearsOfExperience');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization: either the technician who applied OR the client who owns the job
    const isTechnician = application.technicianId._id.toString() === req.user.userId;
    const job = await Job.findById(application.jobId);
    const isClient = job && job.clientId.toString() === req.user.userId;

    if (!isTechnician && !isClient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get messages for an application
 * @route   GET /api/job-applications/:applicationId/messages
 * @access  Private (Technician OR Client who owns the job)
 * 
 * Returns all messages exchanged for this application
 * 
 * @param   {string} req.params.applicationId - ID of the application
 */
exports.getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const job = await Job.findById(application.jobId);
    const isClient = job && job.clientId.toString() === req.user.userId;
    const isTechnician = application.technicianId.toString() === req.user.userId;

    if (!isClient && !isTechnician) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages'
      });
    }

    // Mark messages as read for the requesting user
    if (isClient && application.clientUnreadCount > 0) {
      application.clientUnreadCount = 0;
      await application.save();
    } else if (isTechnician && application.technicianUnreadCount > 0) {
      application.technicianUnreadCount = 0;
      await application.save();
    }

    res.json({
      success: true,
      data: application.messages || []
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Send a message on an application
 * @route   POST /api/job-applications/:applicationId/messages
 * @access  Private (Technician OR Client who owns the job)
 * 
 * @param   {string} req.params.applicationId - ID of the application
 * @body    {string} message - The message content
 * @body    {Array} attachments - Optional file attachments
 */
exports.sendMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { message, attachments = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Determine sender role
    const job = await Job.findById(application.jobId);
    let senderRole;
    
    if (job && job.clientId.toString() === req.user.userId) {
      senderRole = 'client';
    } else if (application.technicianId.toString() === req.user.userId) {
      senderRole = 'technician';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages on this application'
      });
    }

    // Use model's sendMessage method if available
    if (typeof application.sendMessage === 'function') {
      await application.sendMessage(req.user.userId, senderRole, message, attachments);
    } else {
      // Manual message creation
      if (!application.messages) {
        application.messages = [];
      }

      const messageObj = {
        senderId: req.user.userId,
        senderRole,
        message: message.trim(),
        attachments,
        sentAt: new Date(),
        isRead: false
      };

      application.messages.push(messageObj);
      application.lastMessageAt = new Date();

      // Update unread counts for the recipient
      if (senderRole === 'client') {
        application.technicianUnreadCount += 1;
      } else if (senderRole === 'technician') {
        application.clientUnreadCount += 1;
      }

      await application.save();
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: application.messages[application.messages.length - 1]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};