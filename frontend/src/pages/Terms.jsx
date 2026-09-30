import React from 'react';
import LegalLayout from '../components/legal/LegalLayout';
import { LEGAL as L } from '../config/legal';

const E = L.legalEntity;

const sections = [
  { id: 'marketplace', title: 'We are a marketplace, not the contractor', body: [
    `${E} ("**Webalink**", "we", "us") runs the Webalink online platform (the "**platform**"), which helps clients find and contact independent technicians and engineers ("**Technicians**"), and helps Technicians find work through bookings and job postings.`,
    `**Webalink does not provide technical services, employ Technicians, or guarantee any work.** Any service contract is directly between the client and the Technician. Technicians are independent contractors, not employees, agents or partners of Webalink.`,
    `We do not control or guarantee the quality, safety, legality, timing or price of services, or the accuracy of what users post.`,
    ...(L.formerName ? [`Webalink was previously known as **${L.formerName}**. Any reference to ${L.formerName} on the site, in the app or in past messages means Webalink, and these Terms apply to it.`] : []),
  ]},
  { id: 'accounts', title: 'Eligibility and accounts', body: [
    { ul: [
      `You must be **18 or older**, able to enter contracts in Kenya, and give accurate information.`,
      `One person, one account. You are responsible for everything done through your account and for keeping your password safe. Tell us at once if someone else gains access.`,
      `We may verify your information, ask for documents, and refuse, suspend or close accounts that break these Terms or that we reasonably believe are fraudulent or unsafe.`,
    ]},
  ]},
  { id: 'bookings', title: 'How bookings work', body: [
    { ol: [
      `A client sends a booking request describing the service, date, time and location. The Technician can accept, decline, or reply with a quotation.`,
      `A booking exists once the Technician accepts, and, where a quotation is used, once the client accepts it. A quotation can include **labour** and **materials**.`,
      `**Materials.** If a client gives the Technician money for materials, the Technician must record it on the platform and provide receipts on request. Webalink does not hold or handle materials money and is not liable for money a client hands to a Technician.`,
      `**Completion.** When a Technician marks the work complete, the client should check it and confirm or raise an issue promptly. Confirming and rating closes the booking.`,
      `Status changes (confirmed, in progress, completed, cancelled) are recorded and may be used as evidence in a dispute.`,
    ]},
  ]},
  { id: 'payments', title: 'Payments', body: [
    { ul: [
      `**Service payments** are made directly between client and Technician by the methods the Technician offers (cash, M-Pesa, card, bank transfer). Unless the platform clearly says otherwise for a particular transaction, Webalink is not a party to service payments and does not hold them.`,
      `Payments made through the platform, such as Technician subscriptions and commissions, are processed by **Paystack** (card) and **Safaricom M-Pesa**. Their terms also apply. We never see or store card details or M-Pesa PINs.`,
      `Prices are in **Kenya Shillings (KES)**. Prices shown by Technicians are estimates until a quotation is accepted.`,
      `Keep your receipts. Technicians must give clients a receipt for money received.`,
    ]},
  ]},
  { id: 'cancellations', title: 'Cancellations and refunds', body: [
    { ul: [
      `**Client cancellation.** A client can cancel before the Technician starts work. Cancelling more than ${L.cancelWindow} before the scheduled time is free. After that, the Technician may charge a reasonable fee of up to ${L.cancelFee}.`,
      `**Technician cancellation.** Cancel as early as you can and give a reason. Repeated late cancellations or no-shows can lead to warnings, reduced visibility or suspension.`,
      `**Refunds for services** are agreed between client and Technician. If you cannot agree, use the dispute process in section 10. Webalink is not obliged to refund service payments it never received.`,
      `Platform fees (subscriptions and commission) are covered by the Technician Terms below.`,
    ]},
  ]},
  { id: 'reviews', title: 'Reviews and ratings', body: [
    { ul: [
      `Reviews must be honest, based on real experience, and free from defamation, hate, other people's personal data, and irrelevant content. Reviews are limited to 500 characters.`,
      `You can only review completed bookings you took part in. We may remove reviews that break these Terms. We do not edit reviews, and we are not required to remove a review just because it is unfavourable.`,
      `You give us a licence to display your reviews on the platform.`,
    ]},
  ]},
  { id: 'jobs', title: 'Job postings and applications', body: [
    `Clients can post jobs and Technicians can apply. Our admins may approve or reject jobs before they appear. Approval is **not** an endorsement of the client, a verification, or a promise of payment.`,
    `Job posts and applications must be genuine, lawful and accurate. No fake jobs, misleading rates, or charging fees for "access" to jobs.`,
  ]},
  { id: 'content', title: 'Your content', body: [
    { ul: [
      `You keep ownership of what you upload (photos, portfolios, descriptions, messages). You give ${E} a **non-exclusive, worldwide, royalty-free licence** to host, display and reproduce it on the platform and in promoting the platform, for as long as it is on the platform plus a reasonable period for backups.`,
      `You confirm you have the rights to everything you upload, including **your client's consent** to show their name, home or photo in a portfolio, and that it does not infringe anyone's rights.`,
      `Do not upload other people's personal data (for example a third party's ID) unless it is strictly necessary and lawful.`,
    ]},
  ]},
  { id: 'conduct', title: 'Acceptable use', body: [
    `You must not:`,
    { ul: [
      `give false identity, qualifications, licences or reviews, or impersonate anyone;`,
      `harass, threaten, discriminate against or defraud anyone;`,
      `use the platform for illegal work, or work you are not licensed to do;`,
      `scrape, hack, probe, overload, reverse-engineer or interfere with the platform, which may also be an offence under the Computer Misuse and Cybercrimes Act, 2018;`,
      `send spam, phishing or unsolicited promotions through chat or contact features;`,
      `upload malware, or unlawful, obscene or hateful content;`,
      `bypass the platform to avoid fees owed under the Technician Terms; or`,
      `request or offer unsafe or unlawful work, such as unlicensed electrical or structural work.`,
    ]},
    `We may remove content, suspend or close accounts, and report unlawful conduct to the authorities.`,
  ]},
  { id: 'disputes', title: 'Disputes between users', body: [
    { ol: [
      `Try to resolve the issue directly and quickly through platform chat.`,
      `If that fails, either side can send a dispute to ${L.disputeEmail} within ${L.disputeDays} days of completion or cancellation, with evidence (messages, photos, receipts). We may review platform records, ask for more information, and then give a **non-binding recommendation** and/or take action on accounts (warnings, suspension, review removal).`,
      `We are not an arbitrator or an insurer and cannot guarantee an outcome. You remain free to use mediation, the Small Claims Court or other Kenyan courts.`,
    ]},
  ]},
  { id: 'safety', title: 'Safety, licences and your own judgement', body: [
    { ul: [
      `**Technicians** must hold every licence, registration and insurance the law requires for the work they offer. Examples: registration with the **Engineers Board of Kenya** for engineering practice, and **EPRA licences** for electrical and solar work, plus any others that apply to their trade. They must work safely and lawfully.`,
      `A **"Verified" badge** means we reviewed documents the Technician supplied at one point in time. It is **not** a guarantee of competence, current licensing, a background check, or the result of any work.`,
      `**Clients** should use their own judgement: check credentials, ask for quotes and references, agree the scope in writing, and be careful with large advance payments. For regulated or high-risk work (electrical, structural, gas, solar, roofing) confirm the licences and permits needed.`,
      `If you feel unsafe, stop work or leave, and contact the police and us.`,
    ]},
  ]},
  { id: 'disclaimers', title: 'Disclaimers', body: [
    `The platform is provided "as is" and "as available". To the fullest extent the law allows, we exclude all warranties, including fitness for a particular purpose, uninterrupted or error-free operation, and the accuracy of user content.`,
    `We are not responsible for the acts, omissions, work quality, damage, injury or loss caused by any Technician, client or other user.`,
  ]},
  { id: 'liability', title: 'Limit of liability', body: [
    { ul: [
      `To the fullest extent Kenyan law permits, Webalink and its directors, staff and partners are not liable for indirect or consequential loss, loss of profit, revenue, data or goodwill, or for loss arising from services performed by Technicians.`,
      `Our total liability to you for any claim about the platform is limited to the **greater of** the fees you paid us in the 12 months before the claim, **and** ${L.liabilityFloor}.`,
      `Nothing here limits liability that cannot be limited by law, for example for fraud, or for death or personal injury caused by our negligence, or your rights under the Consumer Protection Act, 2012.`,
    ]},
  ]},
  { id: 'indemnity', title: 'Indemnity', body: [
    `You agree to cover Webalink against claims, losses and reasonable legal costs arising from your breach of these Terms, your content, or your dealings with other users, except to the extent caused by our own wrongdoing.`,
  ]},
  { id: 'termination', title: 'Suspension and closing accounts', body: [
    `You can close your account at any time. Outstanding fees and bookings must still be settled or completed.`,
    `We may suspend or close an account for breach, fraud, non-payment, safety concerns, legal requirements or long inactivity, with notice where practical.`,
    `Sections that by nature should continue (content licence, payment obligations, disclaimers, liability, indemnity, disputes, governing law) survive closure.`,
  ]},
  { id: 'ip', title: 'Our intellectual property', body: [
    `The platform, the Webalink name and logo, the design and the software belong to ${E} or its licensors. Do not copy or use them except as these Terms allow. Report infringement to ${L.legalEmail}.`,
  ]},
  { id: 'changes', title: 'Changes to the platform and these Terms', body: [
    `We may change the platform and these Terms. We will give at least ${L.noticeDays} notice of material changes by email or in the app. If you keep using the platform after the effective date, you accept the changes. If you disagree, close your account before then.`,
  ]},
  { id: 'notices', title: 'Notices', body: [
    `We may give notice by email, in-app message or on the platform. You can reach us at ${L.legalEmail} or ${L.address}.`,
  ]},
  { id: 'general', title: 'General', body: [
    { ul: [
      `**Whole agreement.** These Terms, the Privacy Policy and (for Technicians) the Technician Terms are the full agreement between you and us about the platform.`,
      `**Severability.** If a provision is invalid, the rest stays in force.`,
      `**No waiver.** Not enforcing a right does not give it up.`,
      `**Assignment.** You cannot transfer your rights. We may transfer ours in a business sale or restructuring.`,
      `**Events beyond our control** (telecom or payment network outages, disasters, government action) do not make us liable.`,
    ]},
  ]},
  { id: 'law', title: 'Governing law', body: [
    `These Terms are governed by the **laws of Kenya**. For disputes with Webalink, we will first try good-faith negotiation, then **mediation** in ${L.mediationCity}, and if that fails the **courts of Kenya**. Consumers keep any rights they have under the Consumer Protection Act, 2012.`,
  ]},

  // ───────────── Technician Terms ─────────────
  { id: 'technician-terms', divider: 'Technician Terms', prefix: 'T',
    intro: `These terms apply in addition to the Terms above to everyone who registers a Technician profile. If the two conflict on Technician matters, these Technician Terms win.` },

  { id: 't-status', title: 'Independent professional', body: [
    `You are an independent contractor and are solely responsible for your work, tools, staff, insurance, taxes and legal compliance. Nothing here creates employment, agency, partnership or a joint venture with Webalink.`,
    `You are responsible for your own income tax, VAT (if applicable), statutory contributions, and for issuing receipts or tax invoices to clients as the law requires.`,
  ]},
  { id: 't-verify', title: 'Registration and verification', body: [
    { ul: [
      `You confirm everything in your profile (identity, skills, education, experience, certifications, portfolio) is **true and not misleading**, and that you own or may use everything in your portfolio.`,
      `Upload the documents we reasonably ask for (for example national ID, professional registration, trade licence, EPRA licence, certificates). You agree we may review them and **contact the issuing body to confirm they are genuine**, for verification only.`,
      `Keep your licences current. Update your profile if one lapses, is suspended or withdrawn. We may hide or suspend your profile if you no longer meet requirements.`,
      `Verification is a point-in-time check and can be changed or removed at any time.`,
    ]},
  ]},
  { id: 't-standards', title: 'Service standards', body: [
    `Work with reasonable skill and care. Follow the law, safety standards and required permits. Reply to bookings promptly and keep appointments. Be honest about price, timing and materials. Carry the insurance your work needs. Treat clients with respect. Do not hand work to unqualified people or misrepresent who is doing it.`,
  ]},
  { id: 't-fees', title: 'Subscriptions and commission', body: [
    { ul: [
      `**Subscription plans.** To appear in search you need an active plan. Plans differ by **visibility radius**, price (in KES, billed monthly) and features, as shown in the app when you buy. The plan details and prices shown in the app at purchase are the ones that apply.`,
      `**Expiry.** When your plan or free trial ends, **your profile stops appearing in search** until you renew. Bookings already made continue.`,
      `**Renewal and refunds.** ${L.autoRenew}. Subscription fees are non-refundable except where the law requires or where we end the service for our own reasons. We send reminders before a plan expires.`,
      `**Commission.** For each booking completed through the platform you owe Webalink **${L.commissionRate} of ${L.commissionBase}**, **whether the client paid you in cash, M-Pesa or any other way**. It is recorded per booking and becomes payable when the booking is completed.`,
      `**Paying commission.** Pay in the app by **card (Paystack) or M-Pesa STK Push**. You may be asked to settle all outstanding commission together. If it stays unpaid for more than ${L.commissionOverdue} we may reduce your visibility, restrict new bookings, suspend your account and recover the amount.`,
      `**Tax.** Fees are ${L.vatNote}.`,
      `**Changes.** We may change fees with ${L.feeChangeNotice} notice. Changes do not affect bookings already accepted.`,
    ]},
  ]},
  { id: 't-circumvent', title: 'No going around the platform', body: [
    `Do not use the platform to find a client and then move the job off the platform to avoid commission, for ${L.circumventPeriod} after first contact through the platform. We may check booking, chat and payment records to enforce this. A breach can lead to recovery of the commission owed, an additional charge of ${L.circumventPenalty}, and suspension.`,
  ]},
  { id: 't-data', title: 'Client data you receive', body: [
    `You receive a client's name, phone, address and job details **only to carry out the booked service**. You must:`,
    { ul: [
      `use it for that purpose only, and keep it secure;`,
      `not sell it, share it, or use it for marketing without the client's consent;`,
      `delete it when you no longer need it (subject to tax and legal record-keeping); and`,
      `comply with the **Data Protection Act, 2019**. For the data you receive, you are an independent data controller.`,
    ]},
    `If you suffer a data breach involving clients from the platform, tell us within ${L.breachReportHours}.`,
  ]},
  { id: 't-portfolio', title: 'Portfolio and client consent', body: [
    `Get written or recorded consent before showing a client's name, home interior, address, face or identifiable property in your portfolio. You are responsible for any claim from a client or third party about your uploads.`,
  ]},
  { id: 't-reviews', title: 'Reviews', body: [
    `Do not offer incentives for reviews, review yourself, pressure clients, or retaliate against clients for honest reviews. We may adjust or hide ratings to reflect fraud or manipulation.`,
  ]},
  { id: 't-liability', title: 'Your liability', body: [
    `You are **solely liable** to clients for your work, including defects, damage, injury, delays and breach of contract, and you indemnify Webalink against related claims as set out in section 14.`,
  ]},
  { id: 't-suspend', title: 'Suspension and removal', body: [
    `We may suspend or remove your profile for false information, unlicensed work, safety issues, fraud, serious or repeated complaints, unpaid fees or breach of these terms. If you delete your account, your data is handled as described in the Privacy Policy, and any commission you owe remains payable.`,
  ]},
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      intro={`**By creating an account or using the Webalink platform, you agree to these Terms, our Privacy Policy and, if you are a Technician, the Technician Terms at the end of this page.** If you do not agree, please do not use the platform.`}
      sections={sections}
      other={{ to: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
