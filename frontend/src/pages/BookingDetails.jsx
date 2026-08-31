/**
 * BookingDetails.jsx
 * ===================
 * Displays a single booking with full details, status timeline,
 * and role-based actions (client/technician).
 * 
 * Features:
 * - View all booking details (service, location, pricing, dates)
 * - Status timeline showing history of status changes
 * - Role-based action buttons:
 *   - Client: Cancel (pending/confirmed), Rate (completed)
 *   - Technician: Confirm (pending), Start (confirmed), 
 *                 Confirm Payment (in-progress), Complete (in-progress, after payment confirmed),
 *                 Cancel (pending/confirmed/in-progress)
 * - Payment confirmation flow: technician must confirm payment before completing job
 * - Responsive design with comprehensive error handling
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Briefcase,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Check,
  X,
  Play,
  CheckSquare,
  Ban,
  MessageCircle,
  Phone,
  Mail,
  RefreshCw,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
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
 * TimelineItem Component
 * Displays a single item in the status timeline.
 */
const TimelineItem = ({ status, label, timestamp, isActive, isLast }) => {
  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    'in-progress': 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-gray-500',
  };

  const dotColor = statusColors[status] || 'bg-gray-300';

  return (
    <div className="relative flex items-start gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-2.5 top-5 h-full w-0.5 -ml-px bg-gray-200"></div>
      )}
      
      {/* Dot */}
      <div className={`relative z-10 w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0 ${isActive ? dotColor : 'bg-gray-200'}`}>
        {isActive && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-current"></div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
            {label}
          </span>
          {isActive && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Current
            </span>
          )}
        </div>
        {timestamp && (
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(timestamp).toLocaleString('en-KE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * SkeletonLoader Component
 * Shows a loading skeleton while booking details are being fetched.
 */
const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * BookingDetails Component
 * Main page for viewing a single booking with full details.
 */
const BookingDetails = () => {
  const { id } = useParams(); // booking ID from URL
  const navigate = useNavigate();

  // ─── STATE ────────────────────────────────────────────────────
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Action modal state ──
  const [actionModal, setActionModal] = useState({
    open: false,
    action: '', // 'confirm', 'start', 'complete', 'cancel', 'rate', 'confirmPayment'
    title: '',
    message: '',
    buttonText: '',
    buttonColor: '',
    loading: false,
    error: '',
    rating: 0,
    review: '',
    amount: '',        // for confirmPayment
    note: '',          // for confirmPayment
    needsRating: false,
  });

  // ─── API CALLS ───────────────────────────────────────────────

  /**
   * fetchBooking()
   * ---------------
   * Fetches the booking details from the backend.
   */
  const fetchBooking = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');

      const response = await api.get(`/bookings/${id}`);

      if (response.data.success) {
        setBooking(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load booking.');
        setBooking(null);
      }
    } catch (err) {
      console.error('Fetch booking error:', err);

      let errorMessage = 'Could not load booking details. ';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (status === 404) {
          errorMessage = 'Booking not found.';
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
      setBooking(null);
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [id]);

  // ─── EFFECTS ──────────────────────────────────────────────────

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── HELPER FUNCTIONS ────────────────────────────────────────

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
   * formatDateTime()
   * ----------------
   * Formats a date string to include time.
   */
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
   * getTechnicianName()
   * -------------------
   * Safely extracts the technician's name from the booking object.
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
   * buildStatusTimeline()
   * ---------------------
   * Builds a timeline of status changes from the booking data.
   */
  const buildStatusTimeline = (booking) => {
    const timeline = [];
    const statusLabels = {
      pending: 'Booking Created',
      confirmed: 'Booking Confirmed',
      'in-progress': 'Work Started',
      completed: 'Work Completed',
      cancelled: 'Booking Cancelled',
      'no-show': 'No Show',
    };

    // Always show creation time
    timeline.push({
      status: 'pending',
      label: 'Booking Created',
      timestamp: booking.createdAt,
    });

    // If status is not pending, add the next status
    if (booking.status !== 'pending') {
      const statusMap = {
        confirmed: { status: 'confirmed', timestamp: booking.confirmedAt || booking.updatedAt },
        'in-progress': { status: 'in-progress', timestamp: booking.startedAt || booking.updatedAt },
        completed: { status: 'completed', timestamp: booking.completedAt || booking.updatedAt },
        cancelled: { status: 'cancelled', timestamp: booking.cancelledAt || booking.updatedAt },
        'no-show': { status: 'no-show', timestamp: booking.updatedAt },
      };

      // Add the current status
      if (statusMap[booking.status]) {
        timeline.push({
          status: booking.status,
          label: statusLabels[booking.status] || booking.status,
          timestamp: statusMap[booking.status].timestamp,
        });
      }

      // If completed, also add the in-progress step if it exists
      if (booking.status === 'completed' && booking.startedAt) {
        const inProgressIndex = timeline.findIndex(t => t.status === 'completed');
        if (inProgressIndex > -1) {
          timeline.splice(inProgressIndex, 0, {
            status: 'in-progress',
            label: 'Work Started',
            timestamp: booking.startedAt,
          });
        }
      }

      // If confirmed, also add it if not already there
      if (booking.status === 'confirmed' || booking.status === 'in-progress' || booking.status === 'completed') {
        if (booking.confirmedAt) {
          const existing = timeline.find(t => t.status === 'confirmed');
          if (!existing) {
            const insertIndex = timeline.findIndex(t => t.status !== 'pending');
            if (insertIndex > -1) {
              timeline.splice(insertIndex, 0, {
                status: 'confirmed',
                label: 'Booking Confirmed',
                timestamp: booking.confirmedAt,
              });
            }
          }
        }
      }
    }

    // If cancelled, add the cancellation reason if available
    if (booking.status === 'cancelled' && booking.cancellationReason) {
      const cancelledItem = timeline.find(t => t.status === 'cancelled');
      if (cancelledItem) {
        cancelledItem.reason = booking.cancellationReason;
      }
    }

    return timeline;
  };

  // ─── ACTION HANDLERS ─────────────────────────────────────────

  /**
   * openActionModal()
   * -----------------
   * Opens the action confirmation modal for a specific action.
   */
  const openActionModal = (action) => {
    const configs = {
      confirm: {
        title: 'Confirm Booking',
        message: 'Are you sure you want to confirm this booking? The client will be notified.',
        buttonText: 'Confirm',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        needsRating: false,
      },
      start: {
        title: 'Start Booking',
        message: 'Are you ready to start this job? The client will be notified.',
        buttonText: 'Start',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        needsRating: false,
      },
      complete: {
        title: 'Complete Booking',
        message: 'Mark this booking as completed? The client will be able to rate you.',
        buttonText: 'Complete',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
      cancel: {
        title: 'Cancel Booking',
        message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
        buttonText: 'Cancel',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        needsRating: false,
      },
      rate: {
        title: 'Rate Your Technician',
        message: 'Share your experience with this technician.',
        buttonText: 'Submit Rating',
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
        needsRating: true,
      },
      confirmPayment: {
        title: 'Confirm Payment',
        message: 'Has the client paid for this job? You can optionally enter the amount received and a note.',
        buttonText: 'Confirm Payment',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
    };

    const config = configs[action];
    if (!config) return;

    setActionModal({
      open: true,
      action,
      title: config.title,
      message: config.message,
      buttonText: config.buttonText,
      buttonColor: config.buttonColor,
      loading: false,
      error: '',
      rating: 0,
      review: '',
      amount: '',
      note: '',
      needsRating: config.needsRating || false,
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
      action: '',
      title: '',
      message: '',
      buttonText: '',
      buttonColor: '',
      loading: false,
      error: '',
      rating: 0,
      review: '',
      amount: '',
      note: '',
      needsRating: false,
    });
  };

  /**
   * handleActionSubmit()
   * --------------------
   * Submits the selected action to the backend.
   */
  const handleActionSubmit = async (e) => {
    e.preventDefault();

    const { action, rating, review, needsRating, amount, note } = actionModal;
    if (!booking) return;

    // Validate rating if needed
    if (needsRating) {
      if (rating === 0) {
        setActionModal((prev) => ({ ...prev, error: 'Please select a star rating.' }));
        return;
      }
      if (!review || review.trim() === '') {
        setActionModal((prev) => ({ ...prev, error: 'Please write a review.' }));
        return;
      }
    }

    setActionModal((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      let endpoint = '';
      let payload = {};

      switch (action) {
        case 'confirm':
          endpoint = `/bookings/${booking._id}/confirm`;
          break;
        case 'start':
          endpoint = `/bookings/${booking._id}/start`;
          break;
        case 'complete':
          endpoint = `/bookings/${booking._id}/complete`;
          break;
        case 'cancel':
          endpoint = `/bookings/${booking._id}/cancel`;
          payload = { reason: 'Cancelled by user' };
          break;
        case 'rate':
          endpoint = `/bookings/${booking._id}/rate`;
          payload = { rating, review: review.trim() };
          break;
        case 'confirmPayment':
          endpoint = `/bookings/${booking._id}/confirm-payment`;
          // Only send amount if it's a valid positive number
          if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= 0) {
            payload.amountReceived = parseFloat(amount);
          }
          if (note) payload.note = note.trim();
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        // Refresh the booking to show updated status
        await fetchBooking(true);
        // Close modal after short delay
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

  /**
   * handleStarClick()
   * -----------------
   * Sets the rating when a user clicks on a star.
   */
  const handleStarClick = (star) => {
    setActionModal((prev) => ({ ...prev, rating: star }));
    if (actionModal.error) {
      setActionModal((prev) => ({ ...prev, error: '' }));
    }
  };

  /**
   * handleRefresh()
   * ---------------
   * Refreshes the booking details.
   */
  const handleRefresh = () => {
    fetchBooking(true);
  };

  /**
   * handleGoBack()
   * --------------
   * Navigates back to the previous page.
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  // ─── RENDER: LOADING ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  // ─── RENDER: ERROR ──────────────────────────────────────────

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-sm mb-4">{error || 'The booking you are looking for does not exist.'}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={handleGoBack}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── DETERMINE USER ROLE & ACTIONS ──────────────────────────

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isClient = user?.role === 'client';
  const isTechnician = user?.role === 'technician';

  // Determine which actions are available
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isInProgress = booking.status === 'in-progress';
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  // Client actions
  const clientCanCancel = isPending || isConfirmed;
  const clientCanRate = isCompleted && !booking.clientRating;

  // Technician actions
  const techCanConfirm = isPending;
  const techCanStart = isConfirmed;
  const techCanComplete = isInProgress && booking.paymentConfirmed === true; // only if payment confirmed
  const techCanCancel = isPending || isConfirmed || isInProgress;
  const techCanConfirmPayment = isInProgress && booking.paymentConfirmed !== true;

  // Build timeline
  const timeline = buildStatusTimeline(booking);

  // ─── RENDER: MAIN ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Booking Details</h1>
              <p className="text-sm text-gray-500 mt-0.5">#{booking._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
              title="Refresh"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── MAIN CONTENT ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── LEFT COLUMN: DETAILS ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                Service Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-800">{booking.serviceCategory || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sub-Service</p>
                  <p className="font-medium text-gray-800">{booking.subService || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{booking.serviceDescription || 'No description provided'}</p>
                </div>
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Preferred Date</p>
                  <p className="font-medium text-gray-800">{formatDate(booking.preferredDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Preferred Time</p>
                  <p className="font-medium text-gray-800">{booking.preferredTime || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Duration</p>
                  <p className="font-medium text-gray-800">{booking.duration || booking.estimatedHours} hours</p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Location
              </h2>
              <p className="text-gray-700">{booking.location?.address || 'No address provided'}</p>
            </div>

            {/* Pricing Card - with Payment Confirmation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(booking.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-800 capitalize">{booking.paymentMethod || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className={`font-medium capitalize ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.paymentStatus || 'pending'}
                  </p>
                </div>
                {booking.hourlyRate > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="font-medium text-gray-800">{formatCurrency(booking.hourlyRate)}/hour</p>
                    <p className="text-xs text-gray-400">{booking.estimatedHours} hours estimated</p>
                  </div>
                )}
              </div>

              {/* Payment Confirmation Status */}
              {booking.paymentConfirmed && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Payment confirmed</span>
                    {booking.paymentAmountReceived !== null && booking.paymentAmountReceived !== undefined && (
                      <span className="font-medium"> ({formatCurrency(booking.paymentAmountReceived)})</span>
                    )}
                    {booking.paymentConfirmedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDateTime(booking.paymentConfirmedAt)}
                      </span>
                    )}
                  </p>
                  {booking.paymentConfirmationNote && (
                    <p className="text-xs text-green-600 mt-1">Note: {booking.paymentConfirmationNote}</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes Card */}
            {(booking.clientNotes || booking.technicianNotes || booking.cancellationReason) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Notes</h2>
                {booking.clientNotes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Client Notes</p>
                    <p className="text-gray-700">{booking.clientNotes}</p>
                  </div>
                )}
                {booking.technicianNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Technician Notes</p>
                    <p className="text-gray-700">{booking.technicianNotes}</p>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Cancellation Reason</p>
                    <p className="text-red-700">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN: TIMELINE & ACTIONS ────────────── */}
          <div className="lg:col-span-1 space-y-6">
            {/* People Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 People</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-800">{getClientName(booking)}</p>
                  {booking.clientId?.email && (
                    <p className="text-xs text-gray-400">{booking.clientId.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Technician</p>
                  <p className="font-medium text-gray-800">{getTechnicianName(booking)}</p>
                  {booking.technicianId?.businessName && (
                    <p className="text-xs text-gray-400">{booking.technicianId.businessName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-green-600" />
                Status Timeline
              </h2>
              <div className="space-y-0">
                {timeline.map((item, index) => {
                  const isActive = item.status === booking.status;
                  const isLast = index === timeline.length - 1;
                  return (
                    <TimelineItem
                      key={index}
                      status={item.status}
                      label={item.label}
                      timestamp={item.timestamp}
                      isActive={isActive}
                      isLast={isLast}
                    />
                  );
                })}
              </div>
              {booking.cancelledBy && (
                <p className="text-xs text-gray-400 mt-3">
                  Cancelled by: {booking.cancelledBy}
                </p>
              )}
            </div>

            {/* Actions Card */}
            {((isClient && (clientCanCancel || clientCanRate)) ||
              (isTechnician && (techCanConfirm || techCanStart || techCanComplete || techCanCancel || techCanConfirmPayment))) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Actions</h2>
                <div className="space-y-2">
                  {/* Client Actions */}
                  {isClient && clientCanCancel && (
                    <button
                      onClick={() => openActionModal('cancel')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}
                  {isClient && clientCanRate && (
                    <button
                      onClick={() => openActionModal('rate')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      Rate Technician
                    </button>
                  )}

                  {/* Technician Actions */}
                  {isTechnician && techCanConfirm && (
                    <button
                      onClick={() => openActionModal('confirm')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Booking
                    </button>
                  )}
                  {isTechnician && techCanStart && (
                    <button
                      onClick={() => openActionModal('start')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Start Job
                    </button>
                  )}
                  {isTechnician && techCanConfirmPayment && (
                    <button
                      onClick={() => openActionModal('confirmPayment')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Confirm Payment
                    </button>
                  )}
                  {isTechnician && techCanComplete && (
                    <button
                      onClick={() => openActionModal('complete')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Complete Job
                    </button>
                  )}
                  {isTechnician && techCanCancel && (
                    <button
                      onClick={() => openActionModal('cancel')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}

                  {!isClient && !isTechnician && (
                    <p className="text-sm text-gray-500 text-center">You are not authorized to take actions on this booking.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ACTION CONFIRMATION MODAL ───────────────────────── */}
      {actionModal.open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeActionModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
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

              {/* Rating fields (for rate action) */}
              {actionModal.action === 'rate' && (
                <>
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
                          disabled={actionModal.loading}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <span
                            className={`${
                              star <= actionModal.rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {actionModal.rating === 0
                        ? 'Click a star to rate'
                        : `You selected ${actionModal.rating} star${actionModal.rating > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionModal.review}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, review: e.target.value }))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-24 resize-y"
                      placeholder="Share your experience..."
                      required
                      disabled={actionModal.loading}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {actionModal.review.length}/500 characters
                    </p>
                  </div>
                </>
              )}

              {/* Payment confirmation fields (for confirmPayment action) */}
              {actionModal.action === 'confirmPayment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Received (optional)
                    </label>
                    <input
                      type="number"
                      value={actionModal.amount}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g. 2500"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave empty if you don't want to record the exact amount.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={actionModal.note}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Any additional info"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      maxLength={200}
                    />
                  </div>
                </>
              )}

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

export default BookingDetails;