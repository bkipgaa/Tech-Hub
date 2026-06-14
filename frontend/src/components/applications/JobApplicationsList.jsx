/**
 * JobApplicationsList Component
 * =============================
 * 
 * Displays all applications for a specific job (Client view)
 * Features:
 * - List all technician applications
 * - View applicant profiles
 * - Accept or reject applications
 * - View cover messages and proposals
 * - Sort by date or proposed price
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';
import Loader from '../common/Loader';

const JobApplicationsList = ({ jobId }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch applications for the job
   */
  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  /**
   * Get applications from backend
   */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplicationsForMyJobs();
      // Filter applications for this specific job
      const jobApps = response.data.filter(app => app.jobId?._id === jobId);
      setApplications(jobApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Accept an application
   * @param {string} appId - Application ID
   */
  const handleAccept = async (appId) => {
    if (!window.confirm('Are you sure you want to accept this application? This will create a booking and mark the job as filled.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await applicationService.acceptApplication(appId);
      await fetchApplications();
      alert('Application accepted! A booking has been created.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept application');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Reject an application
   * @param {string} appId - Application ID
   * @param {string} reason - Rejection reason
   */
  const handleReject = async (appId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    setActionLoading(true);
    try {
      await applicationService.rejectApplication(appId, reason);
      await fetchApplications();
      alert('Application rejected');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Get status badge for application
   * @param {string} status - Application status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`${config[status] || 'bg-gray-100 text-gray-600'} px-2 py-1 rounded-full text-xs font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No applications received for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Applications Count */}
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-blue-800">
          Total Applications: <span className="font-bold">{applications.length}</span>
        </p>
      </div>

      {/* Applications List */}
      {applications.map(app => (
        <div key={app._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
          {/* Applicant Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              {/* Profile Image or Initials */}
              {app.technicianId?.profileImage ? (
                <img
                  src={app.technicianId.profileImage}
                  alt={app.technicianName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">
                    {app.technicianName?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-800">{app.technicianName}</h4>
                <p className="text-sm text-gray-500">{app.technicianEmail}</p>
                <p className="text-sm text-gray-500">{app.technicianPhone}</p>
              </div>
            </div>
            {getStatusBadge(app.status)}
          </div>

          {/* Application Details */}
          <div className="ml-14 space-y-3">
            {/* Cover Message */}
            <div>
              <p className="text-sm font-medium text-gray-700">Cover Message:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {app.coverMessage}
              </p>
            </div>

            {/* Proposal Details */}
            <div className="flex flex-wrap gap-4 text-sm">
              {app.proposedPrice && (
                <div>
                  <span className="font-medium text-gray-700">Proposed Price:</span>
                  <span className="ml-1 text-green-600 font-semibold">
                    {app.jobId?.currency || 'KES'} {app.proposedPrice.toLocaleString()}
                  </span>
                </div>
              )}
              {app.estimatedDays && (
                <div>
                  <span className="font-medium text-gray-700">Estimated Days:</span>
                  <span className="ml-1">{app.estimatedDays} days</span>
                </div>
              )}
              {app.estimatedHours && (
                <div>
                  <span className="font-medium text-gray-700">Estimated Hours:</span>
                  <span className="ml-1">{app.estimatedHours} hours</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Applied:</span>
                <span className="ml-1">{formatDate(app.appliedAt)}</span>
              </div>
            </div>

            {/* Rating Information */}
            {(app.technicianRating > 0 || app.technicianCompletedJobs > 0) && (
              <div className="flex gap-4 text-sm text-gray-600">
                {app.technicianRating > 0 && (
                  <div>
                    <span className="font-medium">⭐ Rating:</span>
                    <span className="ml-1">{app.technicianRating} / 5</span>
                  </div>
                )}
                {app.technicianCompletedJobs > 0 && (
                  <div>
                    <span className="font-medium">✅ Completed Jobs:</span>
                    <span className="ml-1">{app.technicianCompletedJobs}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons (Only for pending applications) */}
            {app.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAccept(app._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Accept Application
                </button>
                <button
                  onClick={() => handleReject(app._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedApp(app)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  View Full Details
                </button>
              </div>
            )}

            {/* View Details button for non-pending */}
            {app.status !== 'pending' && (
              <button
                onClick={() => setSelectedApp(app)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                View Application Details
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Technician Profile Section */}
              <div>
                <h3 className="font-bold text-lg mb-3">Technician Profile</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Name:</span> {selectedApp.technicianName}</p>
                  <p><span className="font-medium">Email:</span> {selectedApp.technicianEmail}</p>
                  <p><span className="font-medium">Phone:</span> {selectedApp.technicianPhone}</p>
                  {selectedApp.technicianRating > 0 && (
                    <p><span className="font-medium">Rating:</span> ⭐ {selectedApp.technicianRating}/5</p>
                  )}
                  {selectedApp.technicianCompletedJobs > 0 && (
                    <p><span className="font-medium">Completed Jobs:</span> {selectedApp.technicianCompletedJobs}</p>
                  )}
                </div>
              </div>

              {/* Application Details Section */}
              <div>
                <h3 className="font-bold text-lg mb-3">Application Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium">Cover Message:</p>
                    <p className="mt-1 whitespace-pre-wrap">{selectedApp.coverMessage}</p>
                  </div>
                  
                  {selectedApp.proposedPrice && (
                    <p><span className="font-medium">Proposed Price:</span> {selectedApp.jobId?.currency || 'KES'} {selectedApp.proposedPrice.toLocaleString()}</p>
                  )}
                  {selectedApp.estimatedDays && (
                    <p><span className="font-medium">Estimated Days:</span> {selectedApp.estimatedDays} days</p>
                  )}
                  {selectedApp.estimatedHours && (
                    <p><span className="font-medium">Estimated Hours:</span> {selectedApp.estimatedHours} hours</p>
                  )}
                  {selectedApp.availableFrom && (
                    <p><span className="font-medium">Available From:</span> {formatDate(selectedApp.availableFrom)}</p>
                  )}
                  <p><span className="font-medium">Applied On:</span> {formatDate(selectedApp.appliedAt)}</p>
                </div>
              </div>

              {/* Status Section */}
              <div>
                <h3 className="font-bold text-lg mb-3">Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Current Status:</span> {selectedApp.status}</p>
                  {selectedApp.rejectionReason && (
                    <p className="mt-2 text-red-600"><span className="font-medium">Rejection Reason:</span> {selectedApp.rejectionReason}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicationsList;