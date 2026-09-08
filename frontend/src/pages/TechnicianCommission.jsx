/**
 * TechnicianCommission.jsx
 * =========================
 * Page for technicians to view and submit pending commissions for invoicing.
 * 
 * Features:
 * - Shows total pending commission amount and count.
 * - Lists all bookings with commission details.
 * - "Submit for Payment" button to mark all pending commissions as "invoiced".
 * - Confirmation modal before submission.
 * - Responsive design with error handling.
 * 
 * @version 2.0.0 – Updated to match new API design
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Loader2,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import api from '../services/api';

const TechnicianCommission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── STATE ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commissionsData, setCommissionsData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ─── FETCH COMMISSIONS ──────────────────────────────────────

  const fetchCommissions = async () => {
    setLoading(true);
    setError('');
    try {
      // GET /api/bookings/commissions
      const response = await api.get('/bookings/commissions');
      if (response.data.success) {
        setCommissionsData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load commissions.');
      }
    } catch (err) {
      console.error('Fetch commissions error:', err);
      setError('Could not load commissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if not technician
    if (user && user.role !== 'technician') {
      navigate('/');
      return;
    }
    fetchCommissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── SUBMIT COMMISSIONS FOR INVOICING ─────────────────────

  const handleSubmitForPayment = async () => {
    setSubmitting(true);
    setError('');
    try {
      // POST /api/bookings/commissions/submit
      const response = await api.post('/bookings/commissions/submit');
      if (response.data.success) {
        // Refresh after success
        await fetchCommissions();
        setShowConfirmModal(false);
        // Show success message (using alert for simplicity; you can replace with a toast)
        alert('Commissions submitted for invoicing successfully!');
      } else {
        setError(response.data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Could not submit commissions. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-800 mx-auto" />
          <p className="mt-4 text-gray-600">Loading commissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchCommissions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Destructure from new response shape
  const { summary, commissions = [] } = commissionsData || {};
  const totalPending = summary?.totalPending || 0;
  const count = summary?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Commission Dashboard</h1>
        </div>

        {/* ─── SUMMARY CARD ───────────────────────────────────── */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Pending Commission</p>
              <p className="text-3xl font-bold text-green-800">KES {totalPending.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{count} booking{count !== 1 ? 's' : ''} with pending commission</p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={count === 0}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                count === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Submit for Payment
            </button>
          </div>
        </div>

        {/* ─── BOOKINGS LIST ──────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Commission Details</h2>
          {commissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending commissions. Great job!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Booking</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Labor Cost</th>
                    <th className="px-4 py-3 text-left">Commission (5%)</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commissions.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        #{booking.bookingId.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {booking.service} <span className="text-xs text-gray-400">({booking.subService})</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">KES {booking.laborCost.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-green-700">KES {booking.commissionAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(booking.createdAt).toLocaleDateString('en-KE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-green-800">KES {totalPending.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── CONFIRMATION MODAL ──────────────────────────────── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit for Invoicing</h3>
            <p className="text-gray-600 mb-4">
              You are about to submit <strong>KES {totalPending.toLocaleString()}</strong> in pending commissions for invoicing.
              This will mark them as <strong>invoiced</strong>. Once submitted, they will be processed by our team.
              Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForPayment}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianCommission;