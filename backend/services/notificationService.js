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
const sendWhatsApp = require('../utils/sendWhatsApp');
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

// WhatsApp goes out alongside email. Skipped quietly until the WhatsApp keys are set.
const dispatchWhatsApp = async (phone, template, params, eventType) => {
  try {
    if (!sendWhatsApp.isConfigured()) return { success: false, reason: 'not_configured' };
    if (!phone) {
      console.warn(`[notify] No phone for WhatsApp event ${eventType} — skipping`);
      return { success: false, reason: 'no_recipient' };
    }

    await sendWhatsApp({ phone, template, params, language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' });

    console.log(`[notify] ${eventType} (WhatsApp) → ${phone}`);
    return { success: true };
  } catch (err) {
    console.error(`[notify] ${eventType} (WhatsApp) FAILED → ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────
// TECHNICIAN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
// Email, plus WhatsApp when the expert has a phone number. The WhatsApp template's
// body takes, in order: expert name, client name, service, date and time, location.
exports.technicianNewBooking = async (data) => {
  const [email, whatsapp] = await Promise.all([
    dispatch(data.technicianEmail, templates.technicianNewBooking, data, 'technician_new_booking'),
    dispatchWhatsApp(
      data.technicianPhone,
      process.env.WHATSAPP_BOOKING_TEMPLATE || 'new_booking',
      [
        data.technicianName,
        data.clientName,
        [data.serviceCategory, data.subService].filter(Boolean).join(' - '),
        [data.preferredDate, data.preferredTime].filter(Boolean).join(', '),
        data.address,
      ],
      'technician_new_booking'
    ),
  ]);
  return { ...email, whatsapp };
};

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

// ─────────────────────────────────────────────────────────────
// STAYS & SPACES LISTERS
// ─────────────────────────────────────────────────────────────
exports.listingPlanReminder = (data) =>
  dispatch(data.email, templates.listingPlanReminder, data, 'listing_plan_reminder');

exports.listingPlanPaid = (data) =>
  dispatch(data.email, templates.listingPlanPaid, data, 'listing_plan_paid');

exports.listingApproved = (data) =>
  dispatch(data.email, templates.listingApproved, data, 'listing_approved');

exports.listingRejected = (data) =>
  dispatch(data.email, templates.listingRejected, data, 'listing_rejected');

exports.jobApproved = (data) =>
  dispatch(data.email, templates.jobApproved, data, 'job_approved');

exports.jobRejected = (data) =>
  dispatch(data.email, templates.jobRejected, data, 'job_rejected');

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