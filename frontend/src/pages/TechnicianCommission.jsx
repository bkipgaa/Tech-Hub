/**
 * TechnicianCommission.jsx
 * =========================
 * Page for technicians to view and pay their booking commissions.
 *
 * Flow:
 *   1. Load commissions (GET /api/bookings/commissions) — pending + invoiced,
 *      with due dates (30 days after the work) and overdue status
 *   2. Technician clicks "Pay Commission" and picks M-Pesa or Card
 *   3. POST /api/payments/commissions/initialize
 *        M-Pesa → STK prompt on the phone; poll
 *                 GET /api/payments/commissions/mpesa-status until paid/failed
 *        Card   → redirect to Paystack; /payment-callback verifies on return
 *
 * Overdue commissions pause new bookings; 60 days after the due date the
 * technician is hidden from search.
 *
 * @version 4.0.0 – M-Pesa STK push, due dates, overdue warnings
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../services/api';

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

// ─── STATUS BADGE COMPONENT ─────────────────────────────────
const StatusBadge = ({ status, overdue }) => {
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
    overdue: {
      label: 'Overdue',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };
  const { label, className } = config[overdue ? 'overdue' : status] || config.pending;
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
  const [showPayModal, setShowPayModal] = useState(false);
  const [method, setMethod] = useState('mpesa'); // 'mpesa' | 'card'
  const [phone, setPhone] = useState(user?.phone || '');
  // M-Pesa progress: null | 'waiting' | 'success' | 'failed'
  const [mpesaStage, setMpesaStage] = useState(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [checkoutRequestID, setCheckoutRequestID] = useState(null);
  const pollStartedAt = useRef(null);

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

  // ─── POLL M-PESA STATUS ────────────────────────────────────
  useEffect(() => {
    if (mpesaStage !== 'waiting' || !checkoutRequestID) return undefined;

    const timer = setInterval(async () => {
      if (Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setMpesaStage('failed');
        setMpesaMessage(
          "We didn't get a confirmation in time. If you completed the payment, refresh this page in a minute."
        );
        return;
      }
      try {
        const response = await api.get('/payments/commissions/mpesa-status', {
          params: { checkoutRequestID },
        });
        const { status, message } = response.data?.data || {};
        if (status === 'success') {
          clearInterval(timer);
          setMpesaStage('success');
          setMpesaMessage(message || 'Payment received. Thank you!');
          fetchCommissions();
        } else if (status === 'failed') {
          clearInterval(timer);
          setMpesaStage('failed');
          setMpesaMessage(message || 'Payment failed. Please try again.');
        }
      } catch (err) {
        // Network blip — keep polling until the timeout
        console.warn('M-Pesa status poll error:', err.message);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpesaStage, checkoutRequestID]);

  // ─── PAY ───────────────────────────────────────────────────
  const handlePay = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (method === 'mpesa') {
        if (!phone.trim()) throw new Error('Enter your M-Pesa phone number.');
        const response = await api.post('/payments/commissions/initialize', {
          paymentMethod: 'mpesa',
          phoneNumber: phone.trim(),
        });
        const payload = response.data;
        if (!payload?.success || !payload?.data?.checkoutRequestID) {
          throw new Error(payload?.message || 'Could not send the M-Pesa prompt. Please try again.');
        }
        setCheckoutRequestID(payload.data.checkoutRequestID);
        setMpesaMessage(payload.data.customerMessage || 'Check your phone and enter your M-Pesa PIN.');
        pollStartedAt.current = Date.now();
        setMpesaStage('waiting');
        setSubmitting(false);
        return;
      }

      const response = await api.post('/payments/commissions/initialize', { paymentMethod: 'card' });
      const payload = response.data;
      if (!payload?.success || !payload?.data?.authorization_url) {
        throw new Error(payload?.message || 'Could not start payment. Please try again.');
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

  const openPayModal = () => {
    setError('');
    setMpesaStage(null);
    setMpesaMessage('');
    setCheckoutRequestID(null);
    setShowPayModal(true);
  };

  const closePayModal = () => {
    if (submitting || mpesaStage === 'waiting') return;
    setShowPayModal(false);
  };

  // ─── RENDER: LOADING ───────────────────────────────────────
  if (loading && !commissionsData) {
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

  const totalDue = summary?.totalDue ?? summary?.totalPending ?? 0;
  const count = summary?.count || 0;
  const canPay = count > 0 && totalDue > 0;

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

        {/* ─── OVERDUE WARNING ────────────────────────────────── */}
        {summary?.isOverdue && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              {summary.hiddenFromSearch ? (
                <>
                  <p className="font-semibold">Your profile is hidden from search.</p>
                  <p className="mt-0.5">
                    Your commission has been overdue since {formatDate(summary.earliestDue)}.
                    Pay now to appear in search and receive bookings again.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">New bookings are paused.</p>
                  <p className="mt-0.5">
                    Your commission was due on {formatDate(summary.earliestDue)}. Clients can't book you
                    until it's paid. If it's still unpaid on {formatDate(summary.hiddenFromSearchAt)}, your
                    profile will be hidden from search.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

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
                {summary?.earliestDue && !summary?.isOverdue && (
                  <> · next due {formatDate(summary.earliestDue)}</>
                )}
              </p>
            </div>

            <button
              onClick={openPayModal}
              disabled={!canPay}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                !canPay
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              Pay Commission
            </button>
          </div>
          <p className="text-xs text-green-700 mt-3">
            Commission is 5% of the labor amount you receive, payable within 30 days of completing the work.
          </p>
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
                    <th className="px-4 py-3 text-left">Labor</th>
                    <th className="px-4 py-3 text-left">Commission (5%)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Due</th>
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
                        <StatusBadge status={booking.status} overdue={booking.isOverdue} />
                      </td>
                      <td className={`px-4 py-3 text-xs ${booking.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(booking.dueAt)}
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

      {/* ─── PAY MODAL ───────────────────────────────────────── */}
      {showPayModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closePayModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Pay KES {totalDue.toLocaleString()}
            </h3>

            {/* M-Pesa in progress / finished */}
            {mpesaStage ? (
              <div className="text-center py-4">
                {mpesaStage === 'waiting' && (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
                    <p className="mt-4 font-medium text-gray-800">Check your phone</p>
                    <p className="text-sm text-gray-600 mt-1">{mpesaMessage}</p>
                    <p className="text-xs text-gray-400 mt-3">Waiting for M-Pesa confirmation…</p>
                  </>
                )}
                {mpesaStage === 'success' && (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="mt-4 font-medium text-gray-800">Payment received</p>
                    <p className="text-sm text-gray-600 mt-1">{mpesaMessage}</p>
                  </>
                )}
                {mpesaStage === 'failed' && (
                  <>
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="mt-4 font-medium text-gray-800">Payment not completed</p>
                    <p className="text-sm text-gray-600 mt-1">{mpesaMessage}</p>
                  </>
                )}
                {mpesaStage !== 'waiting' && (
                  <div className="flex gap-3 mt-6">
                    {mpesaStage === 'failed' && (
                      <button
                        onClick={() => setMpesaStage(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Try again
                      </button>
                    )}
                    <button
                      onClick={closePayModal}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Method choice */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMethod(id)}
                      disabled={submitting}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                        method === id
                          ? 'border-green-600 bg-green-50 text-green-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>

                {method === 'mpesa' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      M-Pesa phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You'll get a prompt on this phone to enter your M-Pesa PIN.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs mb-4">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      You'll be taken to Paystack to pay securely. We never see or store your card details.
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closePayModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {method === 'mpesa' ? 'Sending prompt...' : 'Redirecting...'}
                      </>
                    ) : (
                      <>Pay KES {totalDue.toLocaleString()}</>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianCommission;
