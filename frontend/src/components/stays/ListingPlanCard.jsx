/**
 * ListingPlanCard.jsx
 * ===================
 * The lister's plan on My Listings: free months left, paid-until date, or
 * "hidden from search" once it lapses, with payment by M-Pesa (STK push,
 * polled until Safaricom answers) or card (Paystack redirect back here).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gift, CheckCircle, AlertTriangle, Loader2, Smartphone, CreditCard, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const POLL_MS = 4000;
const POLL_MAX = 30; // about 2 minutes

const ListingPlanCard = ({ onPlanChange }) => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { tone: 'ok' | 'error' | 'info', text }
  const polls = useRef(0);
  const verified = useRef(false);

  const load = () =>
    api.get('/listings/plan').then((r) => {
      setPlan(r.data?.data || null);
      onPlanChange?.(r.data?.data || null);
    }).catch(() => {});

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back from Paystack: ?reference=... (or ?trxref=...)
  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference || verified.current) return;
    verified.current = true;
    api
      .get('/listings/plan/verify', { params: { reference } })
      .then((r) => setMessage(r.data?.success
        ? { tone: 'ok', text: 'Payment received. Your listings are showing in search.' }
        : { tone: 'error', text: r.data?.message || 'Payment was not successful.' }))
      .catch((err) => setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not confirm the payment.' }))
      .finally(() => {
        load();
        const next = new URLSearchParams(params);
        next.delete('reference');
        next.delete('trxref');
        setParams(next, { replace: true });
      });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const pollMpesa = (checkoutRequestID) => {
    polls.current += 1;
    api
      .get('/listings/plan/mpesa-status', { params: { checkoutRequestID } })
      .then((r) => {
        const { status, message: why } = r.data?.data || {};
        if (status === 'success') {
          setBusy(false);
          setPayOpen(false);
          setMessage({ tone: 'ok', text: 'M-Pesa payment received. Your listings are showing in search.' });
          load();
        } else if (status === 'failed') {
          setBusy(false);
          setMessage({ tone: 'error', text: why || 'The M-Pesa payment was not completed.' });
        } else if (polls.current < POLL_MAX) {
          setTimeout(() => pollMpesa(checkoutRequestID), POLL_MS);
        } else {
          setBusy(false);
          setMessage({ tone: 'info', text: 'Still waiting for M-Pesa. If you paid, refresh this page in a minute.' });
        }
      })
      .catch(() => {
        if (polls.current < POLL_MAX) setTimeout(() => pollMpesa(checkoutRequestID), POLL_MS);
        else setBusy(false);
      });
  };

  const pay = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api.post('/listings/plan/pay', { method, phoneNumber: phone });
      const data = r.data?.data;
      if (method === 'card' && data?.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      setMessage({ tone: 'info', text: 'Check your phone and enter your M-Pesa PIN to pay.' });
      polls.current = 0;
      setTimeout(() => pollMpesa(data.checkoutRequestID), POLL_MS);
    } catch (err) {
      setBusy(false);
      setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not start the payment.' });
    }
  };

  if (!plan) return null;

  const price = `KES ${plan.monthlyPrice.toLocaleString()}`;
  const look = {
    not_started: { icon: Gift, box: 'bg-green-50 border-green-200', iconCls: 'text-green-600',
      title: `Your first ${plan.freeMonths} months are free`,
      text: `They start when you add your first listing. After that it's ${price} a month for all your listings.` },
    free: { icon: Gift, box: 'bg-green-50 border-green-200', iconCls: 'text-green-600',
      title: `Free until ${fmtDate(plan.activeUntil)}`,
      text: `${plan.daysLeft} day${plan.daysLeft === 1 ? '' : 's'} of your free ${plan.freeMonths} months left. After that it's ${price} a month to keep your listings in search.` },
    paid: { icon: CheckCircle, box: 'bg-green-50 border-green-200', iconCls: 'text-green-600',
      title: `Plan active until ${fmtDate(plan.activeUntil)}`,
      text: `${price} a month covers all your listings. Paying early adds a month on top.` },
    lapsed: { icon: AlertTriangle, box: 'bg-red-50 border-red-200', iconCls: 'text-red-600',
      title: 'Your listings are hidden from search',
      text: `Your plan ended on ${fmtDate(plan.activeUntil)}. Pay ${price} to show all your listings again for a month.` },
  }[plan.phase];
  const Icon = look.icon;
  const canPay = plan.phase === 'paid' || plan.phase === 'lapsed' || (plan.phase === 'free' && plan.daysLeft <= 14);

  return (
    <div className={`mt-6 border rounded-xl p-5 ${look.box}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Icon className={`w-8 h-8 flex-shrink-0 ${look.iconCls}`} />
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{look.title}</p>
          <p className="text-sm text-gray-600">{look.text}</p>
        </div>
        {canPay && !payOpen && (
          <button
            onClick={() => setPayOpen(true)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-white ${plan.phase === 'lapsed' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {plan.phase === 'lapsed' ? `Pay ${price}` : `Add a month · ${price}`}
          </button>
        )}
      </div>

      {payOpen && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-800">Pay {price} for one month</p>
            <button onClick={() => setPayOpen(false)} disabled={busy} aria-label="Close" className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
              { id: 'card', label: 'Card', icon: CreditCard },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                disabled={busy}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium ${
                  method === m.id ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700 hover:bg-green-50'
                }`}
              >
                <m.icon className="w-4 h-4" /> {m.label}
              </button>
            ))}
          </div>
          {method === 'mpesa' && (
            <label className="block text-sm text-gray-700 mb-3">
              M-Pesa number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                disabled={busy}
                className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </label>
          )}
          <button
            onClick={pay}
            disabled={busy || (method === 'mpesa' && !phone.trim())}
            className="w-full px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy && method === 'mpesa' ? 'Waiting for M-Pesa…' : method === 'mpesa' ? 'Send M-Pesa request' : 'Pay by card'}
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.tone === 'ok' ? 'text-green-700' : message.tone === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default ListingPlanCard;
