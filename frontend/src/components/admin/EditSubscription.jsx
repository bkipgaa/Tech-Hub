/**
 * EditSubscription.jsx
 * ====================
 * Admin controls for an expert's plan: put them on any plan for a number of
 * days (no payment taken), extend a running paid plan, or move them to Free.
 * Used on the user page, the expert page and the Subscriptions list.
 *
 * Props: techId, subscription ({ plan, endDate, isFreeMonth, planDetails }), onSaved
 */

import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from './PermissionGate';
import { PLAN_TIERS, COMMISSION_PER_JOB, formatKes } from '../../utils/plans';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const EditSubscription = ({ techId, subscription, onSaved }) => {
  const sub = subscription || {};
  const currentId = !sub.plan || sub.plan === 'trial' ? 'free' : sub.plan;
  const endDate = sub.endDate ? new Date(sub.endDate) : null;
  const active = currentId === 'free' || (endDate && endDate > new Date());
  const [planId, setPlanId] = useState(currentId === 'free' || !active ? 'basic' : currentId);
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const tier = PLAN_TIERS.find((p) => p.id === planId);
  const currentName = PLAN_TIERS.find((p) => p.id === currentId)?.name || sub.planDetails?.name || currentId;

  const run = async (request, fallback) => {
    setSaving(true);
    setNotice(null);
    try {
      const r = await request();
      setNotice({ type: 'success', text: r.data.message || 'Saved.' });
      onSaved?.();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || fallback });
    } finally {
      setSaving(false);
    }
  };

  const setPlan = (e) => {
    e.preventDefault();
    run(() => adminApi.patch(`/subscriptions/${techId}/plan`, { planId, days: Number(days) }), 'Could not set the plan.');
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`text-sm p-3 rounded-lg border ${
            notice.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="text-sm text-gray-700 space-y-1">
        <p>
          Current plan: <strong>{active ? currentName : 'Free'}</strong>
          {active && sub.isFreeMonth && ' (free month)'}
          {!active && <span className="ml-2 text-red-600">({currentName} ended)</span>}
        </p>
        {endDate && active && currentId !== 'free' && (
          <p>Ends {endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        {(currentId === 'free' || !active) && (
          <p className="text-amber-700">Owes {formatKes(COMMISSION_PER_JOB)} commission on each new job.</p>
        )}
      </div>

      <PermissionGate permission="subscriptions.manage" fallback={<p className="text-xs text-gray-400">You don't have permission to change plans.</p>}>
        <form onSubmit={setPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="block text-sm font-medium text-gray-700">
            Plan
            <select className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PLAN_TIERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.radius.toLocaleString()} km — {p.price ? `${formatKes(p.price)}/month` : 'free, commission per job'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Days
            <input
              type="number"
              min="1"
              max="365"
              className={inputClass}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              disabled={!tier?.price}
            />
            <span className="block text-xs font-normal text-gray-400 mt-1">
              {tier?.price ? 'Runs from today; no payment is taken.' : 'Free never ends.'}
            </span>
          </label>
          <div className="md:pb-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Set plan
            </button>
          </div>
        </form>

        {currentId !== 'free' && active && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => run(() => adminApi.patch(`/subscriptions/${techId}/extend`, { days: Number(days) || 30 }), 'Could not extend the plan.')}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Extend by {Number(days) || 30} days
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => run(() => adminApi.patch(`/subscriptions/${techId}/cancel`, {}), 'Could not cancel the plan.')}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Move to Free now
            </button>
          </div>
        )}
      </PermissionGate>
    </div>
  );
};

export default EditSubscription;
