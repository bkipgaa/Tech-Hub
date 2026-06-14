/**
 * JobsManagement Component
 * ========================
 * 
 * PURPOSE:
 * Displays a simplified list of jobs for admin review (approved/rejected/all)
 * Shows only essential information in the list view to keep the interface clean
 * 
 * FEATURES:
 * - Clean list view with minimal information (title, status, client, budget)
 * - Full details and actions (approve/reject) available in modal
 * - Search functionality to filter jobs
 * - Pagination for large job lists
 * - Status-based filtering (approved/rejected/all)
 * 
 * DESIGN PHILOSOPHY:
 * - List view: Show just enough info for quick scanning
 * - Modal view: Show all details and provide action buttons
 * - This prevents information overload on the main page
 * 
 * ACCESS: Admin only (handled by parent route)
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye,           // View details icon
  DollarSign,    // Budget icon
  MapPin,        // Location icon
  Clock,         // Date icon
  Briefcase,     // Category icon
  AlertCircle,   // Urgent badge icon
  ChevronLeft,   // Pagination left arrow
  ChevronRight,  // Pagination right arrow
  Search,        // Search icon
  CheckCircle,   // Approve button icon
  XCircle        // Reject button icon
} from 'lucide-react';
import adminJobService from '../../services/adminJobService'; // Admin job API service
import api from '../../services/api'; // For fallback API calls
import Loader from '../common/Loader'; // Loading spinner component

const JobsManagement = ({ status = 'approved' }) => {
  // ===========================================
  // STATE MANAGEMENT
  // ===========================================
  
  const [jobs, setJobs] = useState([]);           // Array of job objects for list view
  const [loading, setLoading] = useState(true);    // Loading state for fetch operations
  const [selectedJob, setSelectedJob] = useState(null); // Job being viewed in modal
  const [searchTerm, setSearchTerm] = useState('');     // Search filter text
  const [currentPage, setCurrentPage] = useState(1);    // Current page for pagination
  const [totalPages, setTotalPages] = useState(1);      // Total pages available
  const [totalJobs, setTotalJobs] = useState(0);        // Total jobs matching filter
  
  // Modal-specific state for approve/reject actions
  const [adminNotes, setAdminNotes] = useState('');     // Admin notes/rejection reason
  const [actionLoading, setActionLoading] = useState(false); // Loading for actions

  // ===========================================
  // DATA FETCHING
  // ===========================================

  /**
   * Fetch jobs whenever status, page, or search term changes
   * This effect runs when component mounts and when dependencies change
   */
  useEffect(() => {
    fetchJobs();
  }, [status, currentPage]); // Re-fetch when filter or page changes

  /**
   * Fetch jobs from backend using the admin job service
   * Gets only essential data for the list view (not all details)
   * 
   * WHY SEPARATE FROM MODAL DATA:
   * - List view needs less data, improving performance
   * - Modal fetches detailed data when opened (if needed)
   */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      let response;
      
      // Different API calls based on filter
      if (status === 'all') {
        // Get all jobs regardless of status
        response = await adminJobService.getAllJobs({}, currentPage, 10);
      } else {
        // Get jobs filtered by specific status (approved/rejected)
        response = await adminJobService.getAllJobs({ status }, currentPage, 10);
      }
      
      if (response.success) {
        setJobs(response.data);           // Store jobs array
        setTotalPages(response.totalPages); // Update pagination info
        setTotalJobs(response.total);      // Update total count
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      
      // FALLBACK: Try old endpoint for backward compatibility
      // This ensures the component works even if backend isn't fully updated
      try {
        const endpoint = status === 'all' 
          ? `/api/jobs/admin/all?page=${currentPage}&limit=10`
          : `/api/jobs/admin/all?status=${status}&page=${currentPage}&limit=10`;
        
        const fallbackResponse = await api.get(endpoint);
        if (fallbackResponse.data.success) {
          setJobs(fallbackResponse.data.data);
          setTotalPages(fallbackResponse.data.totalPages);
          setTotalJobs(fallbackResponse.data.total);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to fetch jobs. Please try again later.');
      }
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
        adminNotes || 'Job approved by admin'  // Use notes if provided
      );
      
      if (response.success) {
        alert('✅ Job approved successfully!');
        setAdminNotes('');        // Clear notes
        setSelectedJob(null);     // Close modal
        fetchJobs();              // Refresh the list
      }
    } catch (error) {
      console.error('Error approving job:', error);
      alert(error.response?.data?.message || 'Failed to approve job');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Reject a job - Called from modal
   * Changes job status from 'pending' to 'rejected'
   * 
   * @param {string} jobId - ID of the job to reject
   */
  const handleReject = async (jobId) => {
    // Validate that rejection reason is provided (required for client feedback)
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
        fetchJobs();              // Refresh the list
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
   * @returns {string} Formatted date string (e.g., "Jan 15, 2024, 02:30 PM")
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
   * Get CSS classes for status badges based on job status
   * Different colors help users quickly identify job state
   * 
   * @param {string} status - Job status (pending, approved, rejected, etc.)
   * @returns {JSX.Element} Badge component with appropriate colors
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',    // Yellow for waiting
      approved: 'bg-green-100 text-green-800',     // Green for approved
      rejected: 'bg-red-100 text-red-800',         // Red for rejected
      filled: 'bg-blue-100 text-blue-800',         // Blue for completed
      expired: 'bg-gray-100 text-gray-800',        // Gray for expired
      cancelled: 'bg-gray-100 text-gray-800'       // Gray for cancelled
    };
    
    const badgeColor = badges[status] || 'bg-gray-100 text-gray-800';
    const displayName = status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badgeColor}`}>
        {displayName}
      </span>
    );
  };

  /**
   * Filter jobs based on search term
   * Searches across title, description, and location
   * 
   * WHY CLIENT-SIDE FILTERING:
   * - Small dataset (10-20 jobs per page) makes client-side filtering efficient
   * - Instant feedback as user types
   * - Reduces server requests
   */
  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading spinner while fetching data
  if (loading) return <Loader />;

  // ===========================================
  // RENDER COMPONENT
  // ===========================================
  
  return (
    <div className="space-y-6">
      
      {/* ===========================================
           HEADER SECTION
           ======================================== */}
      <div className="flex justify-between items-center">
        <div>
          {/* Dynamic title based on current filter */}
          <h2 className="text-2xl font-bold text-gray-800">
            {status === 'approved' && '✅ Approved Jobs'}
            {status === 'rejected' && '❌ Rejected Jobs'}
            {status === 'all' && '📋 All Jobs'}
          </h2>
          {/* Show total count for transparency */}
          <p className="text-gray-600 mt-1">
            Total: {totalJobs} job{totalJobs !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Search Input - filters jobs in real-time */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
          />
        </div>
      </div>

      {/* ===========================================
           JOBS LIST - SIMPLIFIED VIEW
           Shows only essential information for quick scanning
           ======================================== */}
      {filteredJobs.length === 0 ? (
        // Empty State - No jobs found
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm 
              ? `No results matching "${searchTerm}"` 
              : `No ${status} jobs available`}
          </p>
        </div>
      ) : (
        <>
          {/* Job Cards - Each card shows minimal info */}
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div 
                key={job._id} 
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition border-l-4 border-l-blue-500"
              >
                <div className="flex justify-between items-start">
                  {/* LEFT SECTION: Main job information */}
                  <div className="flex-1">
                    {/* Title Row with Status Badges */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {job.title}
                      </h3>
                      {getStatusBadge(job.status)}
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
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition ml-4 flex items-center gap-2"
                    title="View Full Details"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm hidden sm:inline">View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ===========================================
               PAGINATION CONTROLS
               ======================================== */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ===========================================
           JOB DETAILS MODAL
           Shows complete job information and provides approve/reject actions
           Only appears when a job is selected
           ======================================== */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Job Details</h3>
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
                <h4 className="font-bold text-lg text-gray-800 mb-2">
                  {selectedJob.title}
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge(selectedJob.status)}
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
                    <p className="text-gray-600 text-sm">{selectedJob.clientId?.phone}</p>
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
                {selectedJob.approvedAt && (
                  <div>
                    <h4 className="font-semibold text-gray-700">Approved Date</h4>
                    <p className="text-gray-600">{formatDate(selectedJob.approvedAt)}</p>
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
              
              {/* Rejection Reason (if rejected) */}
              {selectedJob.rejectionReason && (
                <div className="p-3 bg-red-50 rounded-md border-l-4 border-red-500">
                  <h4 className="font-semibold text-red-800 mb-1">Rejection Reason</h4>
                  <p className="text-red-700">{selectedJob.rejectionReason}</p>
                </div>
              )}
              
              {/* ===========================================
                   ADMIN ACTION SECTION (Only for pending jobs)
                   Shows approve/reject buttons with notes input
                   ======================================== */}
              {selectedJob.status === 'pending' && (
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
                      {actionLoading ? 'Processing...' : 'Approve Job'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedJob._id)}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition duration-200 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {actionLoading ? 'Processing...' : 'Reject Job'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* For non-pending jobs, just show a message */}
              {selectedJob.status !== 'pending' && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-gray-500 text-sm italic">
                    This job has been {selectedJob.status}. No further actions required.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsManagement;