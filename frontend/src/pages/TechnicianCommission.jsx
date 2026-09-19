/**
 * TechnicianCommission.jsx
 * =========================
 * Page for technicians to view and pay pending/invoiced commissions via Paystack.
 *
 * Flow:
 *   1. Load commissions (GET /api/bookings/commissions) — includes pending + invoiced
 *   2. Technician clicks "Pay with Card"
 *   3. POST /api/payments/commissions/initialize → returns authorization_url
 *   4. Redirect to Paystack hosted checkout
 *   5. Paystack redirects back to /payment-callback?type=commission&reference=...
 *   6. Callback page verifies via GET /api/payments/commissions/verify
 *   7. Webhook also fires (idempotent) and marks bookings paid
 *
 * @version 3.1.0 – Shows pending + invoiced with breakdown
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

// ─── STATUS BADGE COMPONENT ─────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    invoiced: {
      label: 'Invoiced',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    paid: {
      label: 'Paid',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
  };
  const { label, className } = config[status] || config.pending;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
      {label}
    </span>
  );
};

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
      const response = await api.get('/bookings/commissions');
      if (response.data.success) {
        setCommissionsData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load commissions.');
      }
    } catch (err) {
      console.error('Fetch commissions error:', err);
      setError(
        err.response?.data?.message ||
          'Could not load commissions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'technician') {
      navigate('/');
      return;
    }
    fetchCommissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── INITIATE PAYSTACK PAYMENT ─────────────────────────────
  const handlePayWithCard = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await api.post('/payments/commissions/initialize', {});
      const payload = response.data;

      if (!payload?.success || !payload?.data?.authorization_url) {
        throw new Error(
          payload?.message || 'Could not start payment. Please try again.'
        );
      }

      window.location.href = payload.data.authorization_url;
    } catch (err) {
      console.error('Payment init error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not start payment. Please try again.'
      );
      setSubmitting(false);
    }
  };

  // ─── RENDER: LOADING ───────────────────────────────────────
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

  // ─── RENDER: ERROR ─────────────────────────────────────────
  if (error && !commissionsData) {
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

  // ─── DERIVED VALUES ────────────────────────────────────────
  const { summary, commissions = [] } = commissionsData || {};

  // New shape (post-update): totalDue / totalPending / totalInvoiced
  // Fallback to old shape (totalPending) for backward compatibility
  const totalDue      = summary?.totalDue      ?? summary?.totalPending ?? 0;
  const totalPending  = summary?.totalPending  ?? summary?.totalPending ?? 0;
  const totalInvoiced = summary?.totalInvoiced ?? 0;
  const count         = summary?.count         || 0;

  const hasInvoiced = totalInvoiced > 0;

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Commission Dashboard
          </h1>
        </div>

        {/* ─── SUMMARY CARD ───────────────────────────────────── */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-green-700 font-medium">
                Total Amount Due
              </p>
              <p className="text-3xl font-bold text-green-800">
                KES {totalDue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {count} booking{count !== 1 ? 's' : ''}
                {hasInvoiced && (
                  <>
                    {' '}·{' '}
                    <span className="text-blue-700">
                      KES {totalInvoiced.toLocaleString()} previously invoiced
                    </span>
                  </>
                )}
              </p>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={count === 0 || totalDue === 0}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                count === 0 || totalDue === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Pay with Card
            </button>
          </div>

          {/* ─── BREAKDOWN ROW (only if invoiced exists) ────── */}
          {hasInvoiced && (
            <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-yellow-700 font-semibold">
                  Pending
                </p>
                <p className="text-lg font-bold text-yellow-800">
                  KES {totalPending.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                  Invoiced (submitted)
                </p>
                <p className="text-lg font-bold text-blue-800">
                  KES {totalInvoiced.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── BOOKINGS LIST ──────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Commission Details
          </h2>
          {commissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pending commissions. Great job!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Booking</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Labor Cost</th>
                    <th className="px-4 py-3 text-left">Commission (5%)</th>
                    <th className="px-4 py-3 text-left">Status</th>
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
                        {booking.service}{' '}
                        <span className="text-xs text-gray-400">
                          ({booking.subService})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        KES {booking.laborCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-700">
                        KES {booking.commissionAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(booking.createdAt).toLocaleDateString(
                          'en-KE',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">
                      Total Due:
                    </td>
                    <td className="px-4 py-3 text-green-800">
                      KES {totalDue.toLocaleString()}
                    </td>
                    <td colSpan="2"></td>
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
          onClick={() => !submitting && setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Pay Commissions
            </h3>

            <p className="text-gray-600 mb-4">
              You are about to pay{' '}
              <strong>KES {totalDue.toLocaleString()}</strong> for{' '}
              {count} commission{count !== 1 ? 's' : ''} using your card via
              Paystack.
            </p>

            {/* Breakdown inside modal when invoiced exists */}
            {hasInvoiced && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-800">
                    KES {totalPending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Previously invoiced:</span>
                  <span className="font-medium text-blue-800">
                    KES {totalInvoiced.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                  <span className="text-gray-800 font-semibold">Total:</span>
                  <span className="font-bold text-green-700">
                    KES {totalDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs mb-4">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Payment is processed securely by Paystack. We never see or
                store your card details.
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayWithCard}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay KES {totalDue.toLocaleString()}
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