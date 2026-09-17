/**
 * emailTemplates.js
 * =================
 * HTML email templates for all notification types.
 * 
 * Each template is a function that takes a `data` object and
 * returns { subject, html }.
 * 
 * Design: simple, responsive, inline-styled for email clients.
 */

const BRAND = {
  name: 'WeBA-Hub',
  color: '#16a34a',        // green-600
  colorDark: '#15803d',
  accentRed: '#dc2626',
  footer: '© Weba-Hub. All rights reserved.',
  url: process.env.FRONTEND_URL || 'https://tech-hub-frontend-lime.vercel.app',
};

// ─────────────────────────────────────────────────────────────
// BASE LAYOUT
// ─────────────────────────────────────────────────────────────
const layout = (title, bodyHtml, ctaUrl = null, ctaLabel = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.color} 0%,${BRAND.colorDark} 100%);padding:24px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                      ${BRAND.name.split('-')[0]}<span style="color:#fecaca;">-Hub</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#111827;">${title}</h1>
              <div style="font-size:15px;line-height:1.6;color:#374151;">
                ${bodyHtml}
              </div>

              ${ctaUrl ? `
                <div style="margin-top:28px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.color};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">
                    ${ctaLabel || 'View'}
                  </a>
                </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                ${BRAND.footer}<br/>
                <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none;">Visit Weba-Hub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// TECHNICIAN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.technicianNewBooking = (data) => ({
  subject: `🔧 New booking request from ${data.clientName}`,
  html: layout(
    'You have a new booking request!',
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>You've received a new booking request:</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Client:</strong> ${data.clientName}</p>
        <p style="margin:4px 0;"><strong>Service:</strong> ${data.serviceCategory} → ${data.subService}</p>
        <p style="margin:4px 0;"><strong>Preferred Date:</strong> ${data.preferredDate}</p>
        <p style="margin:4px 0;"><strong>Time:</strong> ${data.preferredTime}</p>
        <p style="margin:4px 0;"><strong>Location:</strong> ${data.address || 'Provided in app'}</p>
      </div>
      <p>Log in to your dashboard to review the request and send a quotation.</p>
    `,
    `${BRAND.url}/technician-dashboard/bookings`,
    'View Booking'
  ),
});

exports.technicianSubscriptionExpiring = (data) => ({
  subject: data.daysLeft === 1
    ? `⚠️ Your subscription expires TOMORROW`
    : `⚠️ Your subscription expires in ${data.daysLeft} days`,
  html: layout(
    data.daysLeft === 1 ? 'Your subscription expires tomorrow' : `Your subscription expires in ${data.daysLeft} days`,
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Your <strong>${data.planName}</strong> subscription will expire on <strong>${data.endDate}</strong>.</p>
      <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
        <p style="margin:0;color:#92400e;">
          <strong>Important:</strong> When your subscription expires, you'll be moved to the Free plan with a 10 km visibility radius.
          Renew now to keep your ${data.currentRadius} km visibility and other premium features.
        </p>
      </div>
      <p>Renewing takes less than a minute with Card or M-Pesa.</p>
    `,
    `${BRAND.url}/subscription`,
    'Renew Subscription'
  ),
});

exports.technicianSubscriptionRenewed = (data) => ({
  subject: `✅ Subscription renewed — ${data.planName}`,
  html: layout(
    'Your subscription is active',
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Your <strong>${data.planName}</strong> subscription has been renewed successfully.</p>
      <div style="background:#dcfce7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Amount:</strong> KES ${data.amount}</p>
        <p style="margin:4px 0;"><strong>Valid until:</strong> ${data.endDate}</p>
        <p style="margin:4px 0;"><strong>Visibility:</strong> ${data.visibilityRadius} km</p>
      </div>
      <p>Thank you for continuing with Weba-Hub!</p>
    `,
    `${BRAND.url}/subscription`,
    'View Subscription'
  ),
});

exports.technicianVerificationApproved = (data) => ({
  subject: `✅ Verification approved`,
  html: layout(
    'Your account is now verified!',
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Great news — your technician account has been <strong>verified</strong>.</p>
      <p>A verified badge now appears on your profile, giving clients extra confidence when booking you.</p>
      ${data.notes ? `<div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;font-size:14px;color:#6b7280;"><em>Admin note: ${data.notes}</em></div>` : ''}
    `,
    `${BRAND.url}/technician-dashboard`,
    'View Profile'
  ),
});

exports.technicianVerificationRejected = (data) => ({
  subject: `⚠️ Verification needs attention`,
  html: layout(
    'Verification could not be approved',
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Your verification request was not approved this time.</p>
      <div style="background:#fee2e2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.accentRed};">
        <p style="margin:0;color:#991b1b;"><strong>Reason:</strong> ${data.reason}</p>
      </div>
      <p>You can update your documents and resubmit for review.</p>
    `,
    `${BRAND.url}/technician-dashboard`,
    'Update Documents'
  ),
});

exports.technicianClientRated = (data) => ({
  subject: `⭐ You received a ${data.rating}-star rating`,
  html: layout(
    `New rating: ${data.rating} stars`,
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p><strong>${data.clientName}</strong> rated you <strong>${data.rating}/5 stars</strong>.</p>
      ${data.review ? `
        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
          <p style="margin:0;font-style:italic;color:#374151;">"${data.review}"</p>
        </div>
      ` : ''}
      <p>Keep up the great work!</p>
    `,
    `${BRAND.url}/technician-dashboard`,
    'View Dashboard'
  ),
});

exports.technicianCommissionDue = (data) => ({
  subject: `💰 Commission payment due — KES ${data.amount}`,
  html: layout(
    'Monthly commission summary',
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Here's your commission summary for <strong>${data.month}</strong>:</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Completed jobs:</strong> ${data.jobCount}</p>
        <p style="margin:4px 0;"><strong>Total labor:</strong> KES ${data.totalLabor}</p>
        <p style="margin:4px 0;font-size:18px;color:${BRAND.color};"><strong>Commission due (5%): KES ${data.amount}</strong></p>
      </div>
      <p>Please submit your pending commissions from your dashboard.</p>
    `,
    `${BRAND.url}/technician-dashboard/commissions`,
    'Submit Commission'
  ),
});

// ─────────────────────────────────────────────────────────────
// CLIENT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.clientBookingConfirmed = (data) => ({
  subject: `✅ Your booking was confirmed by ${data.technicianName}`,
  html: layout(
    'Booking confirmed!',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p><strong>${data.technicianName}</strong> has confirmed your booking for <strong>${data.serviceCategory}</strong>.</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Scheduled for:</strong> ${data.preferredDate} at ${data.preferredTime}</p>
        <p style="margin:4px 0;"><strong>Technician:</strong> ${data.technicianName}</p>
      </div>
    `,
    `${BRAND.url}/bookings/${data.bookingId}`,
    'View Booking'
  ),
});

exports.clientQuotationReceived = (data) => ({
  subject: `📄 Quotation received from ${data.technicianName}`,
  html: layout(
    'You have a quotation',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p><strong>${data.technicianName}</strong> has sent you a quotation for your booking.</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Labor:</strong> KES ${data.laborCost}</p>
        <p style="margin:4px 0;"><strong>Materials:</strong> KES ${data.materialsCost}</p>
        <p style="margin:4px 0;font-size:18px;color:${BRAND.color};"><strong>Total: KES ${data.totalCost}</strong></p>
      </div>
      <p>Review the quotation and accept or reject it.</p>
    `,
    `${BRAND.url}/bookings/${data.bookingId}`,
    'Review Quotation'
  ),
});

exports.clientWorkCompleted = (data) => ({
  subject: `🎉 Your job is complete — payment needed`,
  html: layout(
    'Job completed!',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p>Great news — <strong>${data.technicianName}</strong> has marked your job as complete.</p>
      <p>Please pay the labor amount (KES ${data.laborAmount}) directly to the technician and confirm payment in the app.</p>
      <p>After confirming, you'll be able to rate the technician and complete the booking.</p>
    `,
    `${BRAND.url}/bookings/${data.bookingId}`,
    'View Booking'
  ),
});

exports.clientLeaveReview = (data) => ({
  subject: `⭐ How was your experience with ${data.technicianName}?`,
  html: layout(
    'Leave a review',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p>Your booking with <strong>${data.technicianName}</strong> was completed. Help other clients by leaving a review!</p>
      <p>Your feedback helps us improve and helps great technicians get recognised.</p>
    `,
    `${BRAND.url}/bookings/${data.bookingId}`,
    'Leave Review'
  ),
});

exports.clientBookingCancelled = (data) => ({
  subject: `❌ Booking cancelled by ${data.technicianName}`,
  html: layout(
    'Your booking was cancelled',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p>Unfortunately, <strong>${data.technicianName}</strong> cancelled your booking.</p>
      ${data.reason ? `<p><em>Reason: ${data.reason}</em></p>` : ''}
      <p>You can browse other technicians and book someone else.</p>
    `,
    `${BRAND.url}/search`,
    'Find Another Technician'
  ),
});

// ─────────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
exports.adminVerificationRequest = (data) => ({
  subject: `🔔 New verification request: ${data.technicianName}`,
  html: layout(
    'New verification request',
    `
      <p><strong>${data.technicianName}</strong> has submitted documents for verification.</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Category:</strong> ${data.mainCategory || '—'}</p>
        <p style="margin:4px 0;"><strong>Documents:</strong> ${data.documentCount}</p>
      </div>
    `,
    `${BRAND.url}/admin/verifications`,
    'Review Now'
  ),
});

exports.adminNewTechnician = (data) => ({
  subject: `👤 New technician signed up: ${data.technicianName}`,
  html: layout(
    'New technician registration',
    `
      <p>A new technician has joined Weba-Hub:</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Name:</strong> ${data.technicianName}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:4px 0;"><strong>Category:</strong> ${data.mainCategory || '—'}</p>
      </div>
    `,
    `${BRAND.url}/admin/technicians`,
    'View Technician'
  ),
});

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
module.exports = exports;