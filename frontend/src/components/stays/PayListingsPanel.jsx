/**
 * PayListingsPanel.jsx
 * ====================
 * Pay for selected listings for the next month: KES 200 per listing, by M-Pesa (STK
 * push, polled until Safaricom answers) or card (Paystack redirect back to
 * My Listings, which verifies the ?reference=).
 */

import React, { useRef, useState } from 'react';
import { Loader2, Smartphone, CreditCard, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LISTING_PRICE } from '../../utils/listingCategories';

const POLL_MS = 4000;
const POLL_MAX = 30; // about 2 minutes

const PayListingsPanel = ({ listings, onClose, onPaid }) => {
  const { user } = useAuth();
  const months = 1; // each payment covers the next month
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { tone: 'ok' | 'error' | 'info', text }
  const polls = useRef(0);

  const total = LISTING_PRICE * listings.length * months;
  const kes = (n) => `KES ${n.toLocaleString('en-KE')}`;

  const poll = (checkoutRequestID) => {
    polls.current += 1;
    api
      .get('/listings/plan/mpesa-status', { params: { checkoutRequestID } })
      .then((r) => {
        const { status, message: why } = r.data?.data || {};
        if (status === 'success') {
          setBusy(false);
          onPaid?.('M-Pesa payment received. Your listings are showing in search.');
        } else if (status === 'failed') {
          setBusy(false);
          setMessage({ tone: 'error', text: why || 'The M-Pesa payment was not completed.' });
        } else if (polls.current < POLL_MAX) {
          setTimeout(() => poll(checkoutRequestID), POLL_MS);
        } else {
          setBusy(false);
          setMessage({ tone: 'info', text: 'Still waiting for M-Pesa. If you paid, refresh this page in a minute.' });
        }
      })
      .catch(() => {
        if (polls.current < POLL_MAX) setTimeout(() => poll(checkoutRequestID), POLL_MS);
        else setBusy(false);
      });
  };

  const pay = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api.post('/listings/plan/pay', {
        listingIds: listings.map((l) => l._id),
        months,
        method,
        phoneNumber: phone,
      });
      const data = r.data?.data;
      if (method === 'card' && data?.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      setMessage({ tone: 'info', text: `Check your phone and enter your M-Pesa PIN to pay ${kes(total)}.` });
      polls.current = 0;
      setTimeout(() => poll(data.checkoutRequestID), POLL_MS);
    } catch (err) {
      setBusy(false);
      setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not start the payment.' });
    }
  };

  return (
    <div className="bg-white border-2 border-green-600 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-800">
            Pay for {listings.length} listing{listings.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-gray-500 truncate">{listings.map((l) => l.title).join(', ')}</p>
        </div>
        <button onClick={onClose} disabled={busy} aria-label="Close" className="text-gray-400 hover:text-gray-600">
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

      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <span>
          {kes(LISTING_PRICE)} × {listings.length} listing{listings.length === 1 ? '' : 's'}, for the next month
        </span>
        <span className="text-lg font-bold text-gray-800">{kes(total)}</span>
      </div>
      <button
        onClick={pay}
        disabled={busy || (method === 'mpesa' && !phone.trim())}
        className="w-full px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy && method === 'mpesa' ? 'Waiting for M-Pesa…' : method === 'mpesa' ? `Pay ${kes(total)} with M-Pesa` : `Pay ${kes(total)} by card`}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${message.tone === 'ok' ? 'text-green-700' : message.tone === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default PayListingsPanel;
