import api from './api';

const jobService = {
  // Create a new job
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Get available jobs (public)
  getAvailableJobs: async (filters = {}, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    const response = await api.get(`/jobs/available?${params}`);
    return response.data;
  },

  // Get job details
  getJobDetails: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Get my jobs (client)
  getMyJobs: async (status = 'all', page = 1, limit = 20) => {
    const response = await api.get(`/jobs/my-jobs?status=${status}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Update job (only pending)
  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Delete job (only pending)
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Search jobs
  searchJobs: async (query, category, location) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    const response = await api.get(`/jobs/search?${params}`);
    return response.data;
  },

  // Get job statistics
  getJobStats: async () => {
    const response = await api.get('/jobs/stats/my');
    return response.data;
  }
};

export default jobService