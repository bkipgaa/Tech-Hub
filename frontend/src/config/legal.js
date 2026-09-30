/**
 * legal.js
 * One place to fill in the details used by the Terms and Privacy pages.
 * Anything wrapped in {{double braces}} shows up highlighted in amber on the
 * page (in development) so you can see what is still missing. Replace the
 * whole value, braces included, e.g.  privacyEmail: 'privacy@webalink.co.ke'
 */
export const LEGAL = {
  company: 'Webalink',
  legalEntity: 'Webalink Limited',
  platform: 'Webalink',
  // Set to '' once the whole app has been renamed. While the app still shows the old name, the legal pages mention it so nobody is confused.
  formerName: 'WeBA-Hub',
  website: '{{https://your-domain}}',
  address: '{{Registered address}}, Kenya',
  phone: '{{+254 ...}}',
  privacyEmail: '{{privacy@your-domain}}',
  legalEmail: '{{legal@your-domain}}',
  disputeEmail: '{{disputes@your-domain}}',
  dpoName: '{{Name of data protection contact}}',
  odpcRegNo: '{{ODPC registration number}}',

  effectiveDate: '{{1 January 2027}}',
  version: '1.0',

  // Business decisions (suggested starting points shown in the braces)
  cancelWindow: '{{24 hours}}',
  cancelFee: '{{KES ___ or __% of the quote}}',
  disputeDays: '{{14}}',
  liabilityFloor: '{{KES 10,000}}',
  noticeDays: '{{14 days}}',
  feeChangeNotice: '{{30 days}}',
  commissionRate: '{{__%}}',
  commissionBase: '{{the labour amount, excluding materials}}',
  commissionOverdue: '{{14 days}}',
  circumventPeriod: '{{12 months}}',
  circumventPenalty: '{{__%}}',
  vatNote: '{{inclusive / exclusive}} of VAT where applicable',
  autoRenew: '{{Subscriptions do / do not renew automatically}}',
  breachReportHours: '{{48 hours}}',
  mediationCity: '{{Nairobi}}',

  // Retention periods
  keepAccountAfterDelete: '{{30 days}}',
  keepVerificationDocs: '{{12 months after the decision}}',
  keepFinancialRecords: '{{7 years}}',
  keepChats: '{{24 months}}',
  keepLogs: '{{24 months}}',
  keepConsentProof: '{{3 years}}',

  // Vendors to confirm
  dbHost: '{{MongoDB Atlas / your database host}}',
  emailProvider: '{{your email provider}}',
  transferCountries: '{{list the countries where your providers store data, e.g. USA, EU}}',
};