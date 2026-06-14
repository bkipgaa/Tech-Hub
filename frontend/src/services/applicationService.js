import api from './api';

const applicationService = {
  // Apply for a job
  applyForJob: async (jobId, applicationData) => {
    const response = await api.post(`/job-applications/apply/${jobId}`, applicationData);
    return response.data;
  },

  // Get my applications (technician)
  getMyApplications: async (status = 'all', page = 1, limit = 20) => {
    const response = await api.get(`/job-applications/my-applications?status=${status}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get applications for my jobs (client)
  getApplicationsForMyJobs: async (status = 'all', page = 1, limit = 20) => {
    const response = await api.get(`/job-applications/my-job-applications?status=${status}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get application details
  getApplicationDetails: async (applicationId) => {
    const response = await api.get(`/job-applications/${applicationId}`);
    return response.data;
  },

  // Accept application (client)
  acceptApplication: async (applicationId, bookingNotes = '') => {
    const response = await api.put(`/job-applications/${applicationId}/accept`, { bookingNotes });
    return response.data;
  },

  // Reject application (client)
  rejectApplication: async (applicationId, rejectionReason = '') => {
    const response = await api.put(`/job-applications/${applicationId}/reject`, { rejectionReason });
    return response.data;
  },

  // Withdraw application (technician)
  withdrawApplication: async (applicationId, reason = '') => {
    const response = await api.put(`/job-applications/${applicationId}/withdraw`, { reason });
    return response.data;
  },

  // Send message on application
  sendMessage: async (applicationId, message, attachments = []) => {
    const response = await api.post(`/job-applications/${applicationId}/messages`, { message, attachments });
    return response.data;
  },

  // Get messages
  getMessages: async (applicationId) => {
    const response = await api.get(`/job-applications/${applicationId}/messages`);
    return response.data;
  },

  // Get application stats for a job
  getJobApplicationStats: async (jobId) => {
    const response = await api.get(`/job-applications/job/${jobId}/stats`);
    return response.data;
  }
};

export default applicationService;