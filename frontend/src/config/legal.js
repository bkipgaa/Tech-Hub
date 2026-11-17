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
  website: 'https://webafix.com',
  address: 'Nairobi, Kenya', // as on the site footer; add the full registered postal address when you have it
  phone: '0712 200 198',
  privacyEmail: 'webathub@gmail.com',
  legalEmail: 'webathub@gmail.com',
  disputeEmail: 'webathub@gmail.com',
  dpoName: 'Webafix Data Protection Officer',
  // Add once registered with the Data Protection Commissioner; the Privacy Policy shows it only when set
  odpcRegNo: '',

  effectiveDate: '1 December 2026', // 14 days' notice from 17 November 2026
  version: '1.1', // 1.1: Businesses (shops, products, orders), KES 500 listing fee, service groups

  // Business decisions
  disputeDays: '14',
  liabilityFloor: 'KES 10,000',
  noticeDays: '14 days',
  feeChangeNotice: '30 days',
  // Reads "Fees are …" in the Terms
  vatNote: 'not subject to VAT, because Webafix Ltd is not registered for VAT. If that changes, we will tell you before any VAT is added',

  // Technician subscriptions (match backend/utils/subscriptionPlans.js and jobs/subscriptionReminders.js)
  freeRadius: '300 km',
  commissionPerJob: 'KES 500',
  reminderDays: '7, 3 and 1 days',

  // Non-technical service groups: free for now within this distance (backend/data/serviceBuckets.js)
  nonTechnicalRadius: '100 km',

  // Businesses listing fees (match backend/utils/listingPlan.js)
  listingFreeMonths: 3,
  listingFreeCount: 5,
  listingFee: 'KES 500',

  breachReportHours: '48 hours',
  mediationCity: 'Nairobi',

  // Retention periods
  keepAccountAfterDelete: '30 days',
  keepVerificationDocs: '12 months after the decision',
  keepFinancialRecords: '7 years',
  keepChats: '24 months',
  keepEvidence: '24 months after the booking',
  keepLogs: '24 months',
  keepConsentProof: '3 years',

  // Vendors
  dbHost: 'MongoDB Atlas',
  emailProvider: 'Brevo',
  whatsappProvider: 'Meta (WhatsApp Business)',
  transferCountries: 'including the USA and the European Union',
};