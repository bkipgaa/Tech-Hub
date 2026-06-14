/**
 * JobSearch Component
 * ===================
 * 
 * Provides search and filter functionality for jobs
 * Features:
 * - Category/sub-category cascade selection
 * - Location search
 * - Budget range filtering
 * - Urgent jobs filter
 * - Clear all filters option
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const JobSearch = ({ filters, setFilters }) => {
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);

  /**
   * Fetch main categories on component mount
   * Gets all available service categories from the backend
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/service-catalog/main-categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  /**
   * Fetch service categories when main category changes
   * Cascade dropdown: Main Category -> Service Category -> Sub-Service
   */
  useEffect(() => {
    if (filters.mainCategory) {
      const fetchServiceCategories = async () => {
        try {
          const response = await api.get(`/service-catalog/${filters.mainCategory}/service-categories`);
          setServiceCategories(response.data.data || []);
        } catch (err) {
          console.error('Error fetching service categories:', err);
        }
      };
      fetchServiceCategories();
    } else {
      setServiceCategories([]);
    }
    // Reset dependent filters
    setFilters(prev => ({ ...prev, serviceCategory: '', subService: '' }));
    setSubServices([]);
  }, [filters.mainCategory, setFilters]);

  /**
   * Fetch sub-services when service category changes
   * Third level of cascade dropdown
   */
  useEffect(() => {
    if (filters.mainCategory && filters.serviceCategory) {
      const fetchSubServices = async () => {
        try {
          const response = await api.get(`/service-catalog/${filters.mainCategory}/${filters.serviceCategory}/sub-services`);
          setSubServices(response.data.data?.subServices || []);
        } catch (err) {
          console.error('Error fetching sub-services:', err);
        }
      };
      fetchSubServices();
    } else {
      setSubServices([]);
    }
  }, [filters.mainCategory, filters.serviceCategory]);

  /**
   * Handle filter input changes
   * @param {Event} e - Input change event
   */
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Reset all filters to default values
   */
  const clearFilters = () => {
    setFilters({
      mainCategory: '',
      serviceCategory: '',
      subService: '',
      location: '',
      minBudget: '',
      maxBudget: '',
      isUrgent: false
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Search & Filter Jobs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Category
          </label>
          <select
            name="mainCategory"
            value={filters.mainCategory}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        {/* Service Category Dropdown - Depends on Main Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Category
          </label>
          <select
            name="serviceCategory"
            value={filters.serviceCategory}
            onChange={handleFilterChange}
            disabled={!filters.mainCategory}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Services</option>
            {serviceCategories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        {/* Sub-Service Dropdown - Depends on Service Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Service
          </label>
          <select
            name="subService"
            value={filters.subService}
            onChange={handleFilterChange}
            disabled={!filters.serviceCategory}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Sub-Services</option>
            {subServices.map(service => (
              <option key={service.name} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>
        
        {/* Location Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="City or area"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Minimum Budget Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Budget (KES)
          </label>
          <input
            type="number"
            name="minBudget"
            value={filters.minBudget}
            onChange={handleFilterChange}
            placeholder="Min"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Maximum Budget Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Budget (KES)
          </label>
          <input
            type="number"
            name="maxBudget"
            value={filters.maxBudget}
            onChange={handleFilterChange}
            placeholder="Max"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Urgent Jobs Filter */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isUrgent"
              checked={filters.isUrgent}
              onChange={handleFilterChange}
              className="w-4 h-4 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">Urgent Jobs Only</span>
          </label>
        </div>
        
        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;