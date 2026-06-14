import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [mainCategories, setMainCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mainCategory: '',
    serviceCategory: '',
    subService: '',
    address: '',
    location: '',
    budget: '',
    currency: 'KES',
    pricingType: 'fixed',
    hourlyRate: '',
    preferredStartDate: '',
    isUrgent: false,
    requirements: [],
    newRequirement: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/service-catalog/main-categories');
        setMainCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.mainCategory) {
      const fetchServiceCategories = async () => {
        try {
          const response = await api.get(`/service-catalog/${formData.mainCategory}/service-categories`);
          setServiceCategories(response.data.data || []);
        } catch (err) {
          console.error('Error fetching service categories:', err);
        }
      };
      fetchServiceCategories();
    } else {
      setServiceCategories([]);
    }
    setFormData(prev => ({ ...prev, serviceCategory: '', subService: '' }));
    setSubServices([]);
  }, [formData.mainCategory]);

  useEffect(() => {
    if (formData.mainCategory && formData.serviceCategory) {
      const fetchSubServices = async () => {
        try {
          const response = await api.get(`/service-catalog/${formData.mainCategory}/${formData.serviceCategory}/sub-services`);
          setSubServices(response.data.data?.subServices || []);
        } catch (err) {
          console.error('Error fetching sub-services:', err);
        }
      };
      fetchSubServices();
    } else {
      setSubServices([]);
    }
  }, [formData.mainCategory, formData.serviceCategory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addRequirement = () => {
    if (formData.newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, prev.newRequirement.trim()],
        newRequirement: ''
      }));
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await jobService.createJob(formData);
      setSuccess('Job posted successfully! Awaiting admin approval.');
      setTimeout(() => {
        navigate('/my-jobs');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Post a New Job</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Job Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Need Electrician for Office Wiring"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Detailed Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Describe the job requirements, timeline, special instructions..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Main Category *</label>
            <select
              name="mainCategory"
              value={formData.mainCategory}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select Main Category</option>
              {mainCategories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Service Category *</label>
            <select
              name="serviceCategory"
              value={formData.serviceCategory}
              onChange={handleChange}
              required
              disabled={!formData.mainCategory}
              className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
            >
              <option value="">Select Service Category</option>
              {serviceCategories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sub-Service *</label>
            <select
              name="subService"
              value={formData.subService}
              onChange={handleChange}
              required
              disabled={!formData.serviceCategory}
              className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
            >
              <option value="">Select Sub-Service</option>
              {subServices.map(service => (
                <option key={service.name} value={service.name}>{service.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Street Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="123 Main St, Suite 100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">City/Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Nairobi, Kenya"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Budget Amount *</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                min="0"
                className="flex-1 px-4 py-2 border rounded-lg"
                placeholder="50000"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-24 px-2 py-2 border rounded-lg"
              >
                <option>KES</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Pricing Type</label>
            <select
              name="pricingType"
              value={formData.pricingType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </div>
        </div>
        
        {formData.pricingType === 'hourly' && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Hourly Rate</label>
            <input
              type="number"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="1000"
            />
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Preferred Start Date</label>
          <input
            type="date"
            name="preferredStartDate"
            value={formData.preferredStartDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Requirements</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={formData.newRequirement}
              onChange={(e) => setFormData(prev => ({ ...prev, newRequirement: e.target.value }))}
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="e.g., Must have own tools"
            />
            <button
              type="button"
              onClick={addRequirement}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.requirements.map((req, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                {req}
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isUrgent"
            checked={formData.isUrgent}
            onChange={handleChange}
            className="w-5 h-5"
          />
          <label className="text-gray-700 font-semibold">
            Mark as Urgent (Job will be highlighted)
          </label>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Posting...' : 'Post Job for Approval'}
        </button>
      </form>
    </div>
  );
};

export default PostJob;