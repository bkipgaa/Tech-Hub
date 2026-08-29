/**
 * TechnicianBookings.jsx
 * =======================
 * Technician page to manage bookings.
 * 
 * Features:
 * - View all bookings for the logged-in technician
 * - Filter by status (pending, confirmed, in-progress, completed, cancelled)
 * - Confirm pending bookings
 * - Start confirmed bookings
 * - Complete in-progress bookings
 * - Cancel bookings (if needed)
 * - View booking details
 * - Responsive design with comprehensive error handling
 * 
 * @version 1.0.0
 * @author Weba-Hub Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Play,
  CheckSquare,
  Ban,
} from 'lucide-react';
import api from '../services/api';

// ============================================================
// HELPER COMPONENTS
// ============================================================

/**
 * StatusBadge Component
 * Displays a coloured badge based on booking status.
 */
const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="w-3 h-3 mr-1" />,
    },
    confirmed: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
    },
    'in-progress': {
      label: 'In Progress',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="w-3 h-3 mr-1" />,
    },
    'no-show': {
      label: 'No Show',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <AlertCircle className="w-3 h-3 mr-1" />,
    },
  };
  const { label, color, icon } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {icon}
      {label}
    </span>
  );
};

/**
 * SkeletonLoader Component
 * Shows a loading skeleton while bookings are being fetched.
 */
const SkeletonLoader = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="flex flex-wrap gap-3">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * TechnicianBookings Component
 * Main page for technicians to manage their bookings.
 */
const TechnicianBookings = () => {
  const navigate = useNavigate();

  // ─── STATE ────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Action modals state ──
  const [actionModal, setActionModal] = useState({
    open: false,
    bookingId: null,
    action: '', // 'confirm', 'start', 'complete', 'cancel'
    title: '',
    message: '',
    buttonText: '',
    buttonColor: '',
    loading: false,
    error: '',
  });

  // ─── API CALLS ───────────────────────────────────────────────

  /**
   * fetchBookings()
   * ---------------
   * Fetches bookings for the logged-in technician.
   * Uses the same endpoint as client but the backend filters by technician role.
   */
  const fetchBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');

      const url = statusFilter
        ? `/bookings/my-bookings?status=${statusFilter}`
        : '/bookings/my-bookings';

      const response = await api.get(url);

      if (response.data.success) {
        setBookings(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load bookings.');
        setBookings([]);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);

      let errorMessage = 'Could not load your bookings. ';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (status === 404) {
          errorMessage = 'No bookings found.';
        } else if (data?.message) {
          errorMessage += `Server error (${status}): ${data.message}`;
        } else {
          errorMessage += `Server error (${status}). Please try again later.`;
        }
      } else if (err.request) {
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        errorMessage += err.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      setBookings([]);
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [statusFilter]);

  // ─── EFFECTS ──────────────────────────────────────────────────

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleRefresh = () => {
    fetchBookings(true);
  };

  // ─── ACTION HANDLERS ─────────────────────────────────────────

  /**
   * openActionModal()
   * -----------------
   * Opens the action confirmation modal for a specific booking.
   */
  const openActionModal = (bookingId, action) => {
    const configs = {
      confirm: {
        title: 'Confirm Booking',
        message: 'Are you sure you want to confirm this booking? The client will be notified.',
        buttonText: 'Confirm',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
      },
      start: {
        title: 'Start Booking',
        message: 'Are you ready to start this job? The client will be notified.',
        buttonText: 'Start',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
      },
      complete: {
        title: 'Complete Booking',
        message: 'Mark this booking as completed? The client will be able to rate you.',
        buttonText: 'Complete',
        buttonColor: 'bg-green-600 hover:bg-green-700',
      },
      cancel: {
        title: 'Cancel Booking',
        message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
        buttonText: 'Cancel',
        buttonColor: 'bg-red-600 hover:bg-red-700',
      },
    };

    const config = configs[action];
    if (!config) return;

    setActionModal({
      open: true,
      bookingId,
      action,
      title: config.title,
      message: config.message,
      buttonText: config.buttonText,
      buttonColor: config.buttonColor,
      loading: false,
      error: '',
    });
  };

  /**
   * closeActionModal()
   * ------------------
   * Closes the action modal and resets state.
   */
  const closeActionModal = () => {
    setActionModal({
      open: false,
      bookingId: null,
      action: '',
      title: '',
      message: '',
      buttonText: '',
      buttonColor: '',
      loading: false,
      error: '',
    });
  };

  /**
   * handleActionSubmit()
   * --------------------
   * Submits the selected action (confirm, start, complete, cancel) to the backend.
   */
  const handleActionSubmit = async (e) => {
    e.preventDefault();

    const { bookingId, action } = actionModal;
    if (!bookingId || !action) return;

    setActionModal((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      let endpoint = '';
      switch (action) {
        case 'confirm':
          endpoint = `/bookings/${bookingId}/confirm`;
          break;
        case 'start':
          endpoint = `/bookings/${bookingId}/start`;
          break;
        case 'complete':
          endpoint = `/bookings/${bookingId}/complete`;
          break;
        case 'cancel':
          endpoint = `/bookings/${bookingId}/cancel`;
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api.post(endpoint);

      if (response.data.success) {
        // Refresh the list to show updated status
        await fetchBookings(true);
        // Close modal after short delay to show success
        setTimeout(() => {
          closeActionModal();
        }, 500);
      } else {
        setActionModal((prev) => ({
          ...prev,
          error: response.data.message || 'Action failed.',
        }));
      }
    } catch (err) {
      console.error('Action error:', err);
      let errorMessage = 'Action failed. ';

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.data?.message) {
          errorMessage += err.response.data.message;
        } else {
          errorMessage += `Server error (${err.response.status}). Please try again.`;
        }
      } else if (err.request) {
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        errorMessage += err.message || 'An unexpected error occurred.';
      }

      setActionModal((prev) => ({ ...prev, error: errorMessage }));
    } finally {
      setActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ─── NAVIGATION ──────────────────────────────────────────────

  const viewBookingDetails = (bookingId) => {
    navigate(`/bookings/${bookingId}`);
  };

  const toggleExpand = (bookingId) => {
    setExpandedBookingId((prev) => (prev === bookingId ? null : bookingId));
  };

  // ─── HELPERS ──────────────────────────────────────────────────

  /**
   * getClientName()
   * ---------------
   * Safely extracts the client's name from the booking object.
   */
  const getClientName = (booking) => {
    if (!booking?.clientId) return 'Client';
    const client = booking.clientId;
    if (client.firstName) {
      return `${client.firstName} ${client.lastName || ''}`.trim();
    }
    return 'Client';
  };

  /**
   * formatDate()
   * ------------
   * Formats a date string to a user-friendly format.
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  /**
   * formatCurrency()
   * ----------------
   * Formats a number as Kenyan Shillings (KES).
   */
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  // ─── RENDER: LOADING ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Technician Dashboard</h1>
          </div>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  // ─── RENDER: MAIN ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Technician Dashboard</h1>
            {!loading && bookings.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {bookings.length} booking{bookings.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="statusFilter" className="text-sm text-gray-600 font-medium whitespace-nowrap">
                Filter:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
              title="Refresh bookings"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── ERROR BANNER ───────────────────────────────────── */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Error loading bookings</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── EMPTY STATE ────────────────────────────────────── */}
        {!error && bookings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              {statusFilter ? `No ${statusFilter} bookings` : 'No bookings yet'}
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter
                ? `You have no ${statusFilter} bookings. Try changing the filter.`
                : 'You haven\'t received any bookings yet. Share your profile link to get clients!'}
            </p>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View all bookings
              </button>
            )}
          </div>
        )}

        {/* ─── BOOKINGS LIST ──────────────────────────────────── */}
        {!error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isExpanded = expandedBookingId === booking._id;
              const isPending = booking.status === 'pending';
              const isConfirmed = booking.status === 'confirmed';
              const isInProgress = booking.status === 'in-progress';
              const isCompleted = booking.status === 'completed';
              const isCancelled = booking.status === 'cancelled';

              // Determine which action buttons to show
              const showConfirm = isPending;
              const showStart = isConfirmed;
              const showComplete = isInProgress;
              const showCancel = isPending || isConfirmed || isInProgress;

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* ── COMPACT VIEW ── */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Left: Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {booking.serviceCategory || 'Service'}
                          </h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {booking.subService || 'No sub-service'}
                          {booking.serviceDescription && ` - ${booking.serviceDescription.slice(0, 60)}${booking.serviceDescription.length > 60 ? '...' : ''}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            {getClientName(booking)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(booking.preferredDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {booking.preferredTime || 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {booking.location?.address ? booking.location.address.slice(0, 30) : 'No address'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        {showConfirm && (
                          <button
                            onClick={() => openActionModal(booking._id, 'confirm')}
                            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1.5 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm
                          </button>
                        )}
                        {showStart && (
                          <button
                            onClick={() => openActionModal(booking._id, 'start')}
                            className="text-purple-600 hover:text-purple-800 text-sm px-3 py-1.5 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </button>
                        )}
                        {showComplete && (
                          <button
                            onClick={() => openActionModal(booking._id, 'complete')}
                            className="text-green-600 hover:text-green-800 text-sm px-3 py-1.5 border border-green-300 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                          >
                            <CheckSquare className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        {showCancel && (
                          <button
                            onClick={() => openActionModal(booking._id, 'cancel')}
                            className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => viewBookingDetails(booking._id)}
                          className="text-gray-500 hover:text-green-600 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        <button
                          onClick={() => toggleExpand(booking._id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── EXPANDED DETAILS ── */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Description:</p>
                          <p className="text-gray-700">{booking.serviceDescription || 'No description'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Total Amount:</p>
                          <p className="text-gray-700 font-semibold">{formatCurrency(booking.totalAmount)}</p>
                          <p className="text-xs text-gray-400">
                            {booking.hourlyRate > 0
                              ? `${formatCurrency(booking.hourlyRate)}/hour × ${booking.estimatedHours} hours`
                              : 'Fixed price agreed with client'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Payment Method:</p>
                          <p className="text-gray-700 capitalize">{booking.paymentMethod || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Payment Status:</p>
                          <p className={`capitalize ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {booking.paymentStatus || 'pending'}
                          </p>
                        </div>
                        {booking.clientNotes && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 font-medium">Client Notes:</p>
                            <p className="text-gray-700">{booking.clientNotes}</p>
                          </div>
                        )}
                        {booking.cancellationReason && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 font-medium">Cancellation Reason:</p>
                            <p className="text-red-600">{booking.cancellationReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ACTION CONFIRMATION MODAL ───────────────────────── */}
      {actionModal.open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeActionModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{actionModal.title}</h2>
              <button
                onClick={closeActionModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={actionModal.loading}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleActionSubmit} className="p-5 space-y-4">
              {/* Error message */}
              {actionModal.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{actionModal.error}</span>
                </div>
              )}

              {/* Message */}
              <p className="text-gray-600">{actionModal.message}</p>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={actionModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionModal.loading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${actionModal.buttonColor}`}
                >
                  {actionModal.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    actionModal.buttonText
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianBookings;