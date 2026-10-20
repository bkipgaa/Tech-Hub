import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Value of the "Other (type it)" option in the category dropdowns
const OTHER = '__other__';

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

  // Typed values for any level set to "Other"
  const [typed, setTypedState] = useState({ main: '', service: '', sub: '' });
  const setTyped = (key) => (e) => setTypedState((t) => ({ ...t, [key]: e.target.value }));
  const mainIsOther = formData.mainCategory === OTHER;
  const serviceIsOther = formData.serviceCategory === OTHER;
  const subIsOther = formData.subService === OTHER;

  useEffect(() => {
    if (formData.mainCategory && !mainIsOther) {
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
  }, [formData.mainCategory, mainIsOther]);

  useEffect(() => {
    if (formData.mainCategory && formData.serviceCategory && !mainIsOther && !serviceIsOther) {
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
  }, [formData.mainCategory, formData.serviceCategory, mainIsOther, serviceIsOther]);

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
      // "Other" levels send what was typed; anything left empty is "N/A"
      const pick = (selected, typedValue, other) => (other ? typedValue.trim() : selected) || 'N/A';
      const payload = {
        ...formData,
        mainCategory: mainIsOther ? typed.main.trim() : formData.mainCategory,
        serviceCategory: pick(formData.serviceCategory, typed.service, mainIsOther || serviceIsOther),
        subService: pick(formData.subService, typed.sub, mainIsOther || serviceIsOther || subIsOther),
      };
      await jobService.createJob(payload);
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
        
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main category: from the catalog, or "Other" to type one */}
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
                <option value={OTHER}>Other (type it)</option>
              </select>
              {mainIsOther && (
                <input
                  type="text"
                  value={typed.main}
                  onChange={setTyped('main')}
                  required
                  maxLength={80}
                  className="mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Type the category, e.g. Car Wash"
                />
              )}
            </div>

            {/* Service category: optional */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Service Category</label>
              {mainIsOther ? (
                <input
                  type="text"
                  value={typed.service}
                  onChange={setTyped('service')}
                  maxLength={80}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Optional, e.g. Mobile car wash"
                />
              ) : (
                <>
                  <select
                    name="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={handleChange}
                    disabled={!formData.mainCategory}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Not sure (N/A)</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value={OTHER}>Other (type it)</option>
                  </select>
                  {serviceIsOther && (
                    <input
                      type="text"
                      value={typed.service}
                      onChange={setTyped('service')}
                      maxLength={80}
                      className="mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Type the service category"
                    />
                  )}
                </>
              )}
            </div>

            {/* Sub-service: optional */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Sub-Service</label>
              {mainIsOther || serviceIsOther ? (
                <input
                  type="text"
                  value={typed.sub}
                  onChange={setTyped('sub')}
                  maxLength={80}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Optional, or leave blank for N/A"
                />
              ) : (
                <>
                  <select
                    name="subService"
                    value={formData.subService}
                    onChange={handleChange}
                    disabled={!formData.serviceCategory}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Not sure (N/A)</option>
                    {subServices.map(service => (
                      <option key={service.name} value={service.name}>{service.name}</option>
                    ))}
                    <option value={OTHER}>Other (type it)</option>
                  </select>
                  {subIsOther && (
                    <input
                      type="text"
                      value={typed.sub}
                      onChange={setTyped('sub')}
                      maxLength={80}
                      className="mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Type the sub-service"
                    />
                  )}
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Can't find your category? Choose <strong>Other</strong> and type it. Service category and sub-service are optional.
          </p>
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