import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Briefcase, DollarSign } from 'lucide-react';
import api from '../../services/api';

const TechnicianDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchTechnician();
  }, [id]);

  const fetchTechnician = async () => {
    try {
      const response = await api.get(`/admin/technicians/${id}`);
      setTechnician(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load technician');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await api.put(`/admin/technicians/${id}/verify`, { remarks: 'Verified by admin' });
      await fetchTechnician();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify technician');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    setVerifying(true);
    try {
      await api.put(`/admin/technicians/${id}/reject`, { reason: rejectReason });
      await fetchTechnician();
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject technician');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!technician) {
    return <div>Technician not found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/technicians')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">
            {technician.userId?.firstName} {technician.userId?.lastName}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            technician.verificationStatus === 'verified' 
              ? 'bg-green-100 text-green-700'
              : technician.verificationStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {technician.verificationStatus}
          </span>
        </div>
        
        {technician.verificationStatus === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={verifying}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              Reject
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {verifying ? 'Processing...' : 'Verify'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {technician.userId?.email}</p>
          </div>
          <div>
            <label className="text-gray-500 text-sm">Phone</label>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {technician.userId?.phone}</p>
          </div>
        </div>

        {/* Business Info */}
        <div>
          <h3 className="font-semibold mb-2">Business Information</h3>
          <p><strong>Business Name:</strong> {technician.businessName || 'N/A'}</p>
          <p><strong>Years Experience:</strong> {technician.yearsOfExperience || 0}</p>
        </div>

        {/* Subscription */}
        <div>
          <h3 className="font-semibold mb-2">Subscription</h3>
          <p><strong>Plan:</strong> {technician.subscription?.plan || 'Free'}</p>
          <p><strong>Visibility Radius:</strong> {technician.serviceRadius || 10}km</p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reject Technician</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border rounded-lg mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDetails;