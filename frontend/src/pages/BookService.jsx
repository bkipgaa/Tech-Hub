/**
 * MyBookings.jsx
 * ==============
 * Client-side page to view all bookings with filtering,
 * cancellation, and rating functionality.
 * 
 * Features:
 * - List all bookings with status badges
 * - Filter by status (pending, confirmed, in-progress, completed, cancelled)
 * - Expand/collapse for detailed view
 * - Cancel booking with reason (for pending/confirmed only)
 * - Rate technician after completion (1-5 stars + review)
 * - View booking details navigation
 * - Responsive design
 * - Comprehensive error handling with user-friendly messages
 * - Loading states with skeleton or spinner
 * 
 * @version 2.0.0
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
  MessageCircle,
  Phone,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

// ============================================================
// HELPER COMPONENTS
// ============================================================

/**
 * StatusBadge Component
 * Displays a coloured badge based on booking status.
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Booking status: pending, confirmed, in-progress, completed, cancelled, no-show
 * @returns {JSX.Element} - Rendered badge
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
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
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
 * MyBookings Component
 * Main page component for clients to manage their bookings.
 */
const MyBookings = () => {
  const navigate = useNavigate();

  // ─── STATE ────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Rating modal state ──
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 0, review: '' });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // ── Cancellation modal state ──
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // ─── API CALLS ───────────────────────────────────────────────

  /**
   * fetchBookings()
   * ---------------
   * Fetches the user's bookings from the backend.
   * Applies status filter if selected.
   * Handles network errors, API errors, and unexpected responses.
   * 
   * @param {boolean} silent - If true, doesn't show loading spinner
   */
  const fetchBookings = useCallback(async (silent = false) => {
    try {
      // Set loading state only if not silent (e.g., background refresh)
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');

      // Build URL with status filter if selected
      const url = statusFilter
        ? `/bookings/my-bookings?status=${statusFilter}`
        : '/bookings/my-bookings';

      const response = await api.get(url);

      // Check if the request was successful
      if (response.data.success) {
        // Ensure we have an array of bookings
        const bookingsData = response.data.data || [];
        setBookings(bookingsData);
      } else {
        // Backend returned success: false
        setError(response.data.message || 'Failed to load bookings. Please try again.');
        setBookings([]);
      }
    } catch (err) {
      // ── Handle network/API errors ──
      console.error('Fetch bookings error:', err);

      let errorMessage = 'Could not load your bookings. ';

      if (err.response) {
        // The request was made and the server responded with a status code
        // outside the range of 2xx
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Optionally redirect to login
          // navigate('/login');
        } else if (status === 404) {
          errorMessage = 'No bookings found.';
        } else if (data?.message) {
          errorMessage += `Server error (${status}): ${data.message}`;
        } else {
          errorMessage += `Server error (${status}). Please try again later.`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // Something else happened in setting up the request
        errorMessage += err.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      setBookings([]);
    } finally {
      // Always turn off loading states
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [statusFilter, navigate]);

  // ─── EFFECTS ──────────────────────────────────────────────────

  // Fetch bookings when the component mounts or filter changes
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /**
   * handleRefresh()
   * ----------------
   * Manually refresh the bookings list without showing the full loading state.
   */
  const handleRefresh = () => {
    fetchBookings(true);
  };

  // ─── CANCEL BOOKING ──────────────────────────────────────────

  /**
   * openCancelModal()
   * -----------------
   * Opens the cancellation modal for the selected booking.
   */
  const openCancelModal = (bookingId) => {
    setCancellingBookingId(bookingId);
    setCancelReason('');
    setCancelError('');
    setShowCancelModal(true);
  };

  /**
   * closeCancelModal()
   * ------------------
   * Closes the cancellation modal and resets all related state.
   */
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellingBookingId(null);
    setCancelReason('');
    setCancelError('');
    setCancelLoading(false);
  };

  /**
   * handleCancelBooking()
   * ---------------------
   * Submits the cancellation request to the backend.
   * Validates the reason, handles loading state, and refreshes the list on success.
   */
  const handleCancelBooking = async (e) => {
    e.preventDefault();

    // Validate cancellation reason
    if (!cancelReason || cancelReason.trim() === '') {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }

    setCancelLoading(true);
    setCancelError('');

    try {
      const response = await api.post(`/bookings/${cancellingBookingId}/cancel`, {
        reason: cancelReason.trim(),
      });

      if (response.data.success) {
        // Refresh the bookings list to show updated status
        await fetchBookings(true);
        // Close the modal after successful cancellation
        closeCancelModal();
      } else {
        // Backend returned success: false
        setCancelError(response.data.message || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      let errorMessage = 'Failed to cancel booking. ';

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

      setCancelError(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── RATE TECHNICIAN ─────────────────────────────────────────

  /**
   * openRatingModal()
   * -----------------
   * Opens the rating modal for the selected booking.
   */
  const openRatingModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setRatingForm({ rating: 0, review: '' });
    setRatingError('');
    setRatingSuccess(false);
    setShowRatingModal(true);
  };

  /**
   * closeRatingModal()
   * ------------------
   * Closes the rating modal and resets all related state.
   */
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedBookingId(null);
    setRatingForm({ rating: 0, review: '' });
    setRatingError('');
    setRatingLoading(false);
    setRatingSuccess(false);
  };

  /**
   * handleRatingSubmit()
   * --------------------
   * Submits the rating to the backend.
   * Validates star rating and review content.
   * On success, updates the technician's overall rating and refreshes the bookings list.
   */
  const handleRatingSubmit = async (e) => {
    e.preventDefault();

    // ── Validate rating ──
    if (ratingForm.rating === 0) {
      setRatingError('Please select a star rating.');
      return;
    }
    if (!ratingForm.review || ratingForm.review.trim() === '') {
      setRatingError('Please write a review.');
      return;
    }

    setRatingLoading(true);
    setRatingError('');

    try {
      const response = await api.post(`/bookings/${selectedBookingId}/rate`, {
        rating: ratingForm.rating,
        review: ratingForm.review.trim(),
      });

      if (response.data.success) {
        setRatingSuccess(true);
        // Refresh the list to update the "rated" status
        await fetchBookings(true);
        // Close the modal after a short delay to show success message
        setTimeout(() => {
          closeRatingModal();
        }, 1500);
      } else {
        setRatingError(response.data.message || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error('Rating error:', err);
      let errorMessage = 'Failed to submit rating. ';

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

      setRatingError(errorMessage);
    } finally {
      setRatingLoading(false);
    }
  };

  /**
   * handleStarClick()
   * -----------------
   * Sets the rating when a user clicks on a star.
   * Clears any previous error message.
   */
  const handleStarClick = (star) => {
    setRatingForm((prev) => ({ ...prev, rating: star }));
    if (ratingError) setRatingError('');
  };

  // ─── NAVIGATION ──────────────────────────────────────────────

  /**
   * viewBookingDetails()
   * --------------------
   * Navigates to the full details page for a specific booking.
   */
  const viewBookingDetails = (bookingId) => {
    navigate(`/bookings/${bookingId}`);
  };

  /**
   * toggleExpand()
   * --------------
   * Toggles the expanded/collapsed state for a booking card.
   * Only one booking can be expanded at a time.
   */
  const toggleExpand = (bookingId) => {
    setExpandedBookingId((prev) => (prev === bookingId ? null : bookingId));
  };

  // ─── HELPERS ──────────────────────────────────────────────────

  /**
   * getTechnicianName()
   * -------------------
   * Safely extracts the technician's name from the booking object.
   * Handles various data structures (populated or not).
   * 
   * @param {Object} booking - Booking object from the API
   * @returns {string} - Technician's display name
   */
  const getTechnicianName = (booking) => {
    if (!booking?.technicianId) return 'Technician';
    const tech = booking.technicianId;
    if (tech.businessName) return tech.businessName;
    if (tech.userId?.firstName) {
      return `${tech.userId.firstName} ${tech.userId.lastName || ''}`.trim();
    }
    return 'Technician';
  };

  /**
   * getTechnicianId()
   * -----------------
   * Safely extracts the technician's ID from the booking object.
   * 
   * @param {Object} booking - Booking object from the API
   * @returns {string|null} - Technician ID or null
   */
  const getTechnicianId = (booking) => {
    return booking?.technicianId?._id || booking?.technicianId || null;
  };

  /**
   * formatDate()
   * ------------
   * Formats a date string to a user-friendly format.
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date (e.g., "Jan 15, 2026")
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
   * 
   * @param {number} amount - Amount in KES
   * @returns {string} - Formatted currency string
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Bookings</h1>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Bookings</h1>
            {!loading && bookings.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {bookings.length} booking{bookings.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Dropdown */}
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
            {/* Refresh Button */}
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
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              {statusFilter ? `No ${statusFilter} bookings` : 'No bookings yet'}
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter
                ? `You have no ${statusFilter} bookings. Try changing the filter.`
                : 'You haven\'t made any bookings yet. Find a technician to get started!'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter('')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View all bookings
                </button>
              )}
              {!statusFilter && (
                <button
                  onClick={() => navigate('/search')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Find a Technician
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── BOOKINGS LIST ──────────────────────────────────── */}
        {!error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isExpanded = expandedBookingId === booking._id;
              const canCancel = ['pending', 'confirmed'].includes(booking.status);
              const canRate = booking.status === 'completed' && !booking.clientRating;
              const alreadyRated = booking.status === 'completed' && booking.clientRating;

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
                            {getTechnicianName(booking)}
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
                        {canCancel && (
                          <button
                            onClick={() => openCancelModal(booking._id)}
                            className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {canRate && (
                          <button
                            onClick={() => openRatingModal(booking._id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm px-3 py-1.5 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-1"
                          >
                            <Star className="w-4 h-4 fill-yellow-400" />
                            Rate
                          </button>
                        )}
                        {alreadyRated && (
                          <span className="text-sm text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            Rated {booking.clientRating}★
                          </span>
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
                              : 'Fixed price agreed with technician'}
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
                            <p className="text-gray-500 font-medium">Your Notes:</p>
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

      {/* ─── CANCEL MODAL ─────────────────────────────────────── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeCancelModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">Cancel Booking</h2>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={cancelLoading}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCancelBooking} className="p-5 space-y-4">
              {/* Error message */}
              {cancelError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{cancelError}</span>
                </div>
              )}

              {/* Warning message */}
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Are you sure?</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    This action cannot be undone. The technician will be notified.
                  </p>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-20 resize-y"
                  placeholder="Please explain why you're cancelling (e.g., changed my mind, found another technician)"
                  required
                  disabled={cancelLoading}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {cancelReason.length}/500 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={cancelLoading}
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RATING MODAL ─────────────────────────────────────── */}
      {showRatingModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeRatingModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">Rate Your Technician</h2>
              <button
                onClick={closeRatingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={ratingLoading}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRatingSubmit} className="p-5 space-y-4">
              {/* Success message */}
              {ratingSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Rating submitted successfully! Thank you for your feedback.</span>
                </div>
              )}

              {/* Error message */}
              {ratingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{ratingError}</span>
                </div>
              )}

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="text-4xl focus:outline-none transition-colors hover:scale-110 transform"
                      disabled={ratingLoading || ratingSuccess}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <span
                        className={`${
                          star <= ratingForm.rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {ratingForm.rating === 0
                    ? 'Click a star to rate'
                    : `You selected ${ratingForm.rating} star${ratingForm.rating > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, review: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-24 resize-y"
                  placeholder="Share your experience with this technician (e.g., professionalism, quality of work, punctuality)..."
                  required
                  disabled={ratingLoading || ratingSuccess}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {ratingForm.review.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={ratingLoading || ratingSuccess}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {ratingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : ratingSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    Thank You!
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;