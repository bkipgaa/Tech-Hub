/**
 * MyApplications Component
 * ========================
 * 
 * Technician dashboard to view and manage job applications
 * Features:
 * - View all applications submitted by technician
 * - Filter by status (pending, accepted, rejected, withdrawn)
 * - Withdraw pending applications
 * - View application details
 * - Track application status
 * - Statistics overview
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';
import Loader from '../common/Loader';

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  /**
   * Fetch technician's applications on component mount or filter change
   */
  useEffect(() => {
    fetchApplications();
  }, [filter]);

  /**
   * Fetch applications from backend
   */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getMyApplications(filter);
      setApplications(response.data || []);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw a pending application
   * @param {string} appId - Application ID to withdraw
   */
  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      await applicationService.withdrawApplication(appId);
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to withdraw application');
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
   * Get status badge styling
   * @param {string} status - Application status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted ✓' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected ✗' },
      withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Withdrawn' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' }
    };
    const cfg = config[status] || config.pending;
    return (
      <span className={`${cfg.bg} ${cfg.text} px-2 py-1 rounded-full text-xs font-medium`}>
        {cfg.label}
      </span>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Applications</h1>
        <Link
          to="/available-jobs"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Browse More Jobs
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Applications</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.accepted || 0}</p>
            <p className="text-sm text-gray-500">Accepted</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.acceptanceRate || 0}%</p>
            <p className="text-sm text-gray-500">Success Rate</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {['all', 'pending', 'accepted', 'rejected', 'withdrawn'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              filter === status
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No applications found</p>
          <Link to="/available-jobs" className="text-green-600 hover:text-green-700 mt-2 inline-block">
            Browse available jobs to apply
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-gray-800">
                      <Link to={`/jobs/${app.jobId?._id}`} className="hover:text-green-600">
                        {app.jobId?.title || 'Unknown Job'}
                      </Link>
                    </h3>
                    {getStatusBadge(app.status)}
                    {app.daysUntilExpiry > 0 && app.status === 'pending' && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        Expires in {app.daysUntilExpiry} days
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    {app.jobId?.mainCategory} &gt; {app.jobId?.serviceCategory}
                  </p>
                  
                  <p className="text-gray-500 text-sm mb-2">
                    📍 {app.jobId?.location}
                  </p>
                  
                  <div className="flex gap-4 mt-2">
                    <p className="text-green-600 font-semibold">
                      Proposed: {app.proposedPrice ? `${app.jobId?.currency || 'KES'} ${app.proposedPrice.toLocaleString()}` : 'Negotiable'}
                    </p>
                    {app.estimatedDays && (
                      <p className="text-gray-600">⏱️ Est. {app.estimatedDays} days</p>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-xs mt-2">
                    Applied: {formatDate(app.appliedAt)}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  
                  {/* Withdraw Button - Only for pending applications */}
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(app._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Job Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Job Information</h3>
                <p><span className="font-medium">Title:</span> {selectedApp.jobId?.title}</p>
                <p><span className="font-medium">Budget:</span> {selectedApp.jobId?.currency || 'KES'} {selectedApp.jobId?.budget?.toLocaleString()}</p>
                <p><span className="font-medium">Location:</span> {selectedApp.jobId?.location}</p>
              </div>

              {/* Application Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Your Application</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2"><span className="font-medium">Cover Message:</span></p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedApp.coverMessage}</p>
                  
                  {selectedApp.proposedPrice && (
                    <p className="mt-3"><span className="font-medium">Proposed Price:</span> {selectedApp.jobId?.currency || 'KES'} {selectedApp.proposedPrice.toLocaleString()}</p>
                  )}
                  {selectedApp.estimatedDays && (
                    <p><span className="font-medium">Estimated Days:</span> {selectedApp.estimatedDays}</p>
                  )}
                  {selectedApp.availableFrom && (
                    <p><span className="font-medium">Available From:</span> {formatDate(selectedApp.availableFrom)}</p>
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Current Status:</span> {selectedApp.status}</p>
                  <p><span className="font-medium">Applied On:</span> {formatDate(selectedApp.appliedAt)}</p>
                  {selectedApp.respondedAt && (
                    <p><span className="font-medium">Responded On:</span> {formatDate(selectedApp.respondedAt)}</p>
                  )}
                  {selectedApp.rejectionReason && (
                    <p className="mt-2 text-red-600"><span className="font-medium">Reason:</span> {selectedApp.rejectionReason}</p>
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

export default MyApplications;