/**
 * TechnicianHome.jsx
 * ==================
 * Home page sections shown to a signed-in technician, above the regular
 * service browsing (technicians also hire others for jobs outside their skills).
 *
 *   1. Your business at a glance — job requests, commission, reputation, plan
 *   2. Subscription plans — visibility radius per plan, current one highlighted
 *   3. Grow your business — profile completeness, jobs near you
 *
 * Each card loads independently, so one failing request doesn't hide the rest.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Wallet,
  Star,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { visiblePlans } from '../../utils/plans';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '';

const StatCard = ({ icon: Icon, title, children, action, onAction, tone = 'default' }) => {
  const tones = {
    default: 'border-gray-200',
    warning: 'border-red-300 bg-red-50',
  };
  return (
    <div className={`bg-white rounded-xl border p-5 flex flex-col ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-3">
        <Icon className={`w-4 h-4 ${tone === 'warning' ? 'text-red-600' : 'text-green-600'}`} />
        {title}
      </div>
      <div className="flex-1">{children}</div>
      {action && (
        <button
          onClick={onAction}
          className={`mt-4 self-start text-sm font-semibold flex items-center gap-1 ${
            tone === 'warning' ? 'text-red-700 hover:text-red-800' : 'text-green-700 hover:text-green-800'
          }`}
        >
          {action}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Profile items that most help clients choose a technician
const missingProfileItems = (profile) => {
  if (!profile) return [];
  const missing = [];
  if (!profile.aboutMe) missing.push('About me');
  if (!profile.profileHeadline) missing.push('Headline');
  if (!profile.portfolio?.length) missing.push('Portfolio photos');
  if (!profile.skills?.length) missing.push('Skills');
  if (!profile.certifications?.length) missing.push('Certifications');
  return missing;
};

const TechnicianHome = () => {
  const navigate = useNavigate();
  const { technicianProfile } = useAuth();

  const [pendingRequests, setPendingRequests] = useState(null);
  const [commission, setCommission] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api
      .get('/bookings/my-bookings', { params: { status: 'pending', limit: 1 } })
      .then((r) => setPendingRequests(r.data?.pagination?.total ?? r.data?.data?.length ?? 0))
      .catch(() => setPendingRequests(null));
    api
      .get('/bookings/commissions')
      .then((r) => setCommission(r.data?.data?.summary || null))
      .catch(() => setCommission(null));
    api
      .get('/subscription/current')
      .then((r) => setSubscription(r.data?.data || null))
      .catch(() => setSubscription(null));
    api
      .get('/subscription/plans')
      .then((r) => setPlans(visiblePlans(r.data?.data || [])))
      .catch(() => setPlans([]));
  }, []);

  const rating = technicianProfile?.rating;
  const completedJobs = technicianProfile?.statistics?.completedJobs || 0;
  const currentPlanId = subscription?.plan || technicianProfile?.subscription?.plan;
  const currentPlanName =
    plans.find((p) => p.id === currentPlanId)?.name ||
    (currentPlanId === 'trial' ? 'Free Trial' : currentPlanId === 'free' ? 'Free' : currentPlanId) ||
    'Free';
  const radius = subscription?.visibilityRadius;
  const completion = technicianProfile?.profileCompletionPercentage ?? 0;
  const missing = missingProfileItems(technicianProfile);
  const commissionDue = commission?.totalDue || 0;

  return (
    <>
      {/* ─── YOUR BUSINESS AT A GLANCE ─────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Business at a Glance</h2>
          <p className="text-gray-500 text-sm">Everything that needs your attention, in one place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Inbox}
            title="Job requests"
            action="View requests"
            onAction={() => navigate('/technician-dashboard/bookings')}
          >
            <p className="text-3xl font-bold text-gray-800">{pendingRequests ?? '—'}</p>
            <p className="text-sm text-gray-500 mt-1">
              {pendingRequests ? 'waiting for your quotation' : 'No new requests right now'}
            </p>
          </StatCard>

          <StatCard
            icon={commission?.isOverdue ? AlertTriangle : Wallet}
            title="Commission"
            tone={commission?.isOverdue ? 'warning' : 'default'}
            action={commissionDue > 0 ? 'Pay now' : 'View commissions'}
            onAction={() => navigate('/technician-dashboard/commissions')}
          >
            <p className="text-3xl font-bold text-gray-800">KES {commissionDue.toLocaleString()}</p>
            <p className={`text-sm mt-1 ${commission?.isOverdue ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
              {commission?.isOverdue
                ? 'Overdue — new bookings are paused'
                : commissionDue > 0
                ? `Due ${formatDate(commission?.earliestDue)}`
                : 'Nothing due'}
            </p>
          </StatCard>

          <StatCard
            icon={Star}
            title="Reputation"
            action="See your profile"
            onAction={() => navigate(technicianProfile?._id ? `/technician/${technicianProfile._id}` : '/technician-dashboard')}
          >
            <p className="text-3xl font-bold text-gray-800">
              {rating?.count ? rating.average.toFixed(1) : 'New'}
              {rating?.count ? <span className="text-yellow-500 text-2xl"> ★</span> : null}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {rating?.count || 0} review{rating?.count === 1 ? '' : 's'} · {completedJobs} job
              {completedJobs === 1 ? '' : 's'} completed
            </p>
            <p className="text-xs text-gray-400 mt-1">Higher ratings move you up in search.</p>
          </StatCard>

          <StatCard
            icon={MapPin}
            title="Your plan"
            action="Change plan"
            onAction={() => navigate('/subscription')}
          >
            <p className="text-2xl font-bold text-gray-800">{currentPlanName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {radius ? `Visible within ${radius} km` : 'Visibility radius unavailable'}
              {subscription?.daysRemaining > 0 ? ` · ${subscription.daysRemaining} days left` : ''}
            </p>
          </StatCard>
        </div>
      </div>

      {/* ─── SUBSCRIPTION PLANS ────────────────────────────── */}
      {plans.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Reach More Clients</h2>
            <p className="text-gray-500 text-sm">
              Your plan sets how far away clients can find you. Every plan runs for 30 days.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 text-center flex flex-col ${
                    isCurrent ? 'border-green-600 bg-green-50 ring-2 ring-green-600' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{plan.name}</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    KES {Number(plan.price).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex-1">
                    Visible within <strong>{plan.visibilityRadius} km</strong>
                  </p>
                  {isCurrent ? (
                    <span className="mt-3 text-xs font-semibold text-green-700 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Current plan
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate('/subscription')}
                      className="mt-3 text-sm font-semibold bg-green-600 text-white rounded-lg py-1.5 hover:bg-green-700 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── GROW YOUR BUSINESS ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Grow Your Business</h2>
          <p className="text-gray-500 text-sm">Small steps that win you more clients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={UserCheck}
            title="Profile strength"
            action={missing.length ? 'Complete your profile' : 'Edit profile'}
            onAction={() => navigate('/technician-dashboard')}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${Math.min(completion, 100)}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{completion}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {missing.length
                ? `Add: ${missing.join(', ')}. Complete profiles get chosen more often.`
                : 'Your profile is complete — nice work.'}
            </p>
          </StatCard>

          <StatCard
            icon={Briefcase}
            title="Jobs posted by clients"
            action="Browse available jobs"
            onAction={() => navigate('/available-jobs')}
          >
            <p className="text-sm text-gray-600">
              Clients also post jobs on the job board. Apply to the ones that match your skills to win work beyond direct bookings.
            </p>
          </StatCard>
        </div>
      </div>
    </>
  );
};

export default TechnicianHome;
