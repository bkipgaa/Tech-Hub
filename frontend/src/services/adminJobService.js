/**
 * Admin Job Service
 * =================
 * 
 * Handles all admin-level job API calls
 */

import api from './api';

const adminJobService = {
  // Get all jobs with filters
  getAllJobs: async (filters = {}, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    const response = await api.get(`/admin/jobs?${params}`);
    return response.data;
  },

  // Get pending jobs for verification
  getPendingJobs: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/jobs/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single job details (admin view)
  getJobDetails: async (jobId) => {
    const response = await api.get(`/admin/jobs/${jobId}`);
    return response.data;
  },

  // Approve a job
  approveJob: async (jobId, adminNotes = '') => {
    const response = await api.put(`/admin/jobs/${jobId}/approve`, { adminNotes });
    return response.data;
  },

  // Reject a job
  rejectJob: async (jobId, reason, adminNotes = '') => {
    const response = await api.put(`/admin/jobs/${jobId}/reject`, { reason, adminNotes });
    return response.data;
  },

  // Bulk approve jobs
  bulkApproveJobs: async (jobIds, adminNotes = '') => {
    const response = await api.post('/admin/jobs/bulk-approve', { jobIds, adminNotes });
    return response.data;
  },

  // Bulk reject jobs
  bulkRejectJobs: async (jobIds, reason, adminNotes = '') => {
    const response = await api.post('/admin/jobs/bulk-reject', { jobIds, reason, adminNotes });
    return response.data;
  },

  // Feature a job
  featureJob: async (jobId, days = 7) => {
    const response = await api.put(`/admin/jobs/${jobId}/feature`, { days });
    return response.data;
  },

  // Unfeature a job
  unfeatureJob: async (jobId) => {
    const response = await api.put(`/admin/jobs/${jobId}/unfeature`);
    return response.data;
  },

  // Get admin job statistics
  getAdminStats: async () => {
    const response = await api.get('/admin/jobs/stats');
    return response.data;
  },

  // Export jobs data
  exportJobs: async (filters = {}, format = 'json') => {
    const params = new URLSearchParams({ format, ...filters });
    const response = await api.get(`/admin/jobs/export?${params}`);
    return response.data;
  }
};

export default adminJobService;