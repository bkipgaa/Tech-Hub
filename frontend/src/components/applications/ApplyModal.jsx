/**
 * ApplyModal Component
 * ====================
 * 
 * Modal form for technicians to apply for a job
 * Features:
 * - Cover letter/message input
 * - Optional proposed price (can be different from job budget)
 * - Estimated days to complete
 * - Availability date selection
 * - Form validation
 * - Loading state during submission
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';

const ApplyModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    coverMessage: '',
    proposedPrice: job.budget || '',
    estimatedDays: '',
    estimatedHours: '',
    availableFrom: ''
  });

  /**
   * Handle form input changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Validate form before submission
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    if (!formData.coverMessage.trim()) {
      setError('Please provide a cover message explaining why you are suitable for this job');
      return false;
    }
    
    if (formData.proposedPrice && formData.proposedPrice < 0) {
      setError('Proposed price cannot be negative');
      return false;
    }
    
    if (formData.estimatedDays && formData.estimatedDays < 0.5) {
      setError('Estimated days must be at least 0.5 days');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const applicationData = {
        coverMessage: formData.coverMessage,
        proposedPrice: formData.proposedPrice || job.budget,
        estimatedDays: formData.estimatedDays || null,
        estimatedHours: formData.estimatedHours || null,
        availableFrom: formData.availableFrom || null
      };
      
      await applicationService.applyForJob(job._id, applicationData);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Apply for Job</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">{job.title}</p>
        </div>

        {/* Modal Body - Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Cover Message */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Cover Message *
            </label>
            <textarea
              name="coverMessage"
              value={formData.coverMessage}
              onChange={handleChange}
              required
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Introduce yourself and explain why you're the best fit for this job...
              
Example:
- Your relevant experience
- Why you're interested in this job
- Your approach to this type of work
- Any relevant certifications or equipment you have"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific and professional to increase your chances of getting hired
            </p>
          </div>

          {/* Proposed Price (Optional) */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Proposed Price (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="proposedPrice"
                value={formData.proposedPrice}
                onChange={handleChange}
                min="0"
                step="100"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder={job.budget}
              />
              <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                {job.currency || 'KES'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to accept the client's budget of {job.currency || 'KES'} {job.budget.toLocaleString()}
            </p>
          </div>

          {/* Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Estimated Days
              </label>
              <input
                type="number"
                name="estimatedDays"
                value={formData.estimatedDays}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 8"
              />
            </div>
          </div>

          {/* Availability Date */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Available From (Optional)
            </label>
            <input
              type="date"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;