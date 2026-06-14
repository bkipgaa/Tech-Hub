/**
 * JobCard Component
 * =================
 * 
 * Displays a job listing in a card format for list views
 * Features:
 * - Job preview with essential information
 * - Quick apply button for technicians
 * - View details link
 * - Urgent job highlighting
 * - Contact information (for technicians)
 * 
 * @param {Object} job - Job object containing all job details
 * @param {Function} onUpdate - Callback to refresh parent component after actions
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApplyModal from '../applications/ApplyModal';

const JobCard = ({ job, onUpdate }) => {
  const { user } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showContact, setShowContact] = useState(false);

  /**
   * Returns appropriate badge based on job status
   * - Urgent: Red badge for priority jobs
   * - Open: Green badge for available jobs
   * - Filled: Gray badge for taken jobs
   */
  const getStatusBadge = () => {
    if (job.isUrgent && job.status === 'approved') {
      return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">🚨 Urgent</span>;
    }
    if (job.status === 'approved') {
      return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Open</span>;
    }
    if (job.status === 'filled') {
      return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Filled</span>;
    }
    if (job.status === 'pending') {
      return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending Approval</span>;
    }
    return null;
  };

  /**
   * Formats date to readable format
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Truncates text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="p-6">
          {/* Header Section - Title and Badges */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Job Title with link to details */}
                <h3 className="text-xl font-semibold text-gray-800">
                  <Link to={`/jobs/${job._id}`} className="hover:text-green-600 transition-colors">
                    {job.title}
                  </Link>
                </h3>
                {getStatusBadge()}
              </div>
              
              {/* Service Category Path */}
              <p className="text-gray-600 text-sm">
                {job.mainCategory} &gt; {job.serviceCategory} &gt; {job.subService}
              </p>
            </div>
            
            {/* Budget Display */}
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {job.currency || 'KES'} {job.budget.toLocaleString()}
              </p>
              {job.pricingType === 'hourly' && (
                <p className="text-gray-500 text-sm">per hour</p>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          <p className="text-gray-600 mt-2 line-clamp-2">
            {truncateText(job.description, 120)}
          </p>
          
          {/* Location Information */}
          <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{job.address}, {job.location}</span>
          </div>
          
          {/* Meta Information and Action Buttons */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div className="text-gray-500 text-xs">
              Posted {formatDate(job.createdAt)}
              {job.applicationCount > 0 && (
                <span className="ml-2">• {job.applicationCount} applicant(s)</span>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Apply Button - Only visible to technicians for open jobs */}
              {user?.role === 'technician' && job.status === 'approved' && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                >
                  Apply Now
                </button>
              )}
              
              {/* View Details Button */}
              <Link
                to={`/jobs/${job._id}`}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                View Details
              </Link>
            </div>
          </div>
          
          {/* Contact Information - Expandable section for technicians */}
          {user?.role === 'technician' && !showContact && job.status === 'approved' && (
            <button
              onClick={() => setShowContact(true)}
              className="mt-3 text-xs text-green-600 hover:text-green-700"
            >
              Show Client Contact Info
            </button>
          )}
          
          {user?.role === 'technician' && showContact && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
              <p className="font-semibold text-gray-700 mb-2">Client Contact Information:</p>
              <p className="mb-1">📞 Phone: {job.phone}</p>
              <p className="mb-1">✉️ Email: {job.email}</p>
              <p>👤 Name: {job.clientName}{job.companyName && ` (${job.companyName})`}</p>
              <button
                onClick={() => setShowContact(false)}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Hide Contact Info
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Apply Modal - Shown when technician clicks apply */}
      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </>
  );
};

export default JobCard;