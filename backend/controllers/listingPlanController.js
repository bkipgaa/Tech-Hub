/**
 * listingPlanController.js
 * ========================
 * Stays & Spaces listing plan: free for the first 6 months after a user's
 * first listing, then KES 1,500 a month (card via Paystack or M-Pesa STK push).
 *
 *   GET  /api/listings/plan                 → plan status + payment history
 *   POST /api/listings/plan/pay             → { method: 'card'|'mpesa', phoneNumber? }
 *   GET  /api/listings/plan/verify          → ?reference=  (after the Paystack redirect)
 *   GET  /api/listings/plan/mpesa-status    → ?checkoutRequestID=  (frontend polls)
 *   POST /api/listings/plan/mpesa-callback  → Safaricom (public; re-confirmed with Safaricom)
 *
 * Card payments are also confirmed by the Paystack webhook (subscriptionController).
 */

const User = require('../models/User');
const Listing = require('../models/Listing');
const Paystack = require('../config/paystack');
const mpesaService = require('../services/mpesaService');
const listingPlan = require('../utils/listingPlan');

const PRICE = listingPlan.MONTHLY_PRICE;

const fail = (res, status, message, error) => {
  if (error) console.error('[listingPlanController]', message, error);
  return res.status(status).json({ success: false, message });
};

const cleanPhone = (phone = '') => {
  let p = String(phone).replace(/[\s-]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = `254${p.slice(1)}`;
  return /^254[17]\d{8}$/.test(p) ? p : null;
};

/**
 * Apply a successful Paystack transaction to its user (used by verify and the
 * webhook). Checks the amount, currency and that it was for a listing plan.
 * Returns the user, or null if the transaction doesn't qualify.
 */
const applyPaystackTransaction = async (tx) => {
  const meta = tx?.metadata || {};
  if (tx?.status !== 'success' || meta.type !== 'listing_plan' || !meta.userId) return null;
  if (tx.currency !== 'KES' || Number(tx.amount) < PRICE * 100) return null;
  const user = await User.findById(meta.userId);
  if (!user) return null;
  await listingPlan.applyPayment(user, { amount: Number(tx.amount) / 100, months: 1, method: 'card', reference: tx.reference });
  return user;
};
exports.applyPaystackTransaction = applyPaystackTransaction;

/** GET /api/listings/plan */
exports.getPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('listingPlan');
    if (!user) return fail(res, 401, 'Please sign in again.');
    const listings = await Listing.countDocuments({ owner: user._id });
    res.json({
      success: true,
      data: {
        ...listingPlan.planSummary(user),
        listings,
        payments: (user.listingPlan?.payments || []).slice(-12).reverse(),
      },
    });
  } catch (error) {
    fail(res, 500, 'Failed to load your plan.', error);
  }
};

/** POST /api/listings/plan/pay */
exports.pay = async (req, res) => {
  try {
    const { method, phoneNumber } = req.body;
    if (!['card', 'mpesa'].includes(method)) return fail(res, 400, 'Choose card or M-Pesa.');
    const user = await User.findById(req.user.userId);
    if (!user) return fail(res, 401, 'Please sign in again.');

    if (method === 'card') {
      const response = await Paystack.transaction.initialize({
        amount: PRICE * 100,
        email: user.email,
        currency: 'KES',
        channels: ['card'],
        metadata: { type: 'listing_plan', userId: String(user._id), months: 1 },
        callback_url: `${process.env.FRONTEND_URL}/my-listings`,
      });
      user.listingPlan = user.listingPlan || {};
      user.listingPlan.pending = { method: 'card', reference: response.data.reference, amount: PRICE, initiatedAt: new Date() };
      await user.save({ validateModifiedOnly: true });
      return res.json({
        success: true,
        data: { method: 'card', authorization_url: response.data.authorization_url, reference: response.data.reference },
      });
    }

    const phone = cleanPhone(phoneNumber);
    if (!phone) return fail(res, 400, 'Enter an M-Pesa number like 0712 345 678.');
    const stk = await mpesaService.stkPush(
      phone,
      PRICE,
      `LST-${Date.now()}`.slice(0, 12), // account reference, max 12 chars
      'Listing plan',                  // max 13 chars
      '/api/listings/plan/mpesa-callback'
    );
    user.listingPlan = user.listingPlan || {};
    user.listingPlan.pending = { method: 'mpesa', checkoutRequestID: stk.CheckoutRequestID, amount: PRICE, initiatedAt: new Date() };
    await user.save({ validateModifiedOnly: true });
    res.json({
      success: true,
      message: 'Check your phone and enter your M-Pesa PIN.',
      data: { method: 'mpesa', checkoutRequestID: stk.CheckoutRequestID },
    });
  } catch (error) {
    fail(res, 500, 'Could not start the payment. Please try again.', error);
  }
};

/** GET /api/listings/plan/verify?reference= */
exports.verify = async (req, res) => {
  try {
    const { reference } = req.query;
    if (typeof reference !== 'string' || !reference) return fail(res, 400, 'Payment reference missing.');
    const response = await Paystack.transaction.verify(reference);
    const tx = response.data;
    if (String(tx?.metadata?.userId) !== req.user.userId) return fail(res, 403, 'This payment belongs to another account.');
    const user = await applyPaystackTransaction(tx);
    if (!user) return res.json({ success: false, message: 'Payment was not successful.' });
    res.json({ success: true, data: listingPlan.planSummary(user), message: 'Payment received. Your listings are live.' });
  } catch (error) {
    fail(res, 500, 'Could not confirm the payment.', error);
  }
};

/** Confirm an STK push with Safaricom and apply it. Returns 'success' | 'failed' | 'pending'. */
const settleMpesa = async (user, checkoutRequestID) => {
  const plan = user.listingPlan || {};
  if ((plan.payments || []).some((p) => p.checkoutRequestID === checkoutRequestID)) return { status: 'success' };
  if (plan.pending?.checkoutRequestID !== checkoutRequestID) return { status: 'pending' };

  const confirmation = await mpesaService.confirmPayment(checkoutRequestID, { attempts: 1 });
  if (!confirmation.confirmed) return { status: 'pending' }; // Safaricom still processing
  if (confirmation.resultCode !== '0') {
    user.listingPlan.pending = undefined;
    await user.save({ validateModifiedOnly: true });
    return { status: 'failed', message: confirmation.resultDesc || 'Payment was not completed.' };
  }
  await listingPlan.applyPayment(user, { amount: plan.pending.amount || PRICE, months: 1, method: 'mpesa', checkoutRequestID });
  return { status: 'success' };
};

/** GET /api/listings/plan/mpesa-status?checkoutRequestID= */
exports.mpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (typeof checkoutRequestID !== 'string' || !checkoutRequestID) return fail(res, 400, 'checkoutRequestID required.');
    const user = await User.findById(req.user.userId);
    if (!user) return fail(res, 401, 'Please sign in again.');
    const result = await settleMpesa(user, checkoutRequestID);
    res.json({ success: true, data: { ...result, plan: listingPlan.planSummary(user) } });
  } catch (error) {
    fail(res, 500, 'Could not check the payment.', error);
  }
};

/** POST /api/listings/plan/mpesa-callback (Safaricom) */
exports.mpesaCallback = async (req, res) => {
  try {
    const id = req.body?.Body?.stkCallback?.CheckoutRequestID;
    if (typeof id !== 'string' || !id) return res.status(400).send('Invalid payload');
    const user = await User.findOne({ 'listingPlan.pending.checkoutRequestID': id });
    if (user) await settleMpesa(user, id); // never trusts the callback's own ResultCode
    res.sendStatus(200);
  } catch (error) {
    console.error('[listingPlanController] mpesa callback', error);
    res.sendStatus(200); // Safaricom expects 200
  }
};
