import React from 'react';
import LegalLayout from '../components/legal/LegalLayout';
import { LEGAL as L } from '../config/legal';

const E = L.legalEntity;

const sections = [
  { id: 'who', title: 'Who we are', body: [
    `${E} ("**Webalink**", "we", "us") runs the Webalink online platform at ${L.website}, which connects clients with independent technicians and engineers.`,
    { ul: [
      `Registered address: ${L.address}`,
      `ODPC registration number: ${L.odpcRegNo}`,
      `Data protection contact: ${L.dpoName}, ${L.privacyEmail}, ${L.phone}`,
    ]},
    `We are the **data controller** for the personal data described here. This policy is issued under the **Data Protection Act, 2019 (Kenya)** and its regulations.`,
    ...(L.formerName ? [`Webalink was previously known as **${L.formerName}**. This policy covers your data whichever name you see.`] : []),
  ]},
  { id: 'scope', title: 'Who this covers', body: [
    `Clients, technicians and engineers, people who post or apply for jobs, and visitors. The platform is for people **aged 18 and over**. We do not knowingly collect data from children. If you think a child has registered, tell us and we will delete the account.`,
  ]},
  { id: 'collect', title: 'The personal data we collect', body: [
    { table: { head: ['Category', 'What it includes', 'From'], rows: [
      ['Account', 'First and last name, email, phone number, password (stored only as a one-way hash), role (client or technician), profile photo, account status', 'You'],
      ['Technician profile', 'Headline, "about me", skills, years of experience, education, work history, certifications and credential IDs or links, languages, services and prices, working hours, business details, social links, portfolio images, videos and documents (and any client names you choose to list)', 'You'],
      ['Verification', 'Documents you upload to prove identity, qualifications or licences, and the outcome of our review', 'You and our admins'],
      ['Location', 'Your address, the map coordinates and formatted address of your service location, the address where a job is to be done, and your device location if you allow your browser to share it', 'You and your device'],
      ['Bookings and jobs', 'Service requested, description, date and time, address, quotations, materials and labour amounts, notes, status history, cancellation reasons, job posts and applications', 'You'],
      ['Ratings and reviews', 'Star ratings and written reviews of clients and technicians', 'You'],
      ['Messages', 'Chat messages, attachments and conversation details sent through the platform', 'You'],
      ['Payments', 'Payment method, amounts, status and transaction references for subscriptions, commissions and bookings. **Card details are entered on Paystack and M-Pesa PINs on your phone. We never see or store them.** We may receive your M-Pesa number and receipt.', 'You, Paystack, Safaricom'],
      ['Technical', 'IP address, browser and device type, security and log records, sign-in times, and login information kept in your browser', 'Automatic'],
      ['Staff activity logs', 'Records of what our admins do on the platform, kept for security and accountability', 'Us'],
      ['Communications', 'Emails and support requests you send us', 'You'],
    ]}},
    `We do not intentionally collect data about your health, religion, politics or biometrics. Please do not put such information in profiles, chats or uploads unless it is needed for verification.`,
  ]},
  { id: 'why', title: 'Why we use it, and our legal basis', body: [
    { table: { head: ['Purpose', 'Legal basis'], rows: [
      ['Create and run your account, sign you in', 'Contract'],
      ['Show technician profiles, match clients and technicians by location and category, run bookings, quotations, jobs and chat', 'Contract'],
      ['Verify identity, licences and qualifications, and prevent fraud and unsafe work', 'Legitimate interest, and your consent when you upload documents'],
      ['Process subscriptions and commissions, keep financial records, issue receipts', 'Contract and legal obligation (tax and accounting)'],
      ['Send service messages: booking updates, password resets, subscription reminders, receipts', 'Contract and legitimate interest'],
      ['Ratings, reviews, dispute handling and moderation', 'Legitimate interest'],
      ['Security, abuse prevention, audit logs, breach detection', 'Legitimate interest and legal obligation'],
      ['Improve the platform using aggregated statistics', 'Legitimate interest'],
      ['Marketing emails or SMS about features and offers', '**Consent only.** You can withdraw it any time.'],
      ['Comply with the law, court orders and lawful requests from authorities', 'Legal obligation'],
    ]}},
    `Where we rely on consent, you can withdraw it at any time. That does not affect processing that already happened.`,
  ]},
  { id: 'location', title: 'Your location', body: [
    `Technicians are shown to clients by distance and by the technician's subscribed **visibility radius**, so we store your service location.`,
    { ul: [
      `**Clients:** we use your location to search and to carry out a booking. Your booking address goes to the technician you book, for that job only.`,
      `**Technicians:** your public profile shows your city or area and service radius, not your exact coordinates or street address.`,
      `You can refuse browser location access and type an address instead.`,
    ]},
  ]},
  { id: 'sharing', title: 'Who we share it with', body: [
    { ul: [
      `**Other users, as the service needs.** Clients see a technician's public profile, ratings and prices. When a booking is made, the technician receives the client's name, phone, address and job details. People in a chat see each other's messages. Reviews are visible to other users.`,
      `**Service providers acting on our instructions:** ${L.dbHost} (database), Render and Vercel (hosting), Cloudinary (images, video and document storage), Paystack (card payments), Safaricom M-Pesa (mobile payments), and ${L.emailProvider} (email).`,
      `**Authorities, regulators and courts** where the law requires, or to protect rights, safety and property.`,
      `**A buyer or partner** if the business is merged or sold, subject to this policy.`,
    ]},
    `**We do not sell your personal data.**`,
  ]},
  { id: 'transfers', title: 'Transfers outside Kenya', body: [
    `Some providers store or process data outside Kenya (${L.transferCountries}). We transfer personal data abroad only where the law allows: with proper safeguards such as contractual data protection terms, where it is needed to perform our contract with you, or with your consent. Contact us for details of the safeguards used.`,
  ]},
  { id: 'retention', title: 'How long we keep it', body: [
    { table: { head: ['Data', 'Kept for'], rows: [
      ['Account and profile', `While your account is active, then ${L.keepAccountAfterDelete} after deletion (to allow recovery and fraud checks)`],
      ['Verification documents', `${L.keepVerificationDocs}, or until you remove them`],
      ['Bookings, quotations, payments, commission and invoice records', `${L.keepFinancialRecords} (tax and accounting)`],
      ['Chat messages', `${L.keepChats} after the related booking (dispute window)`],
      ['Reviews', 'While the reviewed account exists, then anonymised'],
      ['Security and admin logs', L.keepLogs],
      ['Marketing consent records', `Until you withdraw, plus proof of consent for ${L.keepConsentProof}`],
      ['Password reset tokens', 'Expire automatically after a short time'],
    ]}},
    `When a period ends we delete or anonymise the data.`,
  ]},
  { id: 'rights', title: 'Your rights', body: [
    `Under the Data Protection Act you can:`,
    { ul: [
      `be **informed** about how we use your data (this policy);`,
      `**access** the personal data we hold about you;`,
      `**correct** data that is wrong or incomplete;`,
      `ask us to **delete** it (except where the law makes us keep it, such as tax records);`,
      `**object** to processing, including direct marketing, at any time;`,
      `ask us to **restrict** processing in some cases;`,
      `receive your data in a common format (**portability**);`,
      `**withdraw consent** at any time; and`,
      `not be subject to decisions made **only by automated means** with legal or similar effect. We do not make such decisions. Search visibility follows your chosen plan and location.`,
    ]},
    `**To use a right:** email ${L.privacyEmail} or use your account settings where available. We may confirm your identity first and will respond within **30 days** or the period the law sets.`,
    { note: `**Complaints.** Please contact us first. You can also complain to the **Office of the Data Protection Commissioner, Kenya** (www.odpc.go.ke).` },
  ]},
  { id: 'security', title: 'How we protect it', body: [
    `We use measures suited to the risk: encrypted (HTTPS) connections, hashed passwords, access controls and role-based admin permissions, audit logs of admin actions, payment security handled by Paystack and Safaricom, and limited staff access. No system is perfectly secure. If a breach puts your rights at risk we will tell the ODPC within 72 hours and tell you without unreasonable delay.`,
    `**Your part:** use a strong, unique password, never share your login, and log out on shared devices.`,
  ]},
  { id: 'cookies', title: 'Cookies and browser storage', body: [
    `The platform does not currently use advertising or analytics cookies. It stores the following in your browser so the site works:`,
    { table: { head: ['Item', 'Purpose', 'Lasts'], rows: [
      ['token (local storage)', 'Keeps you signed in', 'Until you log out or clear browser data'],
      ['user (local storage)', 'Shows your name and role in the app', 'Until you log out or clear browser data'],
      ['catalogData (session storage)', 'Caches the service list for speed', 'Until you close the tab'],
    ]}},
    `These are strictly necessary and need no consent. You can clear them in your browser settings, but you will be signed out. If we add analytics or other non-essential tracking, we will ask for your consent first with a banner and will not load it until you agree.`,
  ]},
  { id: 'marketing', title: 'Marketing', body: [
    `We send marketing only with your consent, and every marketing message has an unsubscribe option. Service messages (booking updates, receipts, security alerts) are not marketing and continue while you have an account.`,
  ]},
  { id: 'links', title: 'Links to other sites', body: [
    `The platform may link to outside sites, for example a technician's social profile or credential page. We are not responsible for their privacy practices.`,
  ]},
  { id: 'updates', title: 'Changes to this policy', body: [
    `We may update this policy. For material changes we will notify you by email or in the app and update the date and version. Where the law requires fresh consent, we will ask for it.`,
  ]},
  { id: 'contact', title: 'Contact us', body: [
    { ul: [
      `${E}, ${L.address}`,
      `Data protection contact: ${L.dpoName}`,
      `Email: ${L.privacyEmail}`,
      `Phone: ${L.phone}`,
    ]},
  ]},
];

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`This policy explains what personal data Webalink collects through its platform, why, who sees it, and the choices you have. **We do not sell your data, and we never see your card details or M-Pesa PIN.**`}
      sections={sections}
      other={{ to: '/terms', label: 'Terms and Conditions' }}
    />
  );
}
