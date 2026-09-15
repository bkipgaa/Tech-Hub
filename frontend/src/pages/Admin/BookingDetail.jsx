/**
 * BookingDetail.jsx
 * =================
 * Admin: full booking detail with actions.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Ban, Save, User, Wrench,
  MapPin, Calendar, Clock, DollarSign, FileText, Star, Briefcase,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';

// ─── HELPERS ────────────────────────────────────────────────
const STATUS_LABELS = {
  pending: 'Pending',
  quoted: 'Quoted',
  agreed: 'Agreed',
  materials_delivered: 'Materials Delivered',
  materials_confirmed: 'Materials Confirmed',
  in_progress: 'In Progress',
  work_completed: 'Work Completed',
  labor_paid: 'Labor Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No Show',
};

const STATUS_COLORS = {
  pending:              'bg-yellow-100 text-yellow-800',
  quoted:               'bg-blue-100 text-blue-800',
  agreed:               'bg-indigo-100 text-indigo-800',
  materials_delivered:  'bg-cyan-100 text-cyan-800',
  materials_confirmed:  'bg-teal-100 text-teal-800',
  in_progress:          'bg-purple-100 text-purple-800',
  work_completed:       'bg-blue-100 text-blue-800',
  labor_paid:           'bg-emerald-100 text-emerald-800',
  completed:            'bg-green-100 text-green-800',
  cancelled:            'bg-red-100 text-red-800',
  'no-show':            'bg-gray-100 text-gray-700',
};

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatCurrency = (n) => `KES ${Number(n || 0).toLocaleString()}`;

// ═════════════════════════════════════════════════════════════
const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  // Modal state
  const [cancelModal, setCancelModal] = useState({ open: false, reason: '', loading: false });
  const [statusModal, setStatusModal] = useState({ open: false, status: '', reason: '', loading: false });

  // Admin notes
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.get(`/bookings/${id}`);
      setBooking(res.data.data);
      setNotes(res.data.data.adminNotes || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); /* eslint-disable-next-line */ }, [id]);

  const handleCancel = async () => {
    if (!cancelModal.reason.trim()) return;
    setCancelModal((p) => ({ ...p, loading: true }));
    try {
      await adminApi.patch(`/bookings/${id}/cancel`, { reason: cancelModal.reason.trim() });
      setCancelModal({ open: false, reason: '', loading: false });
      await fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
      setCancelModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleForceStatus = async () => {
    if (!statusModal.status) return;
    setStatusModal((p) => ({ ...p, loading: true }));
    try {
      await adminApi.patch(`/bookings/${id}/status`, {
        status: statusModal.status,
        reason: statusModal.reason.trim(),
      });
      setStatusModal({ open: false, status: '', reason: '', loading: false });
      await fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
      setStatusModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await adminApi.patch(`/bookings/${id}/notes`, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save notes.');
    } finally {
      setNotesSaving(false);
    }
  };

  // ─── LOADING / ERROR ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Unable to load booking</p>
          <p className="text-sm mt-0.5">{error}</p>
          <button onClick={() => navigate('/admin/bookings')} className="mt-3 text-sm underline">
            ← Back to bookings
          </button>
        </div>
      </div>
    );
  }

  const client = booking.clientId || {};
  const tech = booking.technicianId || {};
  const techUser = tech.userId || {};
  const canCancel = !['completed', 'cancelled'].includes(booking.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/bookings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Booking #{booking._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-gray-500">{formatDateTime(booking.createdAt)}</p>
          </div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permission="bookings.manage">
            <button
              onClick={() => setStatusModal({ open: true, status: booking.status, reason: '', loading: false })}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Change Status
            </button>
          </PermissionGate>
          <PermissionGate permission="bookings.cancel">
            {canCancel && (
              <button
                onClick={() => setCancelModal({ open: true, reason: '', loading: false })}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                <Ban className="w-4 h-4" /> Cancel Booking
              </button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service */}
          <Card title="Service" icon={Briefcase}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Category" value={booking.serviceCategory} />
              <Detail label="Sub-service" value={booking.subService} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{booking.serviceDescription}</p>
            </div>
          </Card>

          {/* Schedule & Location */}
          <Card title="Schedule & Location" icon={Calendar}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Preferred Date" value={formatDate(booking.preferredDate)} />
              <Detail label="Preferred Time" value={booking.preferredTime} />
              <Detail label="Duration" value={`${booking.duration || booking.estimatedHours} hours`} />
              <Detail label="Payment Method" value={booking.paymentMethod} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>{booking.location?.address || '—'}</span>
            </div>
          </Card>

          {/* Quotation */}
          {booking.quotation?.sentAt && (
            <Card title="Quotation" icon={FileText}>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <Detail label="Total" value={formatCurrency(booking.quotation.totalCost)} />
                <Detail label="Labor" value={formatCurrency(booking.quotation.laborCost)} />
                <Detail label="Materials" value={formatCurrency(booking.quotation.materialsCost)} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Sent</p>
                  <p className="text-gray-700">{formatDateTime(booking.quotation.sentAt)}</p>
                </div>
                {booking.quotation.acceptedAt && (
                  <div>
                    <p className="text-gray-500">Accepted</p>
                    <p className="text-green-700">{formatDateTime(booking.quotation.acceptedAt)}</p>
                  </div>
                )}
                {booking.quotation.rejectedAt && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Rejected</p>
                    <p className="text-red-700">{formatDateTime(booking.quotation.rejectedAt)}</p>
                    <p className="text-red-600 text-xs mt-0.5">{booking.quotation.rejectionReason}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Materials */}
          {booking.materials && (
            <Card title="Materials" icon={Briefcase}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail
                  label="Provided by"
                  value={booking.materials.providedByClient ? 'Client' : 'Technician'}
                />
                {booking.materials.moneyReceivedAt && (
                  <Detail label="Money received" value={formatDateTime(booking.materials.moneyReceivedAt)} />
                )}
                {booking.materials.deliveredAt && (
                  <Detail label="Delivered" value={formatDateTime(booking.materials.deliveredAt)} />
                )}
                {booking.materials.confirmedByClientAt && (
                  <Detail label="Confirmed by client" value={formatDateTime(booking.materials.confirmedByClientAt)} />
                )}
              </div>
            </Card>
          )}

          {/* Payment */}
          <Card title="Payment & Commission" icon={DollarSign}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Total Amount" value={formatCurrency(booking.totalAmount)} />
              <Detail label="Payment Status" value={booking.paymentStatus} />
              {booking.laborPayment?.confirmedAt && (
                <>
                  <Detail label="Labor Paid" value={formatCurrency(booking.laborPayment.amount)} />
                  <Detail label="Labor Confirmed" value={formatDateTime(booking.laborPayment.confirmedAt)} />
                </>
              )}
              {booking.commission?.amount > 0 && (
                <>
                  <Detail label="Commission (5%)" value={formatCurrency(booking.commission.amount)} />
                  <Detail label="Commission Status" value={booking.commission.status} />
                </>
              )}
            </div>
          </Card>

          {/* Ratings */}
          {booking.clientRating && (
            <Card title="Client Rating" icon={Star}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= booking.clientRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {booking.clientRating}/5
                </span>
              </div>
              {booking.clientReview && (
                <p className="mt-3 text-sm text-gray-700 italic">"{booking.clientReview}"</p>
              )}
            </Card>
          )}

          {/* Notes */}
          <Card title="Notes" icon={FileText}>
            <div className="space-y-3">
              {booking.clientNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Client</p>
                  <p className="text-sm text-gray-700">{booking.clientNotes}</p>
                </div>
              )}
              {booking.technicianNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Technician</p>
                  <p className="text-sm text-gray-700">{booking.technicianNotes}</p>
                </div>
              )}
              {booking.cancellationReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">Cancellation ({booking.cancelledBy})</p>
                  <p className="text-sm text-red-700">{booking.cancellationReason}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Admin notes (editable) */}
          <Card title="Admin Notes (internal)" icon={FileText}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add internal notes about this booking..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                {notesSaved && <span className="text-green-600">✓ Saved</span>}
              </p>
              <PermissionGate permission="bookings.manage">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900 disabled:opacity-50"
                >
                  {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Notes
                </button>
              </PermissionGate>
            </div>
          </Card>
        </div>

        {/* RIGHT: People */}
        <div className="space-y-6">
          {/* Client */}
          <Card title="Client" icon={User}>
            <PersonCard
              user={client}
              subtitle="Client"
              extra={client.phone}
            />
          </Card>

          {/* Technician */}
          <Card title="Technician" icon={Wrench}>
            <PersonCard
              user={techUser}
              subtitle={tech.businessName || tech.mainCategory || 'Technician'}
              extra={tech.mainCategory}
            />
          </Card>

          {/* Timeline */}
          <Card title="Timeline" icon={Clock}>
            <div className="space-y-3 text-xs">
              <TimelineItem label="Created" date={booking.createdAt} />
              <TimelineItem label="Quoted" date={booking.quotation?.sentAt} />
              <TimelineItem label="Accepted" date={booking.quotation?.acceptedAt} />
              <TimelineItem label="Started" date={booking.startedAt} />
              <TimelineItem label="Work completed" date={booking.workCompletedAt} />
              <TimelineItem label="Labor paid" date={booking.laborPayment?.confirmedAt} />
              <TimelineItem label="Completed" date={booking.completedAt} />
              {booking.cancelledAt && (
                <TimelineItem label="Cancelled" date={booking.cancelledAt} danger />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Cancel modal ─── */}
      {cancelModal.open && (
        <Modal title="Cancel Booking" onClose={() => !cancelModal.loading && setCancelModal({ open: false, reason: '', loading: false })}>
          <p className="text-sm text-gray-600 mb-3">
            This will cancel the booking and notify both parties. Please provide a reason.
          </p>
          <textarea
            value={cancelModal.reason}
            onChange={(e) => setCancelModal((p) => ({ ...p, reason: e.target.value }))}
            rows="3"
            placeholder="Reason for cancellation..."
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setCancelModal({ open: false, reason: '', loading: false })}
              disabled={cancelModal.loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelModal.loading || !cancelModal.reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelModal.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Confirm Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ─── Status modal ─── */}
      {statusModal.open && (
        <Modal title="Change Status (Admin Override)" onClose={() => !statusModal.loading && setStatusModal({ open: false, status: '', reason: '', loading: false })}>
          <p className="text-sm text-gray-600 mb-3">
            Force-set the booking status. This bypasses normal transitions and should be used carefully.
          </p>
          <label className="block text-xs font-medium text-gray-600 mb-1">New Status</label>
          <select
            value={statusModal.status}
            onChange={(e) => setStatusModal((p) => ({ ...p, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white mb-3"
          >
            {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
          <textarea
            value={statusModal.reason}
            onChange={(e) => setStatusModal((p) => ({ ...p, reason: e.target.value }))}
            rows="2"
            placeholder="Reason for status change..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStatusModal({ open: false, status: '', reason: '', loading: false })}
              disabled={statusModal.loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleForceStatus}
              disabled={statusModal.loading || !statusModal.status}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {statusModal.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────
const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {title}
    </h3>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 font-medium capitalize">{value || '—'}</p>
  </div>
);

const PersonCard = ({ user, subtitle, extra }) => (
  <div className="flex items-start gap-3">
    {user?.profileImage ? (
      <img src={user.profileImage} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
        {user?.firstName?.[0]}{user?.lastName?.[0]}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">
        {user?.firstName} {user?.lastName}
      </p>
      {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      {user?.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
      {user?.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
      {extra && extra !== subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{extra}</p>}
    </div>
  </div>
);

const TimelineItem = ({ label, date, danger }) => {
  if (!date) return null;
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-${danger ? '600' : '600'} ${danger ? 'text-red-600' : ''}`}>{label}</span>
      <span className="text-gray-400">{formatDateTime(date)}</span>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  </div>
);

export default BookingDetail;