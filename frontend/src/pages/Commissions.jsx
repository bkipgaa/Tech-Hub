/**
 * Commissions.jsx
 * ===============
 * Jobs an expert got while on the Free plan owe a KES 500 commission once the
 * work is done. Until it is paid, the job's rating and the completed job stay
 * off their profile. Pay one or several jobs at once by M-Pesa or card.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Phone, Star, Wallet } from 'lucide-react';
import api from '../services/api';
import { COMMISSION_PER_JOB, FREE_RADIUS_KM, formatKes } from '../utils/plans';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const Stars = ({ value }) =>
  value ? (
    <span className="inline-flex items-center gap-0.5 text-yellow-500">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= value ? 'fill-current' : 'text-gray-300'}`} />
      ))}
    </span>
  ) : (
    <span className="text-xs text-gray-400">Not rated yet</span>
  );

const Commissions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState([]);
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const pollRef = useRef(null);

  const load = useCallback(
    () =>
      api
        .get('/commissions')
        .then((r) => {
          setData(r.data.data);
          setSelected(r.data.data.due.filter((b) => !b.paymentPending).map((b) => b._id));
        })
        .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your commissions.')),
    []
  );

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Back from Paystack: ?reference=… — confirm the card payment
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) return;
    setSearchParams({}, { replace: true });
    api
      .get('/commissions/verify', { params: { reference } })
      .then((r) => setMessage({ type: r.data.success ? 'success' : 'error', text: r.data.message }))
      .catch((err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Could not confirm the payment.' }))
      .finally(load);
  }, [searchParams, setSearchParams, load]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const pollMpesa = (checkoutRequestID) => {
    let attempts = 0;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const r = await api.get('/commissions/mpesa-status', { params: { checkoutRequestID } });
        const { status, message: text } = r.data.data;
        if (status === 'success' || status === 'failed' || attempts >= 30) {
          clearInterval(pollRef.current);
          setBusy(false);
          if (status === 'success') setMessage({ type: 'success', text: 'Commission paid. The ratings and jobs now show on your profile.' });
          else if (status === 'failed') setMessage({ type: 'error', text: text || 'The M-Pesa payment was not completed.' });
          else setMessage({ type: 'error', text: 'We could not confirm the payment yet. Refresh this page in a minute.' });
          load();
        }
      } catch {
        if (attempts >= 30) {
          clearInterval(pollRef.current);
          setBusy(false);
        }
      }
    }, 5000);
  };

  const pay = async () => {
    if (!selected.length) return setMessage({ type: 'error', text: 'Choose at least one job to pay for.' });
    if (method === 'mpesa' && !phone.trim()) return setMessage({ type: 'error', text: 'Enter your M-Pesa number.' });
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const r = await api.post('/commissions/pay', { bookingIds: selected, method, phoneNumber: phone });
      const d = r.data.data;
      if (d.authorization_url) {
        window.location.href = d.authorization_url;
        return;
      }
      setMessage({ type: 'info', text: r.data.message || 'Check your phone and enter your M-Pesa PIN.' });
      pollMpesa(d.checkoutRequestID);
    } catch (err) {
      setBusy(false);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not start the payment.' });
    }
  };

  if (loadError) {
    return <div className="max-w-3xl mx-auto p-6"><div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{loadError}</div></div>;
  }
  if (!data) return <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto my-24" />;

  const selectedTotal = data.due.filter((b) => selected.includes(b._id)).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-green-600" /> Commissions
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          On the Free plan you pay {formatKes(COMMISSION_PER_JOB)} for each job you get through a booking, once the work is done.
          The client's rating and the completed job appear on your profile as soon as it's paid.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700">
        {data.onFreePlan ? (
          <>
            You're on the <strong>Free plan</strong> (visible within {FREE_RADIUS_KM} km). New jobs will owe a commission.{' '}
            <Link to="/subscription" className="text-green-700 font-semibold underline">
              Paid plans from KES 1,000 a month have no commission
            </Link>{' '}
            and show ratings immediately.
          </>
        ) : (
          <>
            You're on a paid plan, so <strong>new jobs have no commission</strong>. Jobs you got while on the Free plan still owe
            theirs below.
          </>
        )}
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <AlertCircle className="w-4 h-4 inline mr-1" />}
          {message.text}
        </div>
      )}

      {/* Owed now */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">To pay</h2>
          <span className="text-sm font-semibold text-gray-700">Total owed: {formatKes(data.totalDue)}</span>
        </div>
        {data.due.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nothing to pay right now.</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {data.due.map((b) => (
                <li key={b._id} className="p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(b._id)}
                    disabled={b.paymentPending}
                    onChange={() => toggle(b._id)}
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/bookings/${b._id}`} className="font-medium text-gray-800 hover:text-green-700">
                      {b.service}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {b.clientName} · work done {formatDate(b.workCompletedAt)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={b.clientRating} />
                      {b.clientRating && <span className="text-xs text-amber-700">Shows on your profile once paid</span>}
                    </div>
                    {b.paymentPending && <p className="text-xs text-blue-700 mt-1">Payment started — waiting for confirmation</p>}
                  </div>
                  <span className="font-semibold text-gray-800 whitespace-nowrap">{formatKes(b.amount)}</span>
                </li>
              ))}
            </ul>

            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={method === 'mpesa'} onChange={() => setMethod('mpesa')} /> M-Pesa
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={method === 'card'} onChange={() => setMethod('card')} /> Card
                </label>
              </div>
              {method === 'mpesa' && (
                <div className="flex items-center border rounded-lg px-3 py-2 max-w-xs">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full outline-none text-sm"
                  />
                </div>
              )}
              <button
                onClick={pay}
                disabled={busy || !selected.length}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Pay {formatKes(selectedTotal)} for {selected.length} job{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Owed once the work is done */}
      {data.upcoming.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="p-4 border-b border-gray-100 font-semibold text-gray-800">Owed when the work is done</h2>
          <ul className="divide-y divide-gray-100">
            {data.upcoming.map((b) => (
              <li key={b._id} className="p-4 flex justify-between gap-3 text-sm">
                <Link to={`/bookings/${b._id}`} className="text-gray-800 hover:text-green-700">
                  {b.service} <span className="text-gray-500">· {b.clientName}</span>
                </Link>
                <span className="text-gray-600">{formatKes(b.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.paid.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="p-4 border-b border-gray-100 font-semibold text-gray-800">Paid</h2>
          <ul className="divide-y divide-gray-100">
            {data.paid.map((b) => (
              <li key={b._id} className="p-4 flex justify-between gap-3 text-sm">
                <span className="text-gray-800">
                  {b.service} <span className="text-gray-500">· {b.clientName} · paid {formatDate(b.paidAt)}</span>
                </span>
                <span className="text-green-700 font-medium">{formatKes(b.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Commissions;
