/**
 * notificationService.js
 * ======================
 * Central notification hub. All events (email, in-app, etc.) route through here.
 * 
 * Usage:
 *   const notify = require('../services/notificationService');
 *   await notify.technicianNewBooking({ ... });
 */

const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');

// ─────────────────────────────────────────────────────────────
// CORE DISPATCHER
// ─────────────────────────────────────────────────────────────
const dispatch = async (to, templateFn, data, eventType) => {
  try {
    if (!to) {
      console.warn(`[notify] No email for event ${eventType} — skipping`);
      return { success: false, reason: 'no_recipient' };
    }

    const { subject, html } = templateFn(data);

    await sendEmail({ email: to, subject, html });

    console.log(`[notify] ${eventType} → ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`[notify] ${eventType} FAILED → ${to}:`, err.message);
    // Don't throw — a failed notification should never break the caller
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────
// TECHNICIAN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.technicianNewBooking = (data) =>
  dispatch(data.technicianEmail, templates.technicianNewBooking, data, 'technician_new_booking');

exports.technicianSubscriptionExpiring = (data) =>
  dispatch(data.technicianEmail, templates.technicianSubscriptionExpiring, data, 'technician_subscription_expiring');

exports.technicianSubscriptionRenewed = (data) =>
  dispatch(data.technicianEmail, templates.technicianSubscriptionRenewed, data, 'technician_subscription_renewed');

exports.technicianVerificationApproved = (data) =>
  dispatch(data.technicianEmail, templates.technicianVerificationApproved, data, 'technician_verification_approved');

exports.technicianVerificationRejected = (data) =>
  dispatch(data.technicianEmail, templates.technicianVerificationRejected, data, 'technician_verification_rejected');

exports.technicianClientRated = (data) =>
  dispatch(data.technicianEmail, templates.technicianClientRated, data, 'technician_client_rated');

exports.technicianCommissionDue = (data) =>
  dispatch(data.technicianEmail, templates.technicianCommissionDue, data, 'technician_commission_due');

// ─────────────────────────────────────────────────────────────
// CLIENT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.clientBookingConfirmed = (data) =>
  dispatch(data.clientEmail, templates.clientBookingConfirmed, data, 'client_booking_confirmed');

exports.clientQuotationReceived = (data) =>
  dispatch(data.clientEmail, templates.clientQuotationReceived, data, 'client_quotation_received');

exports.clientWorkCompleted = (data) =>
  dispatch(data.clientEmail, templates.clientWorkCompleted, data, 'client_work_completed');

exports.clientLeaveReview = (data) =>
  dispatch(data.clientEmail, templates.clientLeaveReview, data, 'client_leave_review');

exports.clientBookingCancelled = (data) =>
  dispatch(data.clientEmail, templates.clientBookingCancelled, data, 'client_booking_cancelled');

// ─────────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.adminVerificationRequest = (data) =>
  dispatch(data.adminEmail || process.env.ADMIN_EMAIL, templates.adminVerificationRequest, data, 'admin_verification_request');

exports.adminNewTechnician = (data) =>
  dispatch(data.adminEmail || process.env.ADMIN_EMAIL, templates.adminNewTechnician, data, 'admin_new_technician');

module.exports = exports;