/**
 * UserDetail.jsx
 * ==============
 * Admin page for one user: account details, location (with coordinates),
 * role, their expert profile (create it to make them an expert, or edit it)
 * and, for experts, their subscription plan.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, ExternalLink, Loader2, MapPin, Pencil, Save, UserPlus, Wrench } from 'lucide-react';
import adminApi from '../../services/adminApi';
import api from '../../services/api';
import { adminUserServiceFull } from '../../services/adminRevenueService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import PermissionGate from '../../components/admin/PermissionGate';
import EditExpertProfile from '../../components/admin/EditExpertProfile';
import ServicePicker from '../../components/ServicePicker';
import { EMPTY_GROUP, servicesError } from '../../utils/serviceGroups';
import { PLAN_TIERS, formatKes } from '../../utils/plans';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const Field = ({ label, hint, children }) => (
  <label className="block text-sm font-medium text-gray-700">
    {label}
    {children}
    {hint && <span className="block text-xs font-normal text-gray-400 mt-1">{hint}</span>}
  </label>
);

const Card = ({ title, icon: Icon, children, action }) => (
  <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-green-600" />} {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const Notice = ({ notice }) =>
  notice?.text ? (
    <div
      className={`text-sm p-3 rounded-lg border ${
        notice.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'
      }`}
    >
      {notice.text}
    </div>
  ) : null;

const SaveButton = ({ saving, children = 'Save changes' }) => (
  <button
    type="submit"
    disabled={saving}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
  >
    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {children}
  </button>
);

const errorText = (err, fallback) => err.response?.data?.message || fallback;

const formFromUser = (user) => ({
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  email: user.email || '',
  phone: user.phone || '',
  status: user.status || 'active',
  role: user.role || 'client',
  signupIntent: user.signupIntent || '',
  city: user.address?.city || '',
  state: user.address?.state || '',
  country: user.address?.country || 'Kenya',
  lat: user.location?.lat ?? '',
  lng: user.location?.lng ?? '',
  formattedAddress: user.location?.formattedAddress || '',
});

// ─────────────────────────────────────────────────────────────
// Account + location
// ─────────────────────────────────────────────────────────────
const AccountForm = ({ user, hasExpertProfile, onSaved }) => {
  const [form, setForm] = useState(() => formFromUser(user));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return setNotice({ type: 'error', text: 'First and last name are required.' });
    if (!form.email.trim() || !form.phone.trim()) return setNotice({ type: 'error', text: 'Email and phone are required.' });
    const hasLat = String(form.lat).trim() !== '';
    const hasLng = String(form.lng).trim() !== '';
    if (hasLat !== hasLng) return setNotice({ type: 'error', text: 'Enter both latitude and longitude, or neither.' });

    setSaving(true);
    setNotice(null);
    try {
      await adminUserServiceFull.update(user._id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        status: form.status,
        role: form.role,
        signupIntent: form.signupIntent,
        address: { city: form.city, state: form.state, country: form.country },
        location: hasLat
          ? { lat: form.lat, lng: form.lng, formattedAddress: form.formattedAddress }
          : { formattedAddress: form.formattedAddress },
      });
      setNotice({ type: 'success', text: 'Saved.' });
      onSaved();
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err, 'Could not save the user.') });
    } finally {
      setSaving(false);
    }
  };

  const mapUrl =
    String(form.lat).trim() && String(form.lng).trim()
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${form.lat},${form.lng}`)}`
      : null;

  return (
    <form onSubmit={save} className="space-y-6">
      <Card title="Account" icon={Pencil}>
        <Notice notice={notice} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First name"><input className={inputClass} value={form.firstName} onChange={set('firstName')} /></Field>
          <Field label="Last name"><input className={inputClass} value={form.lastName} onChange={set('lastName')} /></Field>
          <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Account status">
            <select className={inputClass} value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </Field>
          <Field
            label="Role"
            hint={
              hasExpertProfile
                ? 'Client hides their expert profile from search; Expert shows it again.'
                : 'To make them an expert, create their expert profile below.'
            }
          >
            <select className={inputClass} value={form.role} onChange={set('role')} disabled={user.role === 'admin'}>
              <option value="client">Client</option>
              <option value="technician" disabled={!hasExpertProfile}>Expert</option>
              {user.role === 'admin' && <option value="admin">Admin</option>}
            </select>
          </Field>
          <Field label="Signed up as">
            <select className={inputClass} value={form.signupIntent} onChange={set('signupIntent')}>
              <option value="">—</option>
              <option value="expert">Expert</option>
              <option value="client">Client</option>
              <option value="lister">Property lister</option>
              <option value="stay_seeker">Stay / space seeker</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card
        title="Location"
        icon={MapPin}
        action={
          mapUrl && (
            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-sm text-green-700 inline-flex items-center gap-1 hover:underline">
              View on map <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Town"><input className={inputClass} value={form.city} onChange={set('city')} /></Field>
          <Field label="County"><input className={inputClass} value={form.state} onChange={set('state')} /></Field>
          <Field label="Country"><input className={inputClass} value={form.country} onChange={set('country')} /></Field>
          <Field label="Latitude" hint="e.g. -1.286389">
            <input className={inputClass} inputMode="decimal" value={form.lat} onChange={set('lat')} />
          </Field>
          <Field label="Longitude" hint="e.g. 36.817223">
            <input className={inputClass} inputMode="decimal" value={form.lng} onChange={set('lng')} />
          </Field>
          <Field label="Address description"><input className={inputClass} value={form.formattedAddress} onChange={set('formattedAddress')} /></Field>
        </div>
        <p className="text-xs text-gray-500">
          {hasExpertProfile
            ? 'Saving also moves their expert profile to this location, which decides which clients can find them.'
            : 'Used for "near me" results.'}
        </p>
        <div className="flex justify-end">
          <SaveButton saving={saving} />
        </div>
      </Card>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// Make expert: create their expert profile
// ─────────────────────────────────────────────────────────────
const MakeExpertForm = ({ user, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [services, setServices] = useState([{ ...EMPTY_GROUP }]);
  const [form, setForm] = useState({ businessName: '', profileHeadline: '', aboutMe: '', yearsOfExperience: 0 });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!open || catalog) return;
    api
      .get('/service-catalog/complete')
      .then((r) => setCatalog(r.data?.data || {}))
      .catch(() => setCatalog({}));
  }, [open, catalog]);

  const create = async (e) => {
    e.preventDefault();
    const problem = servicesError(services);
    if (problem) return setNotice({ type: 'error', text: problem });
    setSaving(true);
    setNotice(null);
    try {
      await adminApi.post(`/users/${user._id}/technician`, {
        ...form,
        yearsOfExperience: Math.max(0, Number(form.yearsOfExperience) || 0),
        services: services.filter((g) => g.mainCategory),
      });
      onCreated();
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err, 'Could not create the expert profile.') });
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Card title="Expert profile" icon={Wrench}>
        <p className="text-sm text-gray-600">This user is not an expert. Create an expert profile to make them one.</p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
        >
          <UserPlus className="w-4 h-4" /> Make expert
        </button>
      </Card>
    );
  }

  return (
    <form onSubmit={create}>
      <Card title="Create expert profile" icon={UserPlus}>
        <Notice notice={notice} />
        <p className="text-xs text-gray-500">
          Uses their saved town, county and location. They start on the Free plan and are visible to clients straight away.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business name"><input className={inputClass} value={form.businessName} onChange={set('businessName')} /></Field>
          <Field label="Years of experience">
            <input type="number" min="0" className={inputClass} value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
          </Field>
        </div>
        <Field label="Headline"><input className={inputClass} value={form.profileHeadline} onChange={set('profileHeadline')} maxLength={200} /></Field>
        <Field label="About"><textarea className={inputClass} rows={4} value={form.aboutMe} onChange={set('aboutMe')} maxLength={2000} /></Field>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Services</p>
          {catalog ? <ServicePicker catalog={catalog} value={services} onChange={setServices} /> : <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <SaveButton saving={saving}>Create expert profile</SaveButton>
        </div>
      </Card>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// Subscription (experts)
// ─────────────────────────────────────────────────────────────
const SubscriptionCard = ({ tech, onSaved }) => {
  const sub = tech.subscription || {};
  const currentId = !sub.plan || sub.plan === 'trial' ? 'free' : sub.plan;
  const endDate = sub.endDate ? new Date(sub.endDate) : null;
  const active = currentId === 'free' || (endDate && endDate > new Date());
  const [planId, setPlanId] = useState(currentId === 'free' ? 'basic' : currentId);
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const tier = PLAN_TIERS.find((p) => p.id === planId);

  const run = async (request, fallback) => {
    setSaving(true);
    setNotice(null);
    try {
      const r = await request();
      setNotice({ type: 'success', text: r.data.message || 'Saved.' });
      onSaved();
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err, fallback) });
    } finally {
      setSaving(false);
    }
  };

  const setPlan = (e) => {
    e.preventDefault();
    run(() => adminApi.patch(`/subscriptions/${tech._id}/plan`, { planId, days: Number(days) }), 'Could not set the plan.');
  };

  return (
    <Card title="Subscription" icon={Crown}>
      <Notice notice={notice} />
      <div className="text-sm text-gray-700 space-y-1">
        <p>
          Current plan: <strong>{PLAN_TIERS.find((p) => p.id === currentId)?.name || sub.planDetails?.name || currentId}</strong>
          {sub.isFreeMonth && ' (free month)'}
          {!active && <span className="ml-2 text-red-600">(ended — on Free now)</span>}
        </p>
        {endDate && active && <p>Ends {endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        {(currentId === 'free' || !active) && <p className="text-amber-700">Owes KES 500 commission on each new job.</p>}
      </div>

      <PermissionGate permission="subscriptions.manage" fallback={<p className="text-xs text-gray-400">You can't change plans.</p>}>
        <form onSubmit={setPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Plan">
            <select className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PLAN_TIERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.radius.toLocaleString()} km — {p.price ? `${formatKes(p.price)}/month` : 'free, commission per job'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Days" hint={tier?.price ? 'Runs from today; no payment is taken.' : 'Free never ends.'}>
            <input type="number" min="1" max="365" className={inputClass} value={days} onChange={(e) => setDays(e.target.value)} disabled={!tier?.price} />
          </Field>
          <div>
            <SaveButton saving={saving}>Set plan</SaveButton>
          </div>
        </form>
        {currentId !== 'free' && active && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => run(() => adminApi.patch(`/subscriptions/${tech._id}/extend`, { days: Number(days) || 30 }), 'Could not extend the plan.')}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Extend by {Number(days) || 30} days
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => run(() => adminApi.patch(`/subscriptions/${tech._id}/cancel`, {}), 'Could not cancel the plan.')}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Move to Free now
            </button>
          </div>
        )}
      </PermissionGate>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
const UserDetail = () => {
  const { id } = useParams();
  const { hasPermission } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [editingExpert, setEditingExpert] = useState(false);
  const [version, setVersion] = useState(0); // remounts the account form after a reload

  const load = useCallback(
    () =>
      adminUserServiceFull
        .get(id)
        .then((r) => {
          setData(r.data.data);
          setVersion((v) => v + 1);
        })
        .catch((err) => setLoadError(errorText(err, 'Could not load this user.'))),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loadError) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{loadError}</div>;
  if (!data) return <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto my-24" />;

  const { user, technicianProfile: tech, stats } = data;
  const canEdit = hasPermission('users.edit');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/users" className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Users
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-1">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500">
            {user.email} · {stats?.bookingsAsClient || 0} bookings as client
            {tech ? ` · ${stats?.bookingsAsTechnician || 0} as expert` : ''}
          </p>
        </div>
        {tech && (
          <Link to={`/admin/technicians/${tech._id}`} className="text-sm text-green-700 inline-flex items-center gap-1 hover:underline">
            Open expert page <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {canEdit ? (
        <AccountForm key={version} user={user} hasExpertProfile={!!tech} onSaved={load} />
      ) : (
        <p className="text-sm text-gray-500">You can view this user but not edit them.</p>
      )}

      {canEdit && !tech && <MakeExpertForm user={user} onCreated={load} />}

      {tech && (
        editingExpert ? (
          <EditExpertProfile
            tech={{ ...tech, userId: user }}
            onCancel={() => setEditingExpert(false)}
            onSaved={async () => {
              setEditingExpert(false);
              await load();
            }}
          />
        ) : (
          <Card
            title="Expert profile"
            icon={Wrench}
            action={
              <PermissionGate permission="technicians.edit">
                <button onClick={() => setEditingExpert(true)} className="text-sm text-green-700 font-medium inline-flex items-center gap-1 hover:underline">
                  <Pencil className="w-3.5 h-3.5" /> Edit expert profile
                </button>
              </PermissionGate>
            }
          >
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>{tech.businessName || 'No business name'}</strong>{tech.profileHeadline ? ` — ${tech.profileHeadline}` : ''}</p>
              <p>
                {(tech.mainCategories?.length ? tech.mainCategories : [tech.mainCategory]).filter(Boolean).join(', ')} ·{' '}
                {(tech.serviceCategories || []).length} service categor{(tech.serviceCategories || []).length === 1 ? 'y' : 'ies'}
              </p>
              <p>
                {tech.verificationStatus === 'verified' ? 'Verified' : `Verification: ${tech.verificationStatus}`}
                {tech.awaitingApproval && ' · waiting for approval (hidden from clients)'}
                {tech.isActive === false && ' · hidden (user is a client now)'}
              </p>
            </div>
          </Card>
        )
      )}

      {tech && <SubscriptionCard key={`sub-${version}`} tech={tech} onSaved={load} />}
    </div>
  );
};

export default UserDetail;
