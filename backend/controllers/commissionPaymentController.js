// controllers/bookingCommissionPaymentController.js
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const Paystack = require('../config/paystack'); // your existing file: module.exports = Paystack;
const { convertToSmallestUnit } = require('../utils/helper');
const crypto = require('crypto');

const getTechnicianId = async (userId) => {
  const tech = await Technician.findOne({ userId }).select('_id email');
  if (!tech) throw new Error('Technician profile not found');
  return tech;
};

// ─── INITIALIZE COMMISSION PAYMENT ─────────────────────────────
exports.initializeCommissionPayment = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const technician = await getTechnicianId(userId);

    // 1. Grab all commissions awaiting payment
    const bookings = await Booking.find({
      technicianId: technician._id,
      'commission.status': { $in: ['pending', 'invoiced'] },
    });

    if (!bookings.length) {
      return res.status(400).json({
        success: false,
        message: 'No pending commissions to pay.',
      });
    }

    // 2. Total in KES, converted to smallest unit
    const totalKES = bookings.reduce((sum, b) => sum + (b.commission?.amount || 0), 0);
    const amountInSmallestUnit = convertToSmallestUnit(totalKES, 'KES');

    // 3. Unique reference for this batch
    const reference = `COM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // 4. Init with Paystack (same pattern as subscriptions)
    const response = await Paystack.transaction.initialize({
      amount: amountInSmallestUnit,
      email: technician.email || req.user.email,
      currency: 'KES',
      channels: ['card'],
      reference,
      metadata: {
        type: 'commission',                 // <-- key discriminator
        technicianId: technician._id.toString(),
        bookingIds: bookings.map((b) => b._id.toString()),
        totalKES,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment-callback?type=commission`,
    });

    if (!response.data || !response.data.reference) {
      throw new Error('Paystack did not return a reference');
    }

    // 5. Stamp the reference on all bookings in the batch
    await Booking.updateMany(
      { _id: { $in: bookings.map((b) => b._id) } },
      { $set: { 'commission.paymentReference': response.data.reference } }
    );

    res.json({
      success: true,
      data: {
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
        amount: totalKES,
      },
    });
  } catch (error) {
    console.error('initializeCommissionPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── VERIFY (frontend fallback) ─────────────────────────────────
exports.verifyCommissionPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference required' });
    }

    const response = await Paystack.transaction.verify(reference);
    if (response.data.status !== 'success') {
      return res.json({ success: false, message: 'Payment not successful' });
    }

    await markCommissionsPaid(response.data, 'verify');
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('verifyCommissionPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SHARED: mark batch as paid (idempotent) ───────────────────
async function markCommissionsPaid(transaction, source = 'webhook') {
  const ref = transaction.reference;

  const bookings = await Booking.find({ 'commission.paymentReference': ref });
  if (!bookings.length) {
    console.warn(`[${source}] No bookings found for reference ${ref}`);
    return { updated: 0 };
  }

  // Idempotency – skip bookings already marked paid
  const unpaid = bookings.filter((b) => b.commission?.status !== 'paid');
  if (!unpaid.length) {
    console.log(`[${source}] Reference ${ref} already processed.`);
    return { updated: 0, alreadyProcessed: true };
  }

  // Sanity: verify the amount matches
  const expectedKES = unpaid.reduce((sum, b) => sum + (b.commission?.amount || 0), 0);
  const expectedSmallest = convertToSmallestUnit(expectedKES, 'KES');
  if (transaction.amount !== expectedSmallest) {
    console.error(
      `[${source}] Amount mismatch for ${ref}. Paid ${transaction.amount}, expected ${expectedSmallest}`
    );
    // Do not mark paid – log for manual review
    return { updated: 0, amountMismatch: true };
  }

  await Booking.updateMany(
    { _id: { $in: unpaid.map((b) => b._id) } },
    { $set: { 'commission.status': 'paid', 'commission.paidAt': new Date() } }
  );

  console.log(`[${source}] ✅ Marked ${unpaid.length} commissions as paid for ${ref}`);
  return { updated: unpaid.length };
}

exports.markCommissionsPaid = markCommissionsPaid; // export for webhook reuse