/**
 * commissionPaymentController.js
 * ==============================
 * Handles commission payments via Paystack (card) and M-Pesa Daraja (STK Push).
 * 
 * Endpoints:
 *   POST   /api/payments/commissions/initialize       → card OR mpesa
 *   GET    /api/payments/commissions/verify           → Paystack verify (fallback)
 *   GET    /api/payments/commissions/mpesa-status     → poll M-Pesa status
 *   POST   /api/payments/mpesa-callback               → Safaricom callback (public)
 * 
 * @version 2.0.0 – Added M-Pesa Daraja support
 */

const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');
const Paystack = require('../config/paystack');
const mpesaService = require('../services/mpesaService');
const { convertToSmallestUnit } = require('../utils/helper');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const getTechnicianId = async (userId) => {
  const tech = await Technician.findOne({ userId })
    .select('_id userId')
    .populate('userId', 'email firstName lastName');
  if (!tech) throw new Error('Technician profile not found');
  return tech;
};

/**
 * Normalise Kenyan phone number to 2547XXXXXXXX format.
 */
const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  let cleaned = String(phoneNumber).replace(/\s/g, '').replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) cleaned = '254' + cleaned;

  if (!/^254[17]\d{8}$/.test(cleaned)) return null;
  return cleaned;
};

// ─────────────────────────────────────────────────────────────
// INITIALIZE COMMISSION PAYMENT (card OR mpesa)
// ─────────────────────────────────────────────────────────────
exports.initializeCommissionPayment = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { paymentMethod = 'card', phoneNumber } = req.body;

    // Validate payment method
    if (!['card', 'mpesa'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose "card" or "mpesa".',
      });
    }

    const technician = await getTechnicianId(userId);

    // 1. Grab all commissions awaiting payment (pending + invoiced)
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

    // 2. Total in KES
    const totalKES = bookings.reduce(
      (sum, b) => sum + (b.commission?.amount || 0),
      0
    );

    if (totalKES <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total commission amount is zero.',
      });
    }

    const bookingIds = bookings.map((b) => b._id);

    // ═══════════════════════════════════════════════════════════
    // ── CARD (Paystack) ─────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (paymentMethod === 'card') {
      const amountInSmallestUnit = convertToSmallestUnit(totalKES, 'KES');
      const reference = `COM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const response = await Paystack.transaction.initialize({
        amount: amountInSmallestUnit,
        email: technician.userId?.email || req.user.email,
        currency: 'KES',
        channels: ['card'],
        reference,
        metadata: {
          type: 'commission',
          technicianId: technician._id.toString(),
          bookingIds: bookingIds.map((id) => id.toString()),
          totalKES,
        },
        callback_url: `${process.env.FRONTEND_URL}/payment-callback?type=commission`,
      });

      if (!response.data || !response.data.reference) {
        throw new Error('Paystack did not return a reference');
      }

      // Stamp reference on all bookings
      await Booking.updateMany(
        { _id: { $in: bookingIds } },
        { $set: { 'commission.paymentReference': response.data.reference } }
      );

      return res.json({
        success: true,
        data: {
          paymentMethod: 'card',
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
          amount: totalKES,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // ── M-PESA (Daraja STK Push) ────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (paymentMethod === 'mpesa') {
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for M-Pesa payment.',
        });
      }

      const cleaned = cleanPhoneNumber(phoneNumber);
      if (!cleaned) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Use 2547XXXXXXXX format.',
        });
      }

      const accountRef = `COM-${Date.now()}`;
      const description = `Commission payment (${bookings.length} item${bookings.length > 1 ? 's' : ''})`;

      console.log(`📱 Initiating STK Push to ${cleaned} for KES ${totalKES}`);

      const stkResponse = await mpesaService.stkPush(
        cleaned,
        totalKES,
        accountRef,
        description,
        '/api/payments/mpesa-callback'
      );

      if (!stkResponse?.CheckoutRequestID) {
        throw new Error('M-Pesa did not return a CheckoutRequestID');
      }

      // Stamp the CheckoutRequestID on all bookings so we can find them later
      await Booking.updateMany(
        { _id: { $in: bookingIds } },
        {
          $set: {
            'commission.mpesaCheckoutRequestID': stkResponse.CheckoutRequestID,
            'commission.mpesaPhone': cleaned,
            'commission.mpesaAmount': totalKES,
            'commission.mpesaInitiatedAt': new Date(),
          },
        }
      );

      return res.json({
        success: true,
        data: {
          paymentMethod: 'mpesa',
          checkoutRequestID: stkResponse.CheckoutRequestID,
          merchantRequestID: stkResponse.MerchantRequestID,
          customerMessage: stkResponse.CustomerMessage || 'Check your phone to complete payment.',
          amount: totalKES,
          phone: cleaned,
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  } catch (error) {
    console.error('initializeCommissionPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// VERIFY (Paystack fallback)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// M-PESA CALLBACK (public — Safaricom hits this)
// ─────────────────────────────────────────────────────────────
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      console.warn('Invalid M-Pesa callback payload:', req.body);
      return res.status(400).send('Invalid payload');
    }

    const {
      CheckoutRequestID,
      ResultCode: callbackResultCode,
      CallbackMetadata,
    } = Body.stkCallback;

    // Must be a plain string — an object here would be a query operator
    if (typeof CheckoutRequestID !== 'string' || !CheckoutRequestID) {
      return res.status(400).send('Invalid payload');
    }

    console.log(`📱 M-Pesa callback: ${CheckoutRequestID}, ResultCode: ${callbackResultCode}`);

    // Find bookings awaiting this M-Pesa payment
    const bookings = await Booking.find({
      'commission.mpesaCheckoutRequestID': CheckoutRequestID,
    });

    if (!bookings.length) {
      console.error(`❌ No bookings found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(200).send('OK'); // Safaricom expects 200 even on error
    }

    // Idempotency — skip if already paid
    const unpaid = bookings.filter((b) => b.commission?.status !== 'paid');
    if (!unpaid.length) {
      console.log(`⏭️ Reference ${CheckoutRequestID} already processed.`);
      return res.sendStatus(200);
    }

    // The callback is an unauthenticated POST — confirm the result with Safaricom
    const confirmation = await mpesaService.confirmPayment(CheckoutRequestID);
    if (!confirmation.confirmed) {
      console.warn(`⚠️ Could not confirm M-Pesa result for ${CheckoutRequestID} with Safaricom`);
      return res.sendStatus(200);
    }
    const ResultCode = confirmation.resultCode;
    const ResultDesc = confirmation.resultDesc;

    if (String(callbackResultCode) !== ResultCode) {
      console.warn(
        `⚠️ M-Pesa callback ResultCode ${callbackResultCode} does not match Safaricom (${ResultCode}) for ${CheckoutRequestID}`
      );
    }

    // ── Failure branch ──────────────────────────────────────
    if (ResultCode !== '0') {
      console.warn(`❌ M-Pesa payment failed: ${ResultDesc} (${ResultCode})`);

      await Booking.updateMany(
        { _id: { $in: unpaid.map((b) => b._id) } },
        {
          $set: {
            'commission.mpesaFailureReason': ResultDesc,
            'commission.mpesaFailureCode': ResultCode,
            'commission.mpesaFailedAt': new Date(),
          },
        }
      );

      return res.sendStatus(200);
    }

    // ── Success branch ──────────────────────────────────────
    const items = Array.isArray(CallbackMetadata?.Item) ? CallbackMetadata.Item : [];
    const amountItem = items.find((i) => i.Name === 'Amount');

    await markMpesaCommissionsPaid(unpaid, CheckoutRequestID, {
      paidAmount: amountItem ? Number(amountItem.Value) : null,
      receiptNumber: items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value || null,
      source: 'callback',
    });
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error processing M-Pesa callback:', error);
    res.sendStatus(500);
  }
};

// ─────────────────────────────────────────────────────────────
// M-PESA STATUS POLL (frontend polls this)
// ─────────────────────────────────────────────────────────────
exports.mpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (!checkoutRequestID) {
      return res.status(400).json({ success: false, message: 'checkoutRequestID required' });
    }

    // First check our own DB — has the callback marked them paid?
    // Must be a plain string — an object here would be a query operator
    if (typeof checkoutRequestID !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid checkoutRequestID' });
    }

    // Only the caller's own bookings — the fallback below can mark them paid
    const technician = await getTechnicianId(req.user.userId || req.user.id || req.user._id);
    const bookings = await Booking.find({
      technicianId: technician._id,
      'commission.mpesaCheckoutRequestID': checkoutRequestID,
    }).select('commission');

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found for this checkout ID',
      });
    }

    // All paid?
    const allPaid = bookings.every((b) => b.commission?.status === 'paid');
    if (allPaid) {
      return res.json({
        success: true,
        data: { status: 'success', message: 'Payment completed successfully.' },
      });
    }

    // Any failure recorded?
    const failed = bookings.find((b) => b.commission?.mpesaFailureReason);
    if (failed) {
      return res.json({
        success: true,
        data: {
          status: 'failed',
          message: failed.commission.mpesaFailureReason || 'Payment failed',
        },
      });
    }

    // Otherwise query Safaricom directly as a fallback
    try {
      const statusData = await mpesaService.queryStatus(checkoutRequestID);
      const resultCode =
        statusData.ResultCode === undefined || statusData.ResultCode === null
          ? statusData.ResultCode
          : String(statusData.ResultCode);

      let status = 'pending';
      let message = 'Payment still being processed';

      if (resultCode === '0') {
        // Callback hasn't landed (or was lost) — Safaricom's own answer is
        // authoritative, and the STK push was for the amount we stamped
        const unpaid = bookings.filter((b) => b.commission?.status !== 'paid');
        const result = await markMpesaCommissionsPaid(unpaid, checkoutRequestID, {
          paidAmount: unpaid[0]?.commission?.mpesaAmount,
          source: 'status-poll',
        });
        if (result.amountMismatch) {
          status = 'pending';
          message = 'Payment received — awaiting manual review.';
        } else {
          status = 'success';
          message = 'Payment successful';
        }
      } else if (resultCode === '1032') {
        status = 'failed';
        message = 'Transaction cancelled by user';
      } else if (resultCode === '1037') {
        status = 'failed';
        message = 'Transaction timed out';
      } else if (resultCode) {
        status = 'failed';
        message = statusData.ResultDesc || 'Payment failed';
      }

      return res.json({ success: true, data: { status, message, resultCode } });
    } catch (mpesaErr) {
      // If Safaricom query fails, just report pending — frontend will keep polling
      console.warn('M-Pesa queryStatus error:', mpesaErr.message);
      return res.json({
        success: true,
        data: { status: 'pending', message: 'Awaiting confirmation...' },
      });
    }
  } catch (error) {
    console.error('Error checking M-Pesa status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// SHARED: mark an M-Pesa batch as paid (idempotent) — used by the callback
// and the status-poll fallback. Callers must already have confirmed the
// result with Safaricom.
// ─────────────────────────────────────────────────────────────
async function markMpesaCommissionsPaid(
  bookings,
  checkoutRequestID,
  { paidAmount, receiptNumber = null, source }
) {
  const unpaid = bookings.filter((b) => b.commission?.status !== 'paid');
  if (!unpaid.length) {
    console.log(`[mpesa ${source}] ${checkoutRequestID} already processed.`);
    return { updated: 0, alreadyProcessed: true };
  }

  const expectedKES = unpaid.reduce((sum, b) => sum + (b.commission?.amount || 0), 0);

  // Sanity check on amount (allow small rounding tolerance)
  if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - expectedKES) > 1) {
    console.error(
      `[mpesa ${source}] ⚠️ Amount mismatch for ${checkoutRequestID}: paid ${paidAmount}, expected ${expectedKES}`
    );
    // Do not mark paid — log for manual review
    return { updated: 0, amountMismatch: true };
  }

  // Filter on status too, so a callback and a poll racing each other
  // can't both apply the update
  const result = await Booking.updateMany(
    { _id: { $in: unpaid.map((b) => b._id) }, 'commission.status': { $ne: 'paid' } },
    {
      $set: {
        'commission.status': 'paid',
        'commission.paidAt': new Date(),
        'commission.paymentMethod': 'mpesa',
        'commission.mpesaReceiptNumber': receiptNumber,
      },
    }
  );

  console.log(
    `[mpesa ${source}] ✅ Marked ${result.modifiedCount} commissions paid for ${checkoutRequestID}`
  );
  return { updated: result.modifiedCount };
}

// ─────────────────────────────────────────────────────────────
// SHARED: mark batch as paid (idempotent) — used by Paystack webhook
// ─────────────────────────────────────────────────────────────
async function markCommissionsPaid(transaction, source = 'webhook') {
  const ref = transaction.reference;

  const bookings = await Booking.find({ 'commission.paymentReference': ref });
  if (!bookings.length) {
    console.warn(`[${source}] No bookings found for reference ${ref}`);
    return { updated: 0 };
  }

  const unpaid = bookings.filter((b) => b.commission?.status !== 'paid');
  if (!unpaid.length) {
    console.log(`[${source}] Reference ${ref} already processed.`);
    return { updated: 0, alreadyProcessed: true };
  }

  const expectedKES = unpaid.reduce((sum, b) => sum + (b.commission?.amount || 0), 0);
  const expectedSmallest = convertToSmallestUnit(expectedKES, 'KES');

  if (transaction.amount !== expectedSmallest) {
    console.error(
      `[${source}] Amount mismatch for ${ref}. Paid ${transaction.amount}, expected ${expectedSmallest}`
    );
    return { updated: 0, amountMismatch: true };
  }

  await Booking.updateMany(
    { _id: { $in: unpaid.map((b) => b._id) } },
    {
      $set: {
        'commission.status': 'paid',
        'commission.paidAt': new Date(),
        'commission.paymentMethod': 'card',
      },
    }
  );

  console.log(`[${source}] ✅ Marked ${unpaid.length} commissions as paid for ${ref}`);
  return { updated: unpaid.length };
}

exports.markCommissionsPaid = markCommissionsPaid;