/**
 * TechnicianDetail.jsx
 * ====================
 * Admin: view and act on a single technician.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, BadgeCheck, Ban, CheckCircle,
  Mail, Phone, MapPin, Star, Briefcase, Calendar, TrendingUp, Pencil,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import PermissionGate from '../../components/admin/PermissionGate';
import EditExpertProfile from '../../components/admin/EditExpertProfile';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatCurrency = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const TechnicianDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();

  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchTech = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.get(`/technicians/${id}`);
      setTech(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expert.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTech(); /* eslint-disable-next-line */ }, [id]);

  const runAction = async (action, body = {}) => {
    setActing(true);
    try {
      await adminApi.patch(`/technicians/${id}/${action}`, body);
      await fetchTech();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  const handleVerify = () => {
    const note = tech.awaitingApproval ? ' Clients will be able to find them.' : '';
    if (window.confirm(`Mark this expert as verified?${note}`)) runAction('verify');
  };

  const handleReject = () => {
    const reason = window.prompt('Reason for rejection:');
    if (reason?.trim()) runAction('reject', { reason: reason.trim() });
  };

  const handleToggleActive = () => {
    const verb = tech.isActive ? 'suspend' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${verb} this expert?`)) {
      runAction(tech.isActive ? 'suspend' : 'activate');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Unable to load expert</p>
          <p className="text-sm mt-0.5">{error}</p>
          <button onClick={() => navigate('/admin/technicians')} className="mt-3 text-sm underline">
            ← Back to list
          </button>
        </div>
      </div>
    );
  }

  const user = tech.userId || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/technicians')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <PermissionGate permission="technicians.edit">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Edit profile
            </button>
          )}
        </PermissionGate>
        <PermissionGate permission="technicians.verify">
          {/* Rejected experts can still be approved later, e.g. after their profile is fixed */}
          {tech.verificationStatus !== 'verified' && (
            <button
              onClick={handleVerify}
              disabled={acting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <BadgeCheck className="w-4 h-4" /> Approve Verification
            </button>
          )}
          {tech.verificationStatus === 'pending' && (
            <button
              onClick={handleReject}
              disabled={acting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Reject
            </button>
          )}
        </PermissionGate>
        <PermissionGate permission="technicians.suspend">
          <button
            onClick={handleToggleActive}
            disabled={acting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
              tech.isActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {tech.isActive ? <><Ban className="w-4 h-4" /> Suspend</> : <><CheckCircle className="w-4 h-4" /> Reactivate</>}
          </button>
        </PermissionGate>
      </div>

      {/* Grid: Profile + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-6">
          {editing && (
            <EditExpertProfile
              tech={tech}
              onCancel={() => setEditing(false)}
              onSaved={async () => {
                setEditing(false);
                await fetchTech();
              }}
            />
          )}

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" /> {user.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" /> {user.phone || '—'}
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>
                  {[tech.address?.street, tech.address?.city, tech.address?.state, tech.address?.country]
                    .filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Business */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Business</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Business name" value={tech.businessName || '—'} />
              <Detail label="Main category" value={tech.mainCategory || '—'} />
              <Detail label="Service radius" value={`${tech.serviceRadius || 10} km`} />
              <Detail label="Years of experience" value={tech.yearsOfExperience || 0} />
              <Detail label="Service categories" value={tech.serviceCategories?.length || 0} />
              <Detail label="Profile completion" value={`${tech.profileCompletionPercentage || 0}%`} />
            </dl>
            {tech.profileHeadline && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Headline</p>
                <p className="text-sm text-gray-700">{tech.profileHeadline}</p>
              </div>
            )}
            {tech.aboutMe && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">About</p>
                <p className="text-sm text-gray-700 leading-relaxed">{tech.aboutMe}</p>
              </div>
            )}
            {tech.skills?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Skills</p>
                <p className="text-sm text-gray-700">{tech.skills.map((s) => s.name).join(', ')}</p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Services</h2>
            {tech.serviceCategories?.length > 0 ? (
              <ul className="space-y-3">
                {tech.serviceCategories.map((sc) => (
                  <li key={`${sc.mainCategory}||${sc.categoryName}`}>
                    <p className="text-sm font-medium text-gray-800">
                      {sc.categoryName} <span className="text-xs font-normal text-gray-400">· {sc.mainCategory}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{(sc.subServices || []).join(', ')}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No services yet.</p>
            )}
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Bookings</h2>
            {tech.recentBookings?.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {tech.recentBookings.map((b) => (
                  <li key={b._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {b.serviceCategory} · {b.subService}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(b.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-700">{formatCurrency(b.quotation?.sentAt ? b.quotation.totalCost : b.totalAmount)}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{b.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet.</p>
            )}
          </div>

          <RatingHistory ratings={tech.ratingHistory || []} onOpen={(bookingId) => navigate(`/admin/bookings/${bookingId}`)} />
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-3">
              <StatusRow
                label="Verification"
                value={tech.verificationStatus}
                color={
                  tech.verificationStatus === 'verified' ? 'green'
                  : tech.verificationStatus === 'rejected' ? 'red'
                  : 'yellow'
                }
              />
              <StatusRow
                label="Visible to clients"
                value={tech.awaitingApproval ? 'Hidden until approved' : tech.isActive ? 'Yes' : 'No'}
                color={tech.awaitingApproval ? 'yellow' : tech.isActive ? 'green' : 'gray'}
              />
              <StatusRow
                label="Account"
                value={tech.isActive ? 'Active' : 'Suspended'}
                color={tech.isActive ? 'green' : 'red'}
              />
              <StatusRow
                label="Availability"
                value={tech.isAvailable ? 'Available' : 'Unavailable'}
                color={tech.isAvailable ? 'blue' : 'gray'}
              />
              <StatusRow
                label="Featured"
                value={tech.isFeatured ? 'Yes' : 'No'}
                color={tech.isFeatured ? 'purple' : 'gray'}
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Subscription</h3>
            <dl className="space-y-2 text-sm">
              <Detail label="Plan" value={tech.subscription?.plan || 'free'} />
              <Detail label="Price" value={formatCurrency(tech.subscription?.planDetails?.price || 0)} />
              <Detail label="Started" value={formatDate(tech.subscription?.startDate)} />
              <Detail label="Ends" value={formatDate(tech.subscription?.endDate)} />
              <Detail label="Auto-renew" value={tech.subscription?.autoRenew ? 'On' : 'Off'} />
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={Star} label="Rating" value={tech.rating?.average?.toFixed(1) || '0.0'} />
              <MiniStat icon={Briefcase} label="Jobs done" value={tech.statistics?.completedJobs || 0} />
              <MiniStat icon={TrendingUp} label="Views" value={tech.views || 0} />
              <MiniStat icon={Calendar} label="Joined" value={formatDate(tech.createdAt)} small />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Rating history ─────────────────────────────────────────
// Ratings closer together than this are highlighted (matches the server's short_gap flag)
const SHORT_GAP_MINUTES = 4 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

const formatGap = (minutes) => {
  if (minutes === undefined || minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 48 * 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${Math.round(minutes / (24 * 60))} days`;
};

const RATING_STATUS_LABEL = {
  held: { label: 'Held', color: 'bg-yellow-100 text-yellow-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
};

const RatingHistory = ({ ratings, onOpen }) => {
  const [now] = useState(() => Date.now()); // page load time, for the 24 h / 7 day counts
  const ratedTime = (r) => new Date(r.ratingCheck?.ratedAt || r.completedAt).getTime();
  // Newest first; the gap is to the next older rating
  const rows = ratings.map((r, i) => {
    const older = ratings[i + 1];
    const gap = older ? Math.round((ratedTime(r) - ratedTime(older)) / 60000) : null;
    const clientAgeDays = r.clientId?.createdAt
      ? Math.floor((ratedTime(r) - new Date(r.clientId.createdAt).getTime()) / DAY_MS)
      : null;
    return { ...r, gap, clientAgeDays, short: gap !== null && gap < SHORT_GAP_MINUTES };
  });
  const last24h = rows.filter((r) => now - ratedTime(r) < DAY_MS).length;
  const last7d = rows.filter((r) => now - ratedTime(r) < 7 * DAY_MS).length;
  const shortGaps = rows.filter((r) => r.short).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-1">Rating History</h2>
      <p className="text-xs text-gray-500 mb-4">
        {last24h} in the last 24 h · {last7d} in the last 7 days ·{' '}
        <span className={shortGaps ? 'text-yellow-700 font-medium' : ''}>
          {shortGaps} less than {SHORT_GAP_MINUTES / 60} h after the previous one
        </span>
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No ratings yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Rated at</th>
                <th className="py-2 pr-3 font-medium">Stars</th>
                <th className="py-2 pr-3 font-medium">Client</th>
                <th className="py-2 pr-3 font-medium">Gap to previous</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const status = RATING_STATUS_LABEL[r.ratingCheck?.status];
                return (
                  <tr
                    key={r._id}
                    onClick={() => onOpen(r._id)}
                    className={`cursor-pointer hover:bg-gray-50 ${r.short || r.ratingCheck?.status === 'held' ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-800">{formatDateTime(r.ratingCheck?.ratedAt || r.completedAt)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5 text-gray-800">
                        {r.clientRating} <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <p className="text-gray-800 truncate max-w-[10rem]">{r.clientId?.firstName} {r.clientId?.lastName}</p>
                      {r.clientAgeDays !== null && (
                        <p className={`text-[11px] ${r.clientAgeDays < 7 ? 'text-yellow-700' : 'text-gray-400'}`}>
                          account {r.clientAgeDays < 1 ? 'under a day' : `${r.clientAgeDays} days`} old when rating
                        </p>
                      )}
                    </td>
                    <td className={`py-2 pr-3 whitespace-nowrap ${r.short ? 'text-yellow-800 font-medium' : 'text-gray-600'}`}>
                      {formatGap(r.gap)}
                    </td>
                    <td className="py-2 text-right">
                      {status && <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${status.color}`}>{status.label}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────
const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-800 font-medium capitalize">{value}</dd>
  </div>
);

const StatusRow = ({ label, value, color }) => {
  const colors = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray:   'bg-gray-100 text-gray-700',
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
};

const MiniStat = ({ icon: Icon, label, value, small }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
    <p className={`font-bold text-gray-800 ${small ? 'text-xs' : 'text-base'}`}>{value}</p>
  </div>
);

export default TechnicianDetail;