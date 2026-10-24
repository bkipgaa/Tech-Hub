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
  url: process.env.FRONTEND_URL || 'https://webafix.com',
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

// Reminder 7/3/1 days before a plan ends: free trial, free month of a paid plan, or a paid plan
exports.technicianSubscriptionExpiring = (data) => {
  const when = data.daysLeft === 1 ? 'tomorrow' : `in ${data.daysLeft} days`;
  const kind = data.isTrial ? 'trial' : data.isFreeMonth ? 'freeMonth' : 'paid';
  const copy = {
    trial: {
      subject: `⏰ Your free trial ends ${when}`,
      title: `Your free trial ends ${when}`,
      ends: `Your <strong>${data.planName}</strong> ends on <strong>${data.endDate}</strong>.`,
      note: `<strong>Good to know:</strong> after your trial you stay on the Free plan, visible to clients within 50 km with no monthly fee
             (KES 500 commission per job). Choose a paid plan to reach clients up to 5,000 km away with no commission.`,
      cta: 'See Plans',
    },
    freeMonth: {
      subject: `⏰ Your free month of ${data.planName} ends ${when}`,
      title: `Your free month of ${data.planName} ends ${when}`,
      ends: `Your free month of <strong>${data.planName}</strong> ends on <strong>${data.endDate}</strong>.`,
      note: `<strong>Nothing will be charged.</strong> After it ends you go back to the Free plan: visible within 50 km, with a
             KES 500 commission on each job. Subscribe to ${data.planName} to keep your ${data.currentRadius} km visibility and pay no commission.`,
      cta: `Subscribe to ${data.planName}`,
    },
    paid: {
      subject: data.daysLeft === 1 ? '⚠️ Your subscription expires TOMORROW' : `⚠️ Your subscription expires ${when}`,
      title: `Your subscription expires ${when}`,
      ends: `Your <strong>${data.planName}</strong> subscription will expire on <strong>${data.endDate}</strong>.`,
      note: `<strong>Important:</strong> When your subscription expires, you'll be moved to the Free plan: visible within 50 km, with a
             KES 500 commission on each job and ratings shown only once it is paid. Renew now to keep your ${data.currentRadius} km visibility and pay no commission.`,
      cta: 'Renew Subscription',
    },
  }[kind];

  return {
    subject: copy.subject,
    html: layout(
      copy.title,
      `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>${copy.ends}</p>
      <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
        <p style="margin:0;color:#92400e;">${copy.note}</p>
      </div>
      <p>Subscribing takes less than a minute with Card or M-Pesa.</p>
    `,
      `${BRAND.url}/subscription`,
      copy.cta
    ),
  };
};

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

// A client rated a Free-plan job; the rating shows once the commission is paid
// data: { technicianName, amount, rating }
exports.technicianCommissionDue = (data) => ({
  subject: `⭐ You received a ${data.rating}-star rating — pay KES ${data.amount} to show it`,
  html: layout(
    `New rating: ${data.rating} stars`,
    `
      <p>Hi <strong>${data.technicianName}</strong>,</p>
      <p>Your client confirmed the job and rated you <strong>${data.rating}/5 stars</strong>.</p>
      <p>This job came while you were on the <strong>Free plan</strong>, so a commission of
        <strong>KES ${data.amount}</strong> is due. As soon as it is paid, the rating and the
        completed job appear on your profile.</p>
      <p style="color:#6b7280;font-size:14px;">On any paid plan (from KES 1,000 a month) there is no commission
        and ratings show immediately.</p>
    `,
    `${BRAND.url}/commissions`,
    'Pay commission'
  ),
});

// ─────────────────────────────────────────────────────────────
// STAYS & SPACES LISTING PLAN
// ─────────────────────────────────────────────────────────────

// Reminder for listings whose free months or paid months end 7/3/1 days from
// now, or ended today. One email per lister listing every affected listing.
// data: { name, price, items: [{ title, endDate, daysLeft, ended, free }] }
exports.listingPlanReminder = (data) => {
  const price = `KES ${Number(data.price).toLocaleString('en-KE')}`;
  const ended = data.items.filter((i) => i.ended);
  const soon = data.items.filter((i) => !i.ended);
  const minDays = soon.length ? Math.min(...soon.map((i) => i.daysLeft)) : 0;
  const when = minDays === 1 ? 'tomorrow' : `in ${minDays} days`;
  const anyFree = soon.some((i) => i.free);
  const n = (k) => `${k} listing${k === 1 ? '' : 's'}`;

  const subject = ended.length
    ? `⚠️ ${n(ended.length)} now hidden from search`
    : anyFree
    ? `⏰ Your free listing period ends ${when}`
    : `⏰ ${n(soon.length)} expire${soon.length === 1 ? 's' : ''} ${when}`;
  const title = ended.length ? 'Some of your listings are hidden' : anyFree ? `Your free months end ${when}` : `Your listings expire ${when}`;

  const row = (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>${i.title}</strong></td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:${i.ended ? BRAND.accentRed : '#374151'};">
        ${i.ended ? `Hidden since ${i.endDate}` : `${i.free ? 'Free until' : 'Paid until'} ${i.endDate}`}
      </td>
    </tr>`;

  const intro = ended.length
    ? `<p>These listings are no longer showing in search. Nothing has been deleted: pay ${price} a month per listing and they show again straight away.</p>`
    : anyFree
    ? `<p>Your 3 free months on Stays &amp; Spaces are ending. After that each listing is ${price} a month, so you only pay for the ones you want to keep.</p>`
    : `<p>Renew to keep these listings in search. Each one is ${price} a month, and paying early adds time on top of what's left.</p>`;

  return {
    subject,
    html: layout(
      title,
      `<p>Hi <strong>${data.name}</strong>,</p>${intro}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">${data.items.map(row).join('')}</table>
       <p style="font-size:13px;color:#6b7280;">You can also edit a listing any time while it's paid up.</p>`,
      `${BRAND.url}/my-listings`,
      ended.length ? 'Show them again' : 'Renew my listings'
    ),
  };
};

// Receipt after paying for listings. data: { name, amount, method, months, items: [{ title, until }] }
exports.listingPlanPaid = (data) => ({
  subject: `✅ Payment received for ${data.items.length} listing${data.items.length === 1 ? '' : 's'}`,
  html: layout(
    'Payment received',
    `
      <p>Hi <strong>${data.name}</strong>,</p>
      <p>Thanks! We received your Stays &amp; Spaces payment.</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.color};">
        <p style="margin:4px 0;"><strong>Amount:</strong> KES ${Number(data.amount).toLocaleString('en-KE')}</p>
        <p style="margin:4px 0;"><strong>Paid by:</strong> ${data.method === 'mpesa' ? 'M-Pesa' : 'Card'}</p>
        <p style="margin:4px 0;"><strong>Period:</strong> ${data.months} month${data.months === 1 ? '' : 's'}</p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        ${data.items.map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">${i.title}</td>
          <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;text-align:right;">Live until ${i.until}</td></tr>`).join('')}
      </table>
    `,
    `${BRAND.url}/my-listings`,
    'View my listings'
  ),
});

// Admin approved a listing. data: { name, title, listingId, live, price }
exports.listingApproved = (data) => ({
  subject: `✅ Approved: ${data.title}`,
  html: layout(
    'Your listing is approved',
    `<p>Hi <strong>${data.name}</strong>,</p>
     <p>Good news: <strong>${data.title}</strong> has been approved.</p>
     ${data.live
       ? '<p>It is now live in Stays &amp; Spaces search, and clients can contact you directly.</p>'
       : `<p>To show it in search, pay <strong>KES ${Number(data.price).toLocaleString('en-KE')} a month</strong> from My Listings.</p>`}`,
    data.live ? `${BRAND.url}/stays/${data.listingId}` : `${BRAND.url}/my-listings`,
    data.live ? 'View listing' : 'Pay and go live'
  ),
});

// Admin rejected a listing. data: { name, title, listingId, reason }
exports.listingRejected = (data) => ({
  subject: `Changes needed: ${data.title}`,
  html: layout(
    'Your listing needs a few changes',
    `<p>Hi <strong>${data.name}</strong>,</p>
     <p>We couldn't approve <strong>${data.title}</strong> yet. Here's why:</p>
     <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.accentRed};">${data.reason}</div>
     <p>Edit the listing to fix this and it will be sent for review again.</p>`,
    `${BRAND.url}/stays/${data.listingId}/edit`,
    'Edit listing'
  ),
});

// Admin approved a job post. data: { name, title, jobId }
exports.jobApproved = (data) => ({
  subject: `✅ Your job is live: ${data.title}`,
  html: layout(
    'Your job post is approved',
    `<p>Hi <strong>${data.name}</strong>,</p>
     <p><strong>${data.title}</strong> is now in Available Jobs, where experts can see it and apply.</p>
     <p>It stays open for 30 days. You'll see applications under My Jobs.</p>`,
    `${BRAND.url}/jobs/${data.jobId}`,
    'View job'
  ),
});

// Admin rejected or took down a job post. data: { name, title, reason }
exports.jobRejected = (data) => ({
  subject: `Changes needed: ${data.title}`,
  html: layout(
    'Your job post was not approved',
    `<p>Hi <strong>${data.name}</strong>,</p>
     <p>We couldn't publish <strong>${data.title}</strong>. Here's why:</p>
     <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${BRAND.accentRed};">${data.reason}</div>
     <p>You can post it again with the changes.</p>`,
    `${BRAND.url}/post-job`,
    'Post a job'
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
  subject: `🎉 Your job is complete — please check and confirm`,
  html: layout(
    'Job completed!',
    `
      <p>Hi <strong>${data.clientName}</strong>,</p>
      <p><strong>${data.technicianName}</strong> has marked your job as complete and added proof of the finished work.</p>
      <p>Please open the booking, check the photos (or link), and confirm the work is done — or tell us if something is wrong.</p>
      <p>Once you confirm, pay the expert for the labor. You'll then be able to rate them and complete the booking.</p>
    `,
    `${BRAND.url}/bookings/${data.bookingId}`,
    'Check & Confirm'
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