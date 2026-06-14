/**
 * JobDetails Component
 * ====================
 * 
 * Displays full job details in a dedicated page
 * Features:
 * - Complete job information
 * - Apply button and modal for technicians
 * - Contact information with show/hide
 * - Job status badges
 * - Requirements list
 * - Back navigation
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/jobService';
import ApplyModal from '../applications/ApplyModal';
import Loader from '../common/Loader';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showContact, setShowContact] = useState(false);

  /**
   * Fetch job details on component mount or when jobId changes
   */
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await jobService.getJobDetails(jobId);
        setJob(response.data);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.response?.data?.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  /**
   * Format date to readable format
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Get status badge with appropriate styling
   * @returns {JSX.Element} Status badge component
   */
  const getStatusBadge = () => {
    const statusConfig = {
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Open for Applications' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Admin Approval' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      filled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Position Filled' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' }
    };
    
    const config = statusConfig[job.status] || statusConfig.pending;
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
        {config.label}
      </span>
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;
  if (!job) return <div className="text-center py-12">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-600 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Jobs
      </button>

      {/* Main Job Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{job.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge()}
                {job.isUrgent && job.status === 'approved' && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    🚨 Urgent - Immediate Need
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                {job.currency || 'KES'} {job.budget.toLocaleString()}
              </p>
              {job.pricingType === 'hourly' && (
                <p className="text-gray-500 text-sm">per hour</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Job Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Requirements</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Service Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Service Details</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-semibold">Category:</span> {job.mainCategory}</p>
                  <p><span className="font-semibold">Service:</span> {job.serviceCategory}</p>
                  <p><span className="font-semibold">Sub-Service:</span> {job.subService}</p>
                  {job.expertiseLevel && (
                    <p><span className="font-semibold">Expertise Level:</span> {job.expertiseLevel}</p>
                  )}
                  {job.estimatedDuration && (
                    <p><span className="font-semibold">Estimated Duration:</span> {job.estimatedDuration.value} {job.estimatedDuration.unit}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Meta Information */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Location
                </h3>
                <p className="text-gray-600">{job.address}</p>
                <p className="text-gray-600 mt-1">{job.location}</p>
              </div>

              {/* Job Meta Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Job Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Posted:</span> {formatDate(job.createdAt)}</p>
                  {job.preferredStartDate && (
                    <p><span className="font-semibold">Preferred Start:</span> {formatDate(job.preferredStartDate)}</p>
                  )}
                  <p><span className="font-semibold">Applications:</span> {job.applicationCount || 0}</p>
                  <p><span className="font-semibold">Views:</span> {job.viewCount || 0}</p>
                  {job.expiresAt && (
                    <p><span className="font-semibold">Expires:</span> {formatDate(job.expiresAt)}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {user?.role === 'technician' && job.status === 'approved' && (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Apply for This Job
                  </button>
                )}
                
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {showContact ? 'Hide Contact Info' : 'Show Contact Info'}
                </button>
              </div>

              {/* Contact Information (Conditional) */}
              {showContact && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Client Contact Information</h3>
                  <p className="text-sm mb-1">📞 Phone: {job.phone}</p>
                  <p className="text-sm mb-1">✉️ Email: {job.email}</p>
                  <p className="text-sm">👤 Name: {job.clientName}</p>
                  {job.companyName && <p className="text-sm">🏢 Company: {job.companyName}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            // Refresh job details to update application count
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default JobDetails;