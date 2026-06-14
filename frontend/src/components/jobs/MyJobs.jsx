/**
 * MyJobs Component
 * ================
 * 
 * Client dashboard to manage posted jobs
 * Features:
 * - View all jobs posted by client
 * - Filter by status (pending, approved, rejected, filled, expired)
 * - Edit pending jobs
 * - Delete pending jobs
 * - View applications for each job
 * - Job statistics overview
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/jobService';
import JobApplicationsList from '../applications/JobApplicationsList';
import Loader from '../common/Loader';

const MyJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);

  /**
   * Fetch client's jobs and statistics on component mount
   */
  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [filter]);

  /**
   * Fetch jobs based on selected filter
   */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getMyJobs(filter);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch job statistics for dashboard
   */
  const fetchStats = async () => {
    try {
      const response = await jobService.getJobStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  /**
   * Delete a pending job
   * @param {string} jobId - ID of job to delete
   */
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    
    try {
      await jobService.deleteJob(jobId);
      fetchJobs();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete job');
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
   * @param {string} status - Job status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      filled: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-600'
    };
    return (
      <span className={`${config[status] || 'bg-gray-100 text-gray-600'} px-2 py-1 rounded-full text-xs font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  /**
   * View applications for a specific job
   * @param {Object} job - Job object
   */
  const handleViewApplications = (job) => {
    setSelectedJob(job);
    setShowApplications(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Posted Jobs</h1>
        <Link
          to="/post-job"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          + Post New Job
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Jobs</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.filled || 0}</p>
            <p className="text-sm text-gray-500">Filled</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['all', 'pending', 'approved', 'filled', 'rejected', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition ${
              filter === status
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No jobs found</p>
          <Link to="/post-job" className="text-green-600 hover:text-green-700 mt-2 inline-block">
            Post your first job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                    {getStatusBadge(job.status)}
                    {job.isUrgent && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Urgent</span>}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {job.mainCategory} &gt; {job.serviceCategory} &gt; {job.subService}
                  </p>
                  <p className="text-gray-500 text-sm">{job.location}</p>
                  <p className="text-green-600 font-semibold mt-2">
                    Budget: {job.currency || 'KES'} {job.budget.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Posted: {formatDate(job.createdAt)} • Applications: {job.applicationCount || 0} • Views: {job.viewCount || 0}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* View Applications Button */}
                  {job.status === 'approved' && (
                    <button
                      onClick={() => handleViewApplications(job)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      View Applications ({job.applicationCount || 0})
                    </button>
                  )}
                  
                  {/* Edit Button - Only for pending jobs */}
                  {job.status === 'pending' && (
                    <Link
                      to={`/edit-job/${job._id}`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 text-center"
                    >
                      Edit
                    </Link>
                  )}
                  
                  {/* Delete Button - Only for pending jobs */}
                  {job.status === 'pending' && (
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                  
                  {/* View Details Button */}
                  <Link
                    to={`/jobs/${job._id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications Modal */}
      {showApplications && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Applications for: {selectedJob.title}</h2>
              <button
                onClick={() => setShowApplications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <JobApplicationsList jobId={selectedJob._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJobs;