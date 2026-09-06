/**
 * BookingDetails.jsx
 * ===================
 * Displays a single booking with full details, status timeline,
 * and role-based actions (client/technician) for the complete 12‑step flow.
 * 
 * Features:
 * - View all booking details (service, location, pricing, dates)
 * - Quotation, materials, labor payment, and commission details
 * - Status timeline showing history of status changes
 * - Role-based action buttons for each step:
 *   - Technician: Send quotation, set material source, confirm materials money received,
 *                 confirm materials delivered, start work, complete work, confirm labor payment
 *   - Client: Accept/reject quotation, confirm materials received, rate technician
 * - Responsive design with comprehensive error handling
 * 
 * @version 3.0.0 – Full 12‑step flow
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
  FileText,
  Package,
  Truck,
  Gift,
  Percent,
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
    quoted: {
      label: 'Quoted',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <FileText className="w-3 h-3 mr-1" />,
    },
    agreed: {
      label: 'Agreed',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
    },
    materials_delivered: {
      label: 'Materials Delivered',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: <Package className="w-3 h-3 mr-1" />,
    },
    materials_confirmed: {
      label: 'Materials Confirmed',
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
    },
    work_completed: {
      label: 'Work Completed',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <CheckSquare className="w-3 h-3 mr-1" />,
    },
    labor_paid: {
      label: 'Labor Paid',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <DollarSign className="w-3 h-3 mr-1" />,
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
    quoted: 'bg-blue-500',
    agreed: 'bg-indigo-500',
    materials_delivered: 'bg-cyan-500',
    materials_confirmed: 'bg-teal-500',
    in_progress: 'bg-purple-500',
    work_completed: 'bg-blue-500',
    labor_paid: 'bg-green-500',
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
    action: '', // 'sendQuotation', 'acceptQuotation', 'rejectQuotation', 'setMaterialSource',
                 // 'confirmMaterialsMoneyReceived', 'confirmMaterialsDelivered', 'confirmMaterialsReceived',
                 // 'start', 'completeWork', 'confirmLaborPayment', 'cancel', 'rate'
    title: '',
    message: '',
    buttonText: '',
    buttonColor: '',
    loading: false,
    error: '',
    // Quotation fields
    totalCost: '',
    laborCost: '',
    materialsCost: '',
    // Material source
    providedByClient: false,
    // Labor payment
    amount: '',
    note: '',
    // Rejection reason
    reason: '',
    // Rating
    rating: 0,
    review: '',
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

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  const getClientName = (booking) => {
    if (!booking?.clientId) return 'Client';
    const client = booking.clientId;
    if (client.firstName) {
      return `${client.firstName} ${client.lastName || ''}`.trim();
    }
    return 'Client';
  };

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
   * Now supports all new statuses.
   */
  const buildStatusTimeline = (booking) => {
    const timeline = [];
    const statusLabels = {
      pending: 'Booking Created',
      quoted: 'Quotation Sent',
      agreed: 'Quotation Accepted',
      materials_delivered: 'Materials Delivered',
      materials_confirmed: 'Materials Confirmed',
      in_progress: 'Work Started',
      work_completed: 'Work Completed',
      labor_paid: 'Labor Payment Confirmed',
      completed: 'Job Completed & Rated',
      cancelled: 'Booking Cancelled',
      'no-show': 'No Show',
    };

    // Always show creation time
    timeline.push({
      status: 'pending',
      label: 'Booking Created',
      timestamp: booking.createdAt,
    });

    // If status is not pending, add the next statuses in order
    if (booking.status !== 'pending') {
      const statusMap = {
        quoted: { status: 'quoted', timestamp: booking.quotation?.sentAt || booking.updatedAt },
        agreed: { status: 'agreed', timestamp: booking.quotation?.acceptedAt || booking.updatedAt },
        materials_delivered: { status: 'materials_delivered', timestamp: booking.materials?.deliveredAt || booking.updatedAt },
        materials_confirmed: { status: 'materials_confirmed', timestamp: booking.materials?.confirmedByClientAt || booking.updatedAt },
        in_progress: { status: 'in_progress', timestamp: booking.startedAt || booking.updatedAt },
        work_completed: { status: 'work_completed', timestamp: booking.workCompletedAt || booking.updatedAt },
        labor_paid: { status: 'labor_paid', timestamp: booking.laborPayment?.confirmedAt || booking.updatedAt },
        completed: { status: 'completed', timestamp: booking.completedAt || booking.updatedAt },
        cancelled: { status: 'cancelled', timestamp: booking.cancelledAt || booking.updatedAt },
        'no-show': { status: 'no-show', timestamp: booking.updatedAt },
      };

      // Build the list of statuses up to the current one
      const statusOrder = [
        'pending', 'quoted', 'agreed', 'materials_delivered',
        'materials_confirmed', 'in_progress', 'work_completed',
        'labor_paid', 'completed', 'cancelled', 'no-show'
      ];
      const currentIndex = statusOrder.indexOf(booking.status);
      // Add all statuses from index 1 to currentIndex (skip pending which is already added)
      for (let i = 1; i <= currentIndex; i++) {
        const s = statusOrder[i];
        const info = statusMap[s];
        if (info) {
          timeline.push({
            status: s,
            label: statusLabels[s] || s,
            timestamp: info.timestamp,
          });
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
      sendQuotation: {
        title: 'Send Quotation',
        message: 'Specify the total cost, labor cost, and materials cost for this job.',
        buttonText: 'Send Quotation',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        needsRating: false,
        needsQuotation: true,
      },
      acceptQuotation: {
        title: 'Accept Quotation',
        message: 'Do you agree with the quotation? Accepting will move to the next step.',
        buttonText: 'Accept',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
      rejectQuotation: {
        title: 'Reject Quotation',
        message: 'Are you sure you want to reject this quotation? This will cancel the booking.',
        buttonText: 'Reject',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        needsRating: false,
        needsReason: true,
      },
      setMaterialSource: {
        title: 'Material Source',
        message: 'Who will provide the materials for this job?',
        buttonText: 'Set Source',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        needsRating: false,
        needsMaterialSource: true,
      },
      confirmMaterialsMoneyReceived: {
        title: 'Confirm Materials Money Received',
        message: 'Has the client paid you for the materials?',
        buttonText: 'Confirm',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
      confirmMaterialsDelivered: {
        title: 'Confirm Materials Delivered',
        message: 'Have you delivered the materials to the client?',
        buttonText: 'Delivered',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
      confirmMaterialsReceived: {
        title: 'Confirm Materials Received',
        message: 'Have you received the materials from the technician?',
        buttonText: 'Confirm Received',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
      },
      start: {
        title: 'Start Work',
        message: 'Are you ready to start this job? The client will be notified.',
        buttonText: 'Start',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        needsRating: false,
      },
      completeWork: {
        title: 'Complete Work',
        message: 'Are you finished with the job? This will allow the client to pay labor.',
        buttonText: 'Complete Work',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        needsRating: false,
      },
      confirmLaborPayment: {
        title: 'Confirm Labor Payment',
        message: 'Enter the amount you received for labor. A 5% commission will be calculated.',
        buttonText: 'Confirm Payment',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        needsRating: false,
        needsLaborAmount: true,
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
      totalCost: '',
      laborCost: '',
      materialsCost: '',
      providedByClient: false,
      amount: '',
      note: '',
      reason: '',
      rating: 0,
      review: '',
      needsRating: config.needsRating || false,
      needsQuotation: config.needsQuotation || false,
      needsMaterialSource: config.needsMaterialSource || false,
      needsLaborAmount: config.needsLaborAmount || false,
      needsReason: config.needsReason || false,
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
      totalCost: '',
      laborCost: '',
      materialsCost: '',
      providedByClient: false,
      amount: '',
      note: '',
      reason: '',
      rating: 0,
      review: '',
      needsRating: false,
      needsQuotation: false,
      needsMaterialSource: false,
      needsLaborAmount: false,
      needsReason: false,
    });
  };

  /**
   * handleActionSubmit()
   * --------------------
   * Submits the selected action to the backend.
   */
  const handleActionSubmit = async (e) => {
    e.preventDefault();

    const {
      action,
      totalCost,
      laborCost,
      materialsCost,
      providedByClient,
      amount,
      note,
      reason,
      rating,
      review,
      needsRating,
      needsQuotation,
      needsMaterialSource,
      needsLaborAmount,
      needsReason,
    } = actionModal;

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

    // Validate quotation fields
    if (needsQuotation) {
      if (!totalCost || parseFloat(totalCost) <= 0) {
        setActionModal((prev) => ({ ...prev, error: 'Total cost must be > 0.' }));
        return;
      }
      if (laborCost === '' || isNaN(parseFloat(laborCost)) || parseFloat(laborCost) < 0) {
        setActionModal((prev) => ({ ...prev, error: 'Labor cost is required (can be 0).' }));
        return;
      }
      if (materialsCost === '' || isNaN(parseFloat(materialsCost)) || parseFloat(materialsCost) < 0) {
        setActionModal((prev) => ({ ...prev, error: 'Materials cost is required (can be 0).' }));
        return;
      }
    }

    // Validate material source
    if (needsMaterialSource && typeof providedByClient !== 'boolean') {
      setActionModal((prev) => ({ ...prev, error: 'Please select who provides materials.' }));
      return;
    }

    // Validate labor amount
    if (needsLaborAmount) {
      if (!amount || parseFloat(amount) <= 0) {
        setActionModal((prev) => ({ ...prev, error: 'Please enter a valid positive amount.' }));
        return;
      }
    }

    // Validate reason
    if (needsReason && (!reason || reason.trim() === '')) {
      setActionModal((prev) => ({ ...prev, error: 'Please provide a reason for rejection.' }));
      return;
    }

    setActionModal((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      let endpoint = '';
      let payload = {};

      switch (action) {
        case 'sendQuotation':
          endpoint = `/bookings/${booking._id}/quotation`;
          payload = {
            totalCost: parseFloat(totalCost),
            laborCost: parseFloat(laborCost),
            materialsCost: parseFloat(materialsCost),
          };
          break;
        case 'acceptQuotation':
          endpoint = `/bookings/${booking._id}/accept-quotation`;
          break;
        case 'rejectQuotation':
          endpoint = `/bookings/${booking._id}/reject-quotation`;
          payload = { reason: reason.trim() };
          break;
        case 'setMaterialSource':
          endpoint = `/bookings/${booking._id}/material-source`;
          payload = { providedByClient };
          break;
        case 'confirmMaterialsMoneyReceived':
          endpoint = `/bookings/${booking._id}/materials-money-received`;
          break;
        case 'confirmMaterialsDelivered':
          endpoint = `/bookings/${booking._id}/materials-delivered`;
          break;
        case 'confirmMaterialsReceived':
          endpoint = `/bookings/${booking._id}/materials-received`;
          break;
        case 'start':
          endpoint = `/bookings/${booking._id}/start`;
          break;
        case 'completeWork':
          endpoint = `/bookings/${booking._id}/complete-work`;
          break;
        case 'confirmLaborPayment':
          endpoint = `/bookings/${booking._id}/confirm-labor-payment`;
          payload = {
            amount: parseFloat(amount),
            note: note || '',
          };
          break;
        case 'cancel':
          endpoint = `/bookings/${booking._id}/cancel`;
          payload = { reason: reason || 'Cancelled by user' };
          break;
        case 'rate':
          endpoint = `/bookings/${booking._id}/rate`;
          payload = { rating, review: review.trim() };
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

  const handleStarClick = (star) => {
    setActionModal((prev) => ({ ...prev, rating: star }));
    if (actionModal.error) {
      setActionModal((prev) => ({ ...prev, error: '' }));
    }
  };

  const handleRefresh = () => {
    fetchBooking(true);
  };

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

  // Status booleans
  const isPending = booking.status === 'pending';
  const isQuoted = booking.status === 'quoted';
  const isAgreed = booking.status === 'agreed';
  const isMaterialsDelivered = booking.status === 'materials_delivered';
  const isMaterialsConfirmed = booking.status === 'materials_confirmed';
  const isInProgress = booking.status === 'in_progress';
  const isWorkCompleted = booking.status === 'work_completed';
  const isLaborPaid = booking.status === 'labor_paid';
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  // Client actions
  const clientCanCancel = isPending || isQuoted; // only before accepted
  const clientCanAcceptReject = isQuoted;
  const clientCanConfirmMaterialsReceived = isMaterialsDelivered;
  const clientCanRate = isLaborPaid && !booking.clientRating;

  // Technician actions
  const techCanSendQuotation = isPending;
  const techCanSetMaterialSource = isAgreed;
  // If tech buys, they must confirm money received before delivering
  const techCanConfirmMaterialsMoneyReceived = isAgreed && booking.materials?.providedByClient === false && !booking.materials?.moneyReceivedAt;
  const techCanConfirmMaterialsDelivered = isAgreed && (booking.materials?.providedByClient || booking.materials?.moneyReceivedAt) && !booking.materials?.deliveredAt;
  const techCanStartWork = isMaterialsConfirmed;
  const techCanCompleteWork = isInProgress && !booking.workCompletedAt;
  const techCanConfirmLaborPayment = isWorkCompleted && !booking.laborPayment?.confirmedAt;
  const techCanCancel = isPending || isQuoted || isAgreed || isMaterialsDelivered || isMaterialsConfirmed || isInProgress;

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

            {/* Quotation Card */}
            {booking.quotation?.sentAt && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Quotation
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="font-bold text-gray-800">{formatCurrency(booking.quotation.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Labor Cost</p>
                    <p className="font-medium">{formatCurrency(booking.quotation.laborCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Materials Cost</p>
                    <p className="font-medium">{formatCurrency(booking.quotation.materialsCost)}</p>
                  </div>
                </div>
                {booking.quotation.sentAt && (
                  <p className="text-xs text-gray-400 mt-2">Sent on {formatDateTime(booking.quotation.sentAt)}</p>
                )}
                {booking.quotation.acceptedAt && (
                  <p className="text-sm text-green-600 mt-1">Accepted on {formatDateTime(booking.quotation.acceptedAt)}</p>
                )}
                {booking.quotation.rejectedAt && (
                  <p className="text-sm text-red-600 mt-1">Rejected on {formatDateTime(booking.quotation.rejectedAt)}</p>
                )}
                {booking.quotation.rejectionReason && (
                  <p className="text-sm text-red-500 mt-1">Reason: {booking.quotation.rejectionReason}</p>
                )}
              </div>
            )}

            {/* Materials Card */}
            {booking.materials && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-600" />
                  Materials
                </h2>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">Provided by:</span>{' '}
                    <span className="font-medium">
                      {booking.materials.providedByClient ? 'Client' : 'Technician (buys)'}
                    </span>
                  </p>
                  {booking.materials.moneyReceivedAt && (
                    <p className="text-sm text-green-600">
                      Money received: {formatDateTime(booking.materials.moneyReceivedAt)}
                    </p>
                  )}
                  {booking.materials.deliveredAt && (
                    <p className="text-sm text-green-600">
                      Delivered: {formatDateTime(booking.materials.deliveredAt)}
                    </p>
                  )}
                  {booking.materials.confirmedByClientAt && (
                    <p className="text-sm text-green-600">
                      Confirmed by client: {formatDateTime(booking.materials.confirmedByClientAt)}
                    </p>
                  )}
                  {booking.materials.notes && (
                    <p className="text-sm text-gray-600">Note: {booking.materials.notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Labor Payment & Commission Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing & Payment
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

              {/* Labor Payment Confirmation */}
              {booking.laborPayment?.confirmedAt && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Labor payment confirmed</span>
                    <span className="font-medium"> ({formatCurrency(booking.laborPayment.amount)})</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDateTime(booking.laborPayment.confirmedAt)}
                    </span>
                  </p>
                  {booking.laborPayment.notes && (
                    <p className="text-xs text-green-600 mt-1">Note: {booking.laborPayment.notes}</p>
                  )}
                </div>
              )}

              {/* Commission */}
              {booking.commission?.amount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700 flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    <span>Commission (5% of labor): </span>
                    <span className="font-bold">{formatCurrency(booking.commission.amount)}</span>
                    <span className="text-xs text-yellow-600 ml-2">
                      Status: {booking.commission.status || 'pending'}
                    </span>
                  </p>
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
            {((isClient && (clientCanCancel || clientCanAcceptReject || clientCanConfirmMaterialsReceived || clientCanRate)) ||
              (isTechnician && (techCanSendQuotation || techCanSetMaterialSource || techCanConfirmMaterialsMoneyReceived ||
                techCanConfirmMaterialsDelivered || techCanStartWork || techCanCompleteWork ||
                techCanConfirmLaborPayment || techCanCancel))) && (
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
                  {isClient && clientCanAcceptReject && (
                    <>
                      <button
                        onClick={() => openActionModal('acceptQuotation')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Accept Quotation
                      </button>
                      <button
                        onClick={() => openActionModal('rejectQuotation')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Reject Quotation
                      </button>
                    </>
                  )}
                  {isClient && clientCanConfirmMaterialsReceived && (
                    <button
                      onClick={() => openActionModal('confirmMaterialsReceived')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Materials Received
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
                  {isTechnician && techCanSendQuotation && (
                    <button
                      onClick={() => openActionModal('sendQuotation')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Send Quotation
                    </button>
                  )}
                  {isTechnician && techCanSetMaterialSource && (
                    <button
                      onClick={() => openActionModal('setMaterialSource')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Package className="w-4 h-4" />
                      Set Material Source
                    </button>
                  )}
                  {isTechnician && techCanConfirmMaterialsMoneyReceived && (
                    <button
                      onClick={() => openActionModal('confirmMaterialsMoneyReceived')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Confirm Materials Money Received
                    </button>
                  )}
                  {isTechnician && techCanConfirmMaterialsDelivered && (
                    <button
                      onClick={() => openActionModal('confirmMaterialsDelivered')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Truck className="w-4 h-4" />
                      Confirm Materials Delivered
                    </button>
                  )}
                  {isTechnician && techCanStartWork && (
                    <button
                      onClick={() => openActionModal('start')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Start Work
                    </button>
                  )}
                  {isTechnician && techCanCompleteWork && (
                    <button
                      onClick={() => openActionModal('completeWork')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Complete Work
                    </button>
                  )}
                  {isTechnician && techCanConfirmLaborPayment && (
                    <button
                      onClick={() => openActionModal('confirmLaborPayment')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Confirm Labor Payment
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

              {/* Quotation fields */}
              {actionModal.action === 'sendQuotation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={actionModal.totalCost}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, totalCost: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Labor Cost (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={actionModal.laborCost}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, laborCost: e.target.value }))}
                      placeholder="e.g. 3000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materials Cost (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={actionModal.materialsCost}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, materialsCost: e.target.value }))}
                      placeholder="e.g. 2000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </>
              )}

              {/* Material source */}
              {actionModal.action === 'setMaterialSource' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who provides the materials? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="providedByClient"
                        value="true"
                        checked={actionModal.providedByClient === true}
                        onChange={() => setActionModal((prev) => ({ ...prev, providedByClient: true }))}
                        disabled={actionModal.loading}
                      />
                      Client provides
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="providedByClient"
                        value="false"
                        checked={actionModal.providedByClient === false}
                        onChange={() => setActionModal((prev) => ({ ...prev, providedByClient: false }))}
                        disabled={actionModal.loading}
                      />
                      Technician buys
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">If the technician buys, they will need to confirm money received.</p>
                </div>
              )}

              {/* Labor payment amount */}
              {actionModal.action === 'confirmLaborPayment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Received (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={actionModal.amount}
                      onChange={(e) => setActionModal((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g. 3000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={actionModal.loading}
                      min="0"
                      step="1"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">The system will calculate 5% commission automatically.</p>
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

              {/* Rejection reason */}
              {actionModal.action === 'rejectQuotation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={actionModal.reason}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please explain why you are rejecting the quotation..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-20 resize-y"
                    disabled={actionModal.loading}
                    maxLength={200}
                    required
                  />
                </div>
              )}

              {/* Cancel reason */}
              {actionModal.action === 'cancel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation (optional)
                  </label>
                  <input
                    type="text"
                    value={actionModal.reason}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Why are you cancelling?"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={actionModal.loading}
                    maxLength={200}
                  />
                </div>
              )}

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