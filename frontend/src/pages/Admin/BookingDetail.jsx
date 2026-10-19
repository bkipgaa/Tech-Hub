/**
 * BookingDetail.jsx
 * =================
 * Admin: full booking detail with actions.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Ban, Save, User, Wrench,
  MapPin, Calendar, Clock, DollarSign, FileText, Star, Briefcase, Camera, AlertTriangle,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';
import { cldImage, AVATAR_WIDTH } from '../../utils/media';

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

const mapsLink = ({ lat, lng }) => `https://www.google.com/maps?q=${lat},${lng}`;

// Proof-of-work checks (set by the server; none of them block the job on their own)
const EVIDENCE_FLAG_LABELS = {
  no_job_pin: 'Client never pinned the job location',
  no_gps: 'No GPS with photo',
  low_accuracy: 'GPS not precise (>200 m)',
  far_from_job: 'Photo taken far from the job location',
  stale_capture: 'Photo sent long after it was taken (or device clock off)',
  near_duplicate_photo: 'Looks like a photo used on another booking',
  exif_old: 'Camera data says the photo is older',
  exif_far: 'Camera GPS far from the job',
  link_unreachable: 'Live link could not be opened',
  too_fast: 'Marked done very soon after starting',
  before_booking_date: 'Completed before the booking date',
  client_disputed: 'Client reported a problem',
};

const REVIEW_STATUS = {
  none: { label: 'No evidence yet', color: 'bg-gray-100 text-gray-700' },
  auto_ok: { label: 'No issues found', color: 'bg-green-100 text-green-800' },
  flagged: { label: 'Needs review', color: 'bg-yellow-100 text-yellow-800' },
  admin_ok: { label: 'Approved by admin', color: 'bg-green-100 text-green-800' },
  admin_rejected: { label: 'Rejected by admin', color: 'bg-red-100 text-red-800' },
};

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
  const [reviewModal, setReviewModal] = useState({ open: false, decision: '', note: '', loading: false });

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

  const handleEvidenceReview = async () => {
    setReviewModal((p) => ({ ...p, loading: true }));
    try {
      await adminApi.patch(`/bookings/${id}/evidence-review`, {
        decision: reviewModal.decision,
        note: reviewModal.note.trim(),
      });
      setReviewModal({ open: false, decision: '', note: '', loading: false });
      await fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save the review.');
      setReviewModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleRatingReview = async (decision) => {
    const note = decision === 'rejected' ? window.prompt('Reason for rejecting this rating (optional):') : '';
    if (note === null) return;
    setActing(true);
    try {
      await adminApi.patch(`/bookings/${id}/rating-review`, { decision, note: note || '' });
      await fetchBooking();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save the rating review.');
    } finally {
      setActing(false);
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
  const evidence = booking.completionEvidence || {};
  const workConfirmation = booking.clientWorkConfirmation || {};

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
              <div>
                <span>{booking.location?.address || '—'}</span>
                {booking.location?.coordinates?.lat !== undefined ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Pinned by client {formatDateTime(booking.location.pinnedAt)}
                    {booking.location.accuracy ? ` (±${booking.location.accuracy} m)` : ''} ·{' '}
                    <a href={mapsLink(booking.location.coordinates)} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
                      map
                    </a>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Job location not pinned by the client</p>
                )}
              </div>
            </div>
          </Card>

          {/* Proof of work */}
          {(evidence.submittedAt || evidence.photos?.length > 0 || evidence.link?.url) && (
            <Card title="Proof of Work" icon={Camera}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${(REVIEW_STATUS[evidence.reviewStatus] || REVIEW_STATUS.none).color}`}>
                  {(REVIEW_STATUS[evidence.reviewStatus] || REVIEW_STATUS.none).label}
                </span>
                {evidence.submittedAt && (
                  <PermissionGate permission="bookings.manage">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewModal({ open: true, decision: 'admin_ok', note: '', loading: false })}
                        className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-xs font-medium hover:bg-green-50"
                      >
                        Approve
                      </button>
                      {booking.status !== 'completed' && (
                        <button
                          onClick={() => setReviewModal({ open: true, decision: 'admin_rejected', note: '', loading: false })}
                          className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-medium hover:bg-red-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </PermissionGate>
                )}
              </div>

              {evidence.flags?.length > 0 && (
                <ul className="mb-4 space-y-1">
                  {evidence.flags.map((f) => (
                    <li key={f} className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {EVIDENCE_FLAG_LABELS[f] || f}
                    </li>
                  ))}
                </ul>
              )}

              {evidence.reviewedAt && (
                <p className="text-xs text-gray-500 mb-4">
                  Reviewed {formatDateTime(evidence.reviewedAt)}{evidence.reviewNote ? ` — ${evidence.reviewNote}` : ''}
                </p>
              )}

              {(workConfirmation.confirmedAt || workConfirmation.autoConfirmedAt || workConfirmation.disputedAt) && (
                <div className="mb-4 text-sm space-y-0.5">
                  {workConfirmation.confirmedAt && <p className="text-green-700">Client confirmed the work {formatDateTime(workConfirmation.confirmedAt)}</p>}
                  {workConfirmation.autoConfirmedAt && <p className="text-gray-600">Auto-confirmed (client silent) {formatDateTime(workConfirmation.autoConfirmedAt)}</p>}
                  {workConfirmation.disputedAt && (
                    <p className="text-red-700">Client disputed {formatDateTime(workConfirmation.disputedAt)}: "{workConfirmation.disputeReason}"</p>
                  )}
                </div>
              )}

              {evidence.link?.url && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <a href={evidence.link.url} target="_blank" rel="noopener noreferrer nofollow" className="text-green-700 hover:underline break-all">
                    {evidence.link.url}
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    {evidence.link.reachable ? `Reachable (HTTP ${evidence.link.httpStatus})` : `Not reachable${evidence.link.error ? `: ${evidence.link.error}` : ''}${evidence.link.httpStatus ? ` (HTTP ${evidence.link.httpStatus})` : ''}`}
                    {evidence.link.finalUrl && evidence.link.finalUrl !== evidence.link.url ? ` → ${evidence.link.finalUrl}` : ''}
                    {' · checked '}{formatDateTime(evidence.link.checkedAt)}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {(evidence.photos || []).map((photo) => (
                  <div key={photo._id} className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <a href={photo.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={cldImage(photo.url, 400)} alt="Evidence" className="w-full sm:w-40 aspect-square object-cover rounded-lg border border-gray-200" />
                    </a>
                    <div className="text-xs text-gray-600 space-y-0.5 min-w-0">
                      <p>
                        <span className="text-gray-400">Captured:</span> {formatDateTime(photo.capturedAt)}
                        {' · '}<span className="text-gray-400">received:</span> {formatDateTime(photo.receivedAt)}
                      </p>
                      <p>
                        <span className="text-gray-400">Method:</span>{' '}
                        {photo.captureMethod === 'capture_input' ? 'Phone camera via file input (lower trust)' : 'In-browser camera'}
                      </p>
                      {photo.gps?.lat !== undefined && (
                        <p>
                          <span className="text-gray-400">GPS:</span>{' '}
                          <a href={mapsLink(photo.gps)} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
                            {photo.gps.lat.toFixed(5)}, {photo.gps.lng.toFixed(5)}
                          </a>
                          {photo.gps.accuracy ? ` (±${photo.gps.accuracy} m)` : ''}
                          {Number.isFinite(photo.distanceFromJobM) ? ` · ${photo.distanceFromJobM} m from job pin` : ''}
                        </p>
                      )}
                      {photo.exif && (
                        <p>
                          <span className="text-gray-400">EXIF:</span>{' '}
                          {[photo.exif.make, photo.exif.model].filter(Boolean).join(' ') || 'camera unknown'}
                          {photo.exif.takenAt ? ` · taken ${formatDateTime(photo.exif.takenAt)}` : ''}
                          {photo.exif.lat !== undefined ? ` · ${photo.exif.lat.toFixed(5)}, ${photo.exif.lng.toFixed(5)}` : ''}
                        </p>
                      )}
                      <p className="truncate" title={photo.userAgent}>
                        <span className="text-gray-400">IP:</span> {photo.ip || '—'} · {photo.userAgent || ''}
                      </p>
                      {photo.flags?.length > 0 && (
                        <p className="text-yellow-800">{photo.flags.map((f) => EVIDENCE_FLAG_LABELS[f] || f).join(' · ')}</p>
                      )}
                      {photo.similarElsewhere?.length > 0 && (
                        <div className="text-red-700">
                          Similar photo on other booking(s):{' '}
                          {photo.similarElsewhere.map((m) => (
                            <button
                              key={`${m.bookingId}-${m.url}`}
                              onClick={() => navigate(`/admin/bookings/${m.bookingId}`)}
                              className="underline mr-2"
                            >
                              #{String(m.bookingId).slice(-8).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
                  value={booking.materials.providedByClient ? 'Client' : 'Expert'}
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
              <RatingTiming booking={booking} />
              {booking.ratingCheck?.status === 'held' && (
                <PermissionGate permission="bookings.manage">
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRatingReview('approved')}
                      disabled={acting}
                      className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-xs font-medium hover:bg-green-50 disabled:opacity-50"
                    >
                      Approve & count rating
                    </button>
                    <button
                      onClick={() => handleRatingReview('rejected')}
                      disabled={acting}
                      className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject rating
                    </button>
                  </div>
                </PermissionGate>
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
                  <p className="text-xs text-gray-500 mb-0.5">Expert</p>
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
          <Card title="Expert" icon={Wrench}>
            <PersonCard
              user={techUser}
              subtitle={tech.businessName || tech.mainCategory || 'Expert'}
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

      {/* ─── Evidence review modal ─── */}
      {reviewModal.open && (
        <Modal
          title={reviewModal.decision === 'admin_ok' ? 'Approve Proof of Work' : 'Reject Proof of Work'}
          onClose={() => !reviewModal.loading && setReviewModal({ open: false, decision: '', note: '', loading: false })}
        >
          <p className="text-sm text-gray-600 mb-3">
            {reviewModal.decision === 'admin_ok'
              ? 'Approving lets the expert record the labor payment even if the client disputed or has not answered.'
              : 'Rejecting stops the expert from recording payment and stops the client from rating this job.'}
          </p>
          <textarea
            value={reviewModal.note}
            onChange={(e) => setReviewModal((p) => ({ ...p, note: e.target.value }))}
            rows="3"
            maxLength={500}
            placeholder={reviewModal.decision === 'admin_ok' ? 'Note (optional)' : 'Reason (shown to both people)'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setReviewModal({ open: false, decision: '', note: '', loading: false })}
              disabled={reviewModal.loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleEvidenceReview}
              disabled={reviewModal.loading || (reviewModal.decision === 'admin_rejected' && !reviewModal.note.trim())}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                reviewModal.decision === 'admin_ok' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {reviewModal.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reviewModal.decision === 'admin_ok' ? 'Approve' : 'Reject'}
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

// ─── Rating timing ──────────────────────────────────────────
const RATING_STATUS = {
  counted: { label: 'Counted', color: 'bg-green-100 text-green-800' },
  held: { label: 'Held — over daily limit', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved by admin', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected by admin', color: 'bg-red-100 text-red-800' },
};

const formatGap = (minutes) => {
  if (minutes === undefined || minutes === null) return 'first rating';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 48 * 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${Math.round(minutes / (24 * 60))} days`;
};

const RatingTiming = ({ booking }) => {
  const check = booking.ratingCheck;
  const ratedAt = check?.ratedAt || booking.completedAt;
  if (!ratedAt) return null;
  const status = RATING_STATUS[check?.status];
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
      <p>
        <span className="text-gray-400">Rated:</span> {formatDateTime(ratedAt)}
        {booking.workCompletedAt && <> · <span className="text-gray-400">work done:</span> {formatDateTime(booking.workCompletedAt)}</>}
      </p>
      {check && (
        <p>
          <span className="text-gray-400">Since this expert's previous rating:</span> {formatGap(check.minutesSincePreviousRating)}
          {' · '}<span className="text-gray-400">counted ratings in the 24 h before:</span> {check.ratingsInPrevious24h ?? 0}
        </p>
      )}
      {status && <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>}
      {check?.flags?.includes('short_gap') && (
        <p className="text-yellow-800 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Rated soon after the expert's previous rating
        </p>
      )}
      {check?.reviewedAt && (
        <p className="text-gray-500">Reviewed {formatDateTime(check.reviewedAt)}{check.reviewNote ? ` — ${check.reviewNote}` : ''}</p>
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
      <img src={cldImage(user.profileImage, AVATAR_WIDTH)} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
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