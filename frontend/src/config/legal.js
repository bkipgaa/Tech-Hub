/**
 * legal.js
 * One place to fill in the details used by the Terms and Privacy pages.
 * Anything wrapped in {{double braces}} shows up highlighted in amber on the
 * page (in development) so you can see what is still missing. Replace the
 * whole value, braces included, e.g.  privacyEmail: 'privacy@webafix.co.ke'
 */
export const LEGAL = {
  company: 'Webafix',
  legalEntity: 'Webafix Ltd',
  platform: 'Webafix',
  registrationNo: 'PVT-OD16Y7RO',
  kraPin: 'P052596315H',
  // Set to '' once the whole app has been renamed. While the app still shows the old name, the legal pages mention it so nobody is confused.
  formerName: '',
  website: '{{https://your-domain}}',
  address: '{{Registered address}}, Kenya',
  phone: '0712 200 198',
  privacyEmail: 'webathub@gmail.com',
  legalEmail: 'webathub@gmail.com',
  disputeEmail: 'webathub@gmail.com',
  dpoName: '{{Name of data protection contact}}',
  odpcRegNo: '{{ODPC registration number}}',

  effectiveDate: '{{1 January 2027}}',
  version: '1.0',

  // Business decisions (suggested starting points shown in the braces)
  disputeDays: '{{14}}',
  liabilityFloor: '{{KES 10,000}}',
  noticeDays: '{{14 days}}',
  feeChangeNotice: '{{30 days}}',
  vatNote: '{{inclusive / exclusive}} of VAT where applicable',

  // Technician subscriptions (match backend/utils/subscriptionPlans.js and jobs/subscriptionReminders.js)
  freeRadius: '1,000 km',
  commissionPerJob: 'KES 500',
  reminderDays: '7, 3 and 1 days',

  // Stays & Spaces listing fees (match backend/utils/listingPlan.js)
  listingFreeMonths: 3,
  listingFreeCount: 5,
  listingFee: 'KES 200',

  breachReportHours: '{{48 hours}}',
  mediationCity: '{{Nairobi}}',

  // Retention periods
  keepAccountAfterDelete: '{{30 days}}',
  keepVerificationDocs: '{{12 months after the decision}}',
  keepFinancialRecords: '{{7 years}}',
  keepChats: '{{24 months}}',
  keepEvidence: '{{24 months after the booking}}',  keepLogs: '{{24 months}}',
  keepConsentProof: '{{3 years}}',

  // Vendors to confirm
  dbHost: '{{MongoDB Atlas / your database host}}',
  emailProvider: '{{your email provider}}',
  whatsappProvider: 'Meta (WhatsApp Business)',
  transferCountries: '{{list the countries where your providers store data, e.g. USA, EU}}',
};