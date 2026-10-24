/**
 * commissionController.js
 * =======================
 * Commission on jobs an expert gets while on the Free plan: KES 500 per job,
 * owed once the work is done. Paid by card (Paystack) or M-Pesa STK push, one
 * job or several at once. When paid, the job's rating and completed job show
 * on the expert's profile.
 *
 *   GET  /api/commissions                 → jobs with commission owed + paid history
 *   POST /api/commissions/pay             → { bookingIds, method: 'card'|'mpesa', phoneNumber? }
 *   GET  /api/commissions/verify          → ?reference=  (after the Paystack redirect)
 *   GET  /api/commissions/mpesa-status    → ?checkoutRequestID=  (frontend polls)
 *   POST /api/commissions/mpesa-callback  → Safaricom (public; re-confirmed with Safaricom)
 *
 * Card payments are also confirmed by the Paystack webhook (subscriptionController).
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');
const Paystack = require('../config/paystack');
const mpesaService = require('../services/mpesaService');
const { countRatingIfReady } = require('../utils/ratingChecks');
const { COMMISSION_PER_JOB, getEffectivePlan } = require('../utils/subscriptionPlans');

// Commission can be paid once the expert has marked the work completed
const PAYABLE_STATUSES = ['work_completed', 'completed'];
const OWED = { 'commission.amount': { $gt: 0 }, 'commission.status': { $nin: ['paid', 'waived'] } };

const fail = (res, status, message, error) => {
  if (error) console.error('[commissionController]', message, error);
  return res.status(status).json({ success: false, message });
};

const cleanPhone = (phone = '') => {
  let p = String(phone).replace(/[\s-]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = `254${p.slice(1)}`;
  return /^254[17]\d{8}$/.test(p) ? p : null;
};

const myTechnician = (userId) => Technician.findOne({ userId }).select('_id subscription');

/**
 * Mark the bookings waiting on this payment as paid, if the amount covers
 * them, then count their ratings. Safe to call more than once.
 * Returns { status: 'success' | 'failed', message? }.
 */
const settlePayment = async ({ technicianId, ref, method, amountPaid }) => {
  const waiting = await Booking.find({ technicianId, 'commission.pendingRef': ref, ...OWED }).select('_id commission.amount');
  if (!waiting.length) {
    const done = await Booking.exists({ technicianId, 'commission.reference': ref, 'commission.status': 'paid' });
    return done ? { status: 'success' } : { status: 'failed', message: 'No commission is waiting on this payment.' };
  }
  const expected = waiting.reduce((sum, b) => sum + (b.commission.amount || 0), 0);
  if (!Number.isFinite(amountPaid) || amountPaid + 1 < expected) {
    console.error(`[commissionController] amount mismatch for ${ref}: paid ${amountPaid}, expected ${expected}`);
    return { status: 'failed', message: 'The amount paid does not cover the commission. Please contact support.' };
  }

  const ids = waiting.map((b) => b._id);
  await Booking.updateMany(
    { _id: { $in: ids }, ...OWED },
    {
      $set: { 'commission.status': 'paid', 'commission.paidAt': new Date(), 'commission.method': method, 'commission.reference': ref },
      $unset: { 'commission.pendingRef': '', 'commission.pendingAt': '' },
    }
  );
  for (const id of ids) await countRatingIfReady(id);
  return { status: 'success' };
};

/**
 * Apply a successful Paystack transaction (used by verify and the webhook).
 * Returns the settle result, or null if the transaction isn't a commission payment.
 */
const applyPaystackTransaction = async (tx) => {
  const meta = tx?.metadata || {};
  if (tx?.status !== 'success' || meta.type !== 'commission' || !mongoose.isValidObjectId(meta.technicianId)) return null;
  if (tx.currency !== 'KES') return null;
  return settlePayment({
    technicianId: meta.technicianId,
    ref: tx.reference,
    method: 'card',
    amountPaid: Number(tx.amount) / 100,
  });
};
exports.applyPaystackTransaction = applyPaystackTransaction;

/** GET /api/commissions */
exports.list = async (req, res) => {
  try {
    const technician = await myTechnician(req.user.userId);
    if (!technician) return fail(res, 404, 'Expert profile not found.');

    const bookings = await Booking.find({ technicianId: technician._id, 'commission.amount': { $gt: 0 }, status: { $in: [...PAYABLE_STATUSES, 'in_progress', 'pending', 'quoted'] } })
      .populate('clientId', 'firstName lastName')
      .select('serviceCategory subService status preferredDate workCompletedAt completedAt clientRating clientReview commission ratingCountedAt clientId')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const row = (b) => ({
      _id: b._id,
      service: b.subService || b.serviceCategory,
      clientName: `${b.clientId?.firstName || ''} ${b.clientId?.lastName || ''}`.trim() || 'Client',
      status: b.status,
      workCompletedAt: b.workCompletedAt,
      clientRating: b.clientRating || null,
      clientReview: b.clientReview || '',
      amount: b.commission.amount,
      commissionStatus: b.commission.status,
      paidAt: b.commission.paidAt,
      paymentPending: !!b.commission.pendingRef,
    });
    const isOwed = (b) => !['paid', 'waived'].includes(b.commission.status);

    const due = bookings.filter((b) => isOwed(b) && PAYABLE_STATUSES.includes(b.status)).map(row);
    const upcoming = bookings.filter((b) => isOwed(b) && !PAYABLE_STATUSES.includes(b.status)).map(row);
    const paid = bookings.filter((b) => b.commission.status === 'paid').slice(0, 50).map(row);
    const effective = getEffectivePlan(technician.subscription);

    res.json({
      success: true,
      data: {
        commissionPerJob: COMMISSION_PER_JOB,
        currentPlan: effective.plan,
        onFreePlan: !effective.paid,
        due,
        upcoming,
        paid,
        totalDue: due.reduce((sum, b) => sum + b.amount, 0),
      },
    });
  } catch (error) {
    fail(res, 500, 'Failed to load your commissions.', error);
  }
};

/** POST /api/commissions/pay */
exports.pay = async (req, res) => {
  try {
    const { method, phoneNumber } = req.body;
    if (!['card', 'mpesa'].includes(method)) return fail(res, 400, 'Choose card or M-Pesa.');

    const ids = [...new Set((Array.isArray(req.body.bookingIds) ? req.body.bookingIds : []).map(String))]
      .filter((id) => mongoose.isValidObjectId(id));
    if (!ids.length) return fail(res, 400, 'Choose at least one job to pay for.');
    if (ids.length > 50) return fail(res, 400, 'You can pay for up to 50 jobs at a time.');

    const technician = await myTechnician(req.user.userId);
    if (!technician) return fail(res, 404, 'Expert profile not found.');
    const user = await User.findById(req.user.userId).select('email');
    if (!user) return fail(res, 401, 'Please sign in again.');

    // Only this expert's finished jobs that still owe commission
    const bookings = await Booking.find({ _id: { $in: ids }, technicianId: technician._id, status: { $in: PAYABLE_STATUSES }, ...OWED })
      .select('_id commission.amount');
    if (bookings.length !== ids.length) {
      return fail(res, 400, 'Some of these jobs have no commission to pay. Refresh the page and try again.');
    }
    const amount = bookings.reduce((sum, b) => sum + b.commission.amount, 0);
    const bookingIds = bookings.map((b) => b._id);

    let ref;
    let data;
    if (method === 'card') {
      const response = await Paystack.transaction.initialize({
        amount: amount * 100,
        email: user.email,
        currency: 'KES',
        channels: ['card'],
        metadata: { type: 'commission', technicianId: String(technician._id), bookingIds: bookingIds.join(',') },
        callback_url: `${process.env.FRONTEND_URL}/commissions`,
      });
      ref = response.data.reference;
      data = { method, amount, authorization_url: response.data.authorization_url, reference: ref };
    } else {
      const phone = cleanPhone(phoneNumber);
      if (!phone) return fail(res, 400, 'Enter an M-Pesa number like 0712 345 678.');
      const stk = await mpesaService.stkPush(
        phone,
        amount,
        `COM-${Date.now()}`.slice(0, 12), // account reference, max 12 chars
        'Commission',                    // max 13 chars
        '/api/commissions/mpesa-callback'
      );
      ref = stk.CheckoutRequestID;
      data = { method, amount, checkoutRequestID: ref };
    }

    await Booking.updateMany(
      { _id: { $in: bookingIds }, ...OWED },
      { $set: { 'commission.pendingRef': ref, 'commission.pendingAt': new Date() } }
    );

    res.json({
      success: true,
      message: method === 'mpesa' ? 'Check your phone and enter your M-Pesa PIN.' : 'Redirecting to card payment…',
      data,
    });
  } catch (error) {
    fail(res, 500, 'Could not start the payment. Please try again.', error);
  }
};

/** GET /api/commissions/verify?reference= */
exports.verify = async (req, res) => {
  try {
    const { reference } = req.query;
    if (typeof reference !== 'string' || !reference) return fail(res, 400, 'Payment reference missing.');
    const technician = await myTechnician(req.user.userId);
    if (!technician) return fail(res, 404, 'Expert profile not found.');
    const response = await Paystack.transaction.verify(reference);
    const tx = response.data;
    if (String(tx?.metadata?.technicianId) !== String(technician._id)) {
      return fail(res, 403, 'This payment belongs to another account.');
    }
    const result = await applyPaystackTransaction(tx);
    if (result?.status !== 'success') {
      return res.json({ success: false, message: result?.message || 'Payment was not successful.' });
    }
    res.json({ success: true, message: 'Commission paid. The ratings and jobs now show on your profile.' });
  } catch (error) {
    fail(res, 500, 'Could not confirm the payment.', error);
  }
};

/** Confirm an STK push with Safaricom and apply it. Returns { status: 'success' | 'failed' | 'pending' }. */
const settleMpesa = async (technicianId, checkoutRequestID) => {
  if (await Booking.exists({ technicianId, 'commission.reference': checkoutRequestID, 'commission.status': 'paid' })) {
    return { status: 'success' };
  }
  if (!(await Booking.exists({ technicianId, 'commission.pendingRef': checkoutRequestID }))) return { status: 'pending' };

  const confirmation = await mpesaService.confirmPayment(checkoutRequestID, { attempts: 1 });
  if (!confirmation.confirmed) return { status: 'pending' }; // Safaricom still processing
  if (confirmation.resultCode !== '0') {
    await Booking.updateMany(
      { technicianId, 'commission.pendingRef': checkoutRequestID },
      { $unset: { 'commission.pendingRef': '', 'commission.pendingAt': '' } }
    );
    return { status: 'failed', message: confirmation.resultDesc || 'Payment was not completed.' };
  }
  // Safaricom confirmed the STK push we started for exactly these jobs' total
  const waiting = await Booking.find({ technicianId, 'commission.pendingRef': checkoutRequestID, ...OWED }).select('commission.amount');
  const amountPaid = waiting.reduce((sum, b) => sum + (b.commission.amount || 0), 0);
  return settlePayment({ technicianId, ref: checkoutRequestID, method: 'mpesa', amountPaid });
};

/** GET /api/commissions/mpesa-status?checkoutRequestID= */
exports.mpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (typeof checkoutRequestID !== 'string' || !checkoutRequestID) return fail(res, 400, 'checkoutRequestID required.');
    const technician = await myTechnician(req.user.userId);
    if (!technician) return fail(res, 404, 'Expert profile not found.');
    res.json({ success: true, data: await settleMpesa(technician._id, checkoutRequestID) });
  } catch (error) {
    fail(res, 500, 'Could not check the payment.', error);
  }
};

/** POST /api/commissions/mpesa-callback (Safaricom) */
exports.mpesaCallback = async (req, res) => {
  try {
    const id = req.body?.Body?.stkCallback?.CheckoutRequestID;
    if (typeof id !== 'string' || !id) return res.status(400).send('Invalid payload');
    const booking = await Booking.findOne({ 'commission.pendingRef': id }).select('technicianId');
    if (booking) await settleMpesa(booking.technicianId, id); // never trusts the callback's own ResultCode
    res.sendStatus(200);
  } catch (error) {
    console.error('[commissionController] mpesa callback', error);
    res.sendStatus(200); // Safaricom expects 200
  }
};
