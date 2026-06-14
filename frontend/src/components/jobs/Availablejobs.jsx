import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import JobSearch from './JobSearch';
import jobService from '../../services/jobService';
import { useAuth } from '../../context/AuthContext';

const AvailableJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    mainCategory: '',
    serviceCategory: '',
    subService: '',
    location: '',
    minBudget: '',
    maxBudget: '',
    isUrgent: false
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getAvailableJobs(filters, currentPage);
      setJobs(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters, currentPage]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Available Jobs</h1>
        {user?.role === 'client' && (
          <a
            href="/post-job"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            + Post a Job
          </a>
        )}
      </div>
      
      <JobSearch filters={filters} setFilters={setFilters} />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <JobCard key={job._id} job={job} onUpdate={fetchJobs} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableJobs;