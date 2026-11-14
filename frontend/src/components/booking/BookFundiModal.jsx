/**
 * BookFundiModal
 * ==============
 * The short booking form: service category, sub-service and an optional
 * description. Nothing else — the Fundi gets the client's phone number on the
 * booking and calls to understand the work and agree on a quotation. The rest
 * of the flow (quotation → work → proof → rating) still happens on the site.
 *
 * When the client came from a search, `presetCategory` / `presetSubService`
 * carry their choice so they don't have to pick it again.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, AlertCircle, Check, Phone } from 'lucide-react';
import api from '../../services/api';

const BookFundiModal = ({
  technicianId,
  fundiName = 'this Fundi',
  expertTerm = 'Fundi', // what the group calls its experts (Stylist, Tutor, …)
  serviceCategories = [], // the Fundi's [{ categoryName, subServices: [] }]
  presetCategory = '',
  presetSubService = '',
  onClose,
}) => {
  const navigate = useNavigate();
  const hasPreset = Boolean(presetCategory && presetSubService);

  const firstCat = serviceCategories[0];
  const [serviceCategory, setServiceCategory] = useState(
    presetCategory || firstCat?.categoryName || ''
  );
  const [subService, setSubService] = useState(
    presetSubService || (presetCategory ? '' : firstCat?.subServices?.[0] || '')
  );
  const [serviceDescription, setServiceDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const subOptions =
    serviceCategories.find((c) => c.categoryName === serviceCategory)?.subServices ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceCategory || !subService) {
      setError('Please choose the service you need.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/bookings', {
        technicianId,
        serviceCategory,
        subService,
        serviceDescription: serviceDescription.trim(),
      });
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/bookings'), 1500);
      } else {
        setError(response.data.message || 'Failed to book.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'No response from server. Check your connection.' : err.message) ||
          'Failed to book.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Book {fundiName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Booked! {fundiName} will call you shortly.</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {hasPreset ? (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service category</p>
                <p className="text-gray-800 font-medium">{serviceCategory}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub-service</p>
                <p className="text-gray-800 font-medium">{subService}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => {
                    setServiceCategory(e.target.value);
                    const cat = serviceCategories.find((c) => c.categoryName === e.target.value);
                    setSubService(cat?.subServices?.[0] || '');
                    setError('');
                  }}
                  className={fieldClass}
                  required
                >
                  <option value="">Select a category</option>
                  {serviceCategories.map((cat) => (
                    <option key={cat.categoryName} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-service</label>
                <select
                  value={subService}
                  onChange={(e) => {
                    setSubService(e.target.value);
                    setError('');
                  }}
                  className={fieldClass}
                  required
                >
                  <option value="">Select a sub-service</option>
                  {subOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className={`${fieldClass} h-20 resize-y`}
              placeholder="Briefly describe the work, if you like…"
              maxLength={1000}
            />
          </div>

          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Your phone number is shared with {fundiName} so they can call you, understand the job and agree on a
            quotation.
          </p>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Booking…
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                Booked!
              </>
            ) : (
              `Book ${expertTerm}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookFundiModal;
