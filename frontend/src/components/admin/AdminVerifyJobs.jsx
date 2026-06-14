/**
 * AdminVerifyJobs Component
 * =========================
 * 
 * PURPOSE:
 * Admin dashboard to review and verify pending job postings
 * Shows pending jobs in a simplified list view with approve/reject actions in modal
 * 
 * FEATURES:
 * - Clean list view with minimal information (title, client, budget, location)
 * - Full job details and approve/reject actions in modal
 * - Statistics tabs showing counts
 * - Pagination support
 * - Real-time updates after actions
 * 
 * DESIGN PHILOSOPHY:
 * - List view: Show just enough info for quick scanning
 * - Modal view: Show all details and provide action buttons
 * - This keeps the interface clean and focused on decision-making
 * 
 * Access: Admin only
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye,           // View details icon
  DollarSign,    // Budget icon
  MapPin,        // Location icon
  Clock,         // Date icon
  Briefcase,     // Category icon
  AlertCircle,   // Urgent badge icon
  CheckCircle,   // Approve button icon
  XCircle,       // Reject button icon
  ChevronLeft,   // Pagination left arrow
  ChevronRight   // Pagination right arrow
} from 'lucide-react';
import adminJobService from '../../services/adminJobService';
import Loader from '../common/Loader';

const AdminVerifyJobs = ({ initialFilter = 'pending' }) => {
  // ===========================================
  // STATE MANAGEMENT
  // ===========================================
  
  const [jobs, setJobs] = useState([]);           // Array of job objects for list view
  const [loading, setLoading] = useState(true);    // Loading state for fetching jobs
  const [selectedJob, setSelectedJob] = useState(null); // Job being viewed in modal
  const [adminNotes, setAdminNotes] = useState(''); // Admin notes/rejection reason
  const [actionLoading, setActionLoading] = useState(false); // Loading for approve/reject actions
  const [filter, setFilter] = useState(initialFilter); // Current filter (always 'pending' for this component)
  const [page, setPage] = useState(1);             // Current page number
  const [totalPages, setTotalPages] = useState(1); // Total pages available
  const [stats, setStats] = useState({});          // Job statistics for dashboard tabs

  // ===========================================
  // DATA FETCHING
  // ===========================================

  /**
   * Fetch jobs whenever page changes
   * This component only shows pending jobs by default
   */
  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [page]); // Re-run when page changes

  /**
   * Get job statistics for the dashboard tabs
   * Shows counts of pending, approved, rejected jobs
   */
  const fetchStats = async () => {
    try {
      const response = await adminJobService.getAdminStats();
      if (response.success) {
        setStats(response.data.overview); // Set stats for display in tabs
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

  /**
   * Get pending jobs from backend using the admin job service
   * Only fetches pending jobs (status = 'pending')
   */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Get only pending jobs using the specific endpoint
      const response = await adminJobService.getPendingJobs(page, 10);
      
      if (response.success) {
        setJobs(response.data);              // Array of pending jobs
        setTotalPages(response.totalPages || 1); // Pagination info
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // JOB VERIFICATION ACTIONS (in Modal)
  // ===========================================

  /**
   * Approve a job - Called from modal
   * Changes job status from 'pending' to 'approved'
   * 
   * @param {string} jobId - ID of the job to approve
   */
  const handleApprove = async (jobId) => {
    setActionLoading(true);
    try {
      const response = await adminJobService.approveJob(
        jobId, 
        adminNotes || 'Job approved by admin'
      );
      
      if (response.success) {
        alert('✅ Job approved successfully!');
        setAdminNotes('');        // Clear notes
        setSelectedJob(null);     // Close modal
        fetchJobs();              // Refresh the pending jobs list
        fetchStats();            // Update statistics
      }
    } catch (error) {
      console.error('Error approving job:', error);
      alert(error.response?.data?.message || 'Failed to approve job');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Reject a job with a reason - Called from modal
   * Changes job status from 'pending' to 'rejected'
   * 
   * @param {string} jobId - ID of the job to reject
   */
  const handleReject = async (jobId) => {
    // Validate that a rejection reason is provided (required for client feedback)
    if (!adminNotes) {
      alert('⚠️ Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await adminJobService.rejectJob(
        jobId,
        adminNotes,                    // Rejection reason (shown to client)
        `Rejected: ${adminNotes}`      // Admin notes (internal)
      );
      
      if (response.success) {
        alert('❌ Job rejected successfully');
        setAdminNotes('');        // Clear notes
        setSelectedJob(null);     // Close modal
        fetchJobs();              // Refresh the pending jobs list
        fetchStats();            // Update statistics
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      alert(error.response?.data?.message || 'Failed to reject job');
    } finally {
      setActionLoading(false);
    }
  };

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  /**
   * Format date for display in a user-friendly format
   * 
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get the appropriate CSS classes for status badges
   * Different colors for different job statuses
   * 
   * @param {string} status - Job status
   * @returns {string} CSS classes for the badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      filled: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Show loading spinner while fetching data
  if (loading) return <Loader />;

  // ===========================================
  // RENDER COMPONENT
  // ===========================================
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* ===========================================
           HEADER SECTION
           ======================================== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Job Verification Dashboard
        </h1>
        <p className="text-gray-600">
          Review and verify job postings from clients before they go live
        </p>
      </div>

      {/* ===========================================
           STATISTICS TABS
           Shows quick counts for each status
           ======================================== */}
      <div className="flex gap-2 mb-6 border-b">
        {/* Pending Jobs Tab (Active) */}
        <div className="px-4 py-2 font-medium text-yellow-600 border-b-2 border-yellow-600">
          Pending Jobs
          {stats.pending > 0 && (
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {stats.pending}
            </span>
          )}
        </div>

        {/* Approved Jobs Tab (Inactive - just for info) */}
        <div className="px-4 py-2 font-medium text-gray-500">
          Approved Jobs
          {stats.approved > 0 && (
            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {stats.approved}
            </span>
          )}
        </div>

        {/* Rejected Jobs Tab (Inactive - just for info) */}
        <div className="px-4 py-2 font-medium text-gray-500">
          Rejected Jobs
          {stats.rejected > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {stats.rejected}
            </span>
          )}
        </div>
      </div>

      {/* ===========================================
           JOBS LIST - SIMPLIFIED VIEW
           Shows only essential information for quick scanning
           ======================================== */}
      {jobs.length === 0 ? (
        // Empty State - No pending jobs
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-gray-500 text-lg">No pending jobs found</p>
            <p className="text-gray-400 mt-2">All caught up! Check back later for new job postings.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Job Cards - Each card shows minimal info */}
          {jobs.map(job => (
            <div 
              key={job._id} 
              className="bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-l-yellow-500 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  
                  {/* LEFT SECTION: Main job information */}
                  <div className="flex-1">
                    {/* Title Row with Status Badges */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                      {job.isUrgent && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> 
                          Urgent
                        </span>
                      )}
                    </div>
                    
                    {/* Client and Date Info */}
                    <p className="text-sm text-gray-500 mb-3">
                      Posted by: {job.clientId?.firstName} {job.clientId?.lastName} • {formatDate(job.createdAt)}
                    </p>
                    
                    {/* Key Metrics Row - Clean and minimal */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          KES {job.budget?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.mainCategory}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* RIGHT SECTION: View Details Button */}
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review Job
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* ===========================================
               PAGINATION CONTROLS
               ======================================== */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===========================================
           JOB DETAILS & REVIEW MODAL
           Shows complete job information and provides approve/reject actions
           Only appears when a job is selected
           ======================================== */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Review Job Posting</h2>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setAdminNotes(''); // Clear notes when closing
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl transition"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body - Full Job Details */}
            <div className="p-6 space-y-4">
              
              {/* Title and Basic Info */}
              <div>
                <h3 className="font-bold text-xl mb-2 text-gray-800">{selectedJob.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                  {selectedJob.isUrgent && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>
              </div>
              
              {/* Full Description */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {selectedJob.description}
                </p>
              </div>
              
              {/* Two-column layout for details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700">Client Information</h4>
                    <p className="text-gray-600">
                      {selectedJob.clientId?.firstName} {selectedJob.clientId?.lastName}
                    </p>
                    <p className="text-gray-600 text-sm">{selectedJob.clientId?.email}</p>
                    <p className="text-gray-600 text-sm">📞 {selectedJob.clientId?.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700">Service Category</h4>
                    <p className="text-gray-600">
                      {selectedJob.mainCategory} &gt; {selectedJob.serviceCategory} &gt; {selectedJob.subService}
                    </p>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700">Location</h4>
                    <p className="text-gray-600">{selectedJob.address}</p>
                    <p className="text-gray-600">{selectedJob.location}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700">Budget & Pricing</h4>
                    <p className="text-2xl font-bold text-green-600">
                      KES {selectedJob.budget?.toLocaleString()}
                    </p>
                    <p className="text-gray-600">Type: {selectedJob.pricingType}</p>
                    {selectedJob.hourlyRate && (
                      <p className="text-gray-600">Hourly Rate: KES {selectedJob.hourlyRate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Posted Date</h4>
                  <p className="text-gray-600">{formatDate(selectedJob.createdAt)}</p>
                </div>
                {selectedJob.preferredStartDate && (
                  <div>
                    <h4 className="font-semibold text-gray-700">Preferred Start</h4>
                    <p className="text-gray-600">{formatDate(selectedJob.preferredStartDate)}</p>
                  </div>
                )}
              </div>
              
              {/* Requirements List */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Requirements</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* ===========================================
                   ADMIN ACTION SECTION
                   Approve/Reject buttons with notes input
                   ======================================== */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">Admin Actions</h4>
                
                {/* Admin Notes Textarea */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Notes / Rejection Reason:
                    <span className="text-red-500 text-xs ml-1">(required for rejection)</span>
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add verification notes, feedback for client, or rejection reason..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: For rejected jobs, provide specific feedback to help client improve their posting.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedJob._id)}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : '✅ Approve Job'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedJob._id)}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition duration-200 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : '❌ Reject Job'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifyJobs;