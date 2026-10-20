import React from 'react';
import LegalLayout from '../components/legal/LegalLayout';
import { LEGAL as L } from '../config/legal';

const E = L.legalEntity;

const sections = [
  { id: 'marketplace', title: 'We are a marketplace, not the contractor', body: [
    `${E} ("**Webafix**", "we", "us"), a company registered in Kenya (registration number ${L.registrationNo}, KRA PIN ${L.kraPin}), runs the Webafix online platform (the "**platform**"), which helps clients find and contact independent technicians and engineers ("**Technicians**"), helps Technicians find work through bookings and job postings, and lets people list places to stay, rent or work from in **Stays & Spaces**.`,
    `**Webafix does not provide technical services, employ Technicians, or guarantee any work.** Any service contract is directly between the client and the Technician. Technicians are independent contractors, not employees, agents or partners of Webafix.`,
    `**Webafix does not own, inspect, manage or rent out any place listed in Stays & Spaces.** Any stay, tenancy or lease is directly between the guest or tenant and the person who listed the place.`,
    `We do not control or guarantee the quality, safety, legality, timing or price of services, or the accuracy of what users post.`,
    ...(L.formerName ? [`Webafix was previously known as **${L.formerName}**. Any reference to ${L.formerName} on the site, in the app or in past messages means Webafix, and these Terms apply to it.`] : []),
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
      `**Booking.** A client sends a booking request describing the service, date, time and location.`,
      `**Quotation.** The Technician replies with a quotation: **one total price for the whole job**, including any materials. They may attach a written quotation.`,
      `**Acceptance.** The client accepts or rejects the quotation. Accepting it creates the service contract between the client and the Technician, and the Technician can start the work. Rejecting it ends the booking. Either side can cancel on the platform until the quotation is accepted.`,
      `**Completion.** When the work is finished **and the client has paid in full**, the Technician marks it complete. To do so they must add proof: photos of the finished work taken through the platform at the job (which record the time and the device's location), or a live link for digital work. They also confirm the amount they were paid.`,
      `**Confirmation and rating.** The client checks the proof, then confirms the work and rates the Technician. This closes the booking. If something is wrong, the client should report a problem on the platform instead; the Technician can add more proof and our team may review it.`,
      `Quotations, status changes, proof of work, confirmed payments and ratings are recorded and may be used as evidence in a dispute.`,
    ]},
  ]},
  { id: 'payments', title: 'Payments', body: [
    { ul: [
      `**Webafix does not hold, receive or pass on money for services.** Clients pay Technicians directly, by the methods the Technician offers (cash, M-Pesa, card, bank transfer). Webafix is not a party to these payments, so it cannot refund them. Any refund, deposit or money for materials is agreed between the client and the Technician.`,
      `**Webafix does not take bookings, rent, deposits or any other payment for places in Stays & Spaces.** Guests and tenants pay the lister directly.`,
      `The only payments made through the platform are **Technician subscriptions** and **Stays & Spaces listing fees**. They are processed by **Paystack** (card) and **Safaricom M-Pesa**. Their terms also apply. We never see or store card details or M-Pesa PINs.`,
      `Prices are in **Kenya Shillings (KES)**. Prices shown by Technicians are estimates until a quotation is accepted.`,
      `Keep your receipts. Technicians must give clients a receipt for money received.`,
    ]},
  ]},
  { id: 'reviews', title: 'Reviews and ratings', body: [
    { ul: [
      `Reviews must be honest, based on real experience, and free from defamation, hate, other people's personal data, and irrelevant content. Reviews are limited to 500 characters.`,
      `Only the client on a booking can rate it, once the Technician has marked the work complete. **Rating a booking confirms the work was done.**`,
      `To protect against fake ratings, if a Technician receives more ratings in a short time than a real job allows, the extra ratings are checked by our team before they count. We may hold or remove ratings that look manipulated.`,
      `We may remove reviews that break these Terms. We do not edit reviews, and we are not required to remove a review just because it is unfavourable.`,
      `You give us a licence to display your reviews on the platform.`,
    ]},
  ]},
  { id: 'jobs', title: 'Job postings and applications', body: [
    `Clients can post jobs and Technicians can apply. Our admins may approve or reject jobs before they appear. Approval is **not** an endorsement of the client, a verification, or a promise of payment.`,
    `Job posts and applications must be genuine, lawful and accurate. No fake jobs, misleading rates, or charging fees for "access" to jobs.`,
  ]},
  { id: 'stays', title: 'Stays & Spaces', body: [
    `Any signed-in user can list a place in Stays & Spaces, such as an Airbnb, guest house, hotel, hostel, house for rent, office, shop or entertainment venue. The person listing it (the "**lister**") may be the owner, an agent, a property manager or a host.`,
    { ul: [
      `**Contact is direct.** Guests and tenants contact the lister by phone or WhatsApp. Webafix does not take bookings or payments for places and is not a party to any stay, tenancy or lease.`,
      `**Listers** must have the right to list the place (as owner, or with the owner's authority) and must give accurate details: real photos of that place, the actual price and any deposit, the location and what is included. Keep the listing up to date and pause it when the place is not available. You are responsible for any licences, permits, taxes and laws that apply to letting the place.`,
      `**Review.** Our team reviews each listing, and each change to it, before it appears. Approval is **not** a check of ownership, condition, safety or legality, and not an endorsement of the lister.`,
      `**What others see.** The lister's contact phone is shown only to signed-in users. Other users see an approximate area, not the exact map pin.`,
      `**Guests and tenants** should use their own judgement: view the place before paying, confirm the lister's identity and right to let it, get a written agreement and receipts, and be wary of anyone who asks for money before a viewing.`,
      `We may refuse, hide or remove listings that are fake, misleading, duplicated, unsafe, unlawful or reported by users, and suspend the lister's account.`,
    ]},
    `**Listing fees.** A lister's first listing starts their **${L.listingFreeMonths} free months**. During that time up to **${L.listingFreeCount} listings** are free. Other listings, and all listings after the free months, cost **${L.listingFee} per listing per month**, as shown in the app when you pay. Each payment keeps that listing in search for one more month. We send reminders before a listing's time runs out. An unpaid listing stays saved but is hidden from search, and can't be edited, until it is paid for. Listing fees are non-refundable, except where the law requires a refund or we end the service for our own reasons.`,
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
      `submit fake, edited or reused proof-of-work photos, or mark work as complete or paid when it is not;`,
      `post fake listings, list a place you have no right to let, or ask for money for a place that does not exist or is not available;`,
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
      `To the fullest extent Kenyan law permits, Webafix and its directors, staff and partners are not liable for indirect or consequential loss, loss of profit, revenue, data or goodwill, or for loss arising from services performed by Technicians.`,
      `Our total liability to you for any claim about the platform is limited to the **greater of** the fees you paid us in the 12 months before the claim, **and** ${L.liabilityFloor}.`,
      `Nothing here limits liability that cannot be limited by law, for example for fraud, or for death or personal injury caused by our negligence, or your rights under the Consumer Protection Act, 2012.`,
    ]},
  ]},
  { id: 'indemnity', title: 'Indemnity', body: [
    `You agree to cover Webafix against claims, losses and reasonable legal costs arising from your breach of these Terms, your content, or your dealings with other users, except to the extent caused by our own wrongdoing.`,
  ]},
  { id: 'termination', title: 'Suspension and closing accounts', body: [
    `You can close your account at any time. Outstanding fees and bookings must still be settled or completed.`,
    `We may suspend or close an account for breach, fraud, non-payment, safety concerns, legal requirements or long inactivity, with notice where practical.`,
    `Sections that by nature should continue (content licence, payment obligations, disclaimers, liability, indemnity, disputes, governing law) survive closure.`,
  ]},
  { id: 'ip', title: 'Our intellectual property', body: [
    `The platform, the Webafix name and logo, the design and the software belong to ${E} or its licensors. Do not copy or use them except as these Terms allow. Report infringement to ${L.legalEmail}.`,
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
    `These Terms are governed by the **laws of Kenya**. For disputes with Webafix, we will first try good-faith negotiation, then **mediation** in ${L.mediationCity}, and if that fails the **courts of Kenya**. Consumers keep any rights they have under the Consumer Protection Act, 2012.`,
  ]},

  // ───────────── Technician Terms ─────────────
  { id: 'technician-terms', divider: 'Technician Terms', prefix: 'T',
    intro: `These terms apply in addition to the Terms above to everyone who registers a Technician profile. If the two conflict on Technician matters, these Technician Terms win.` },

  { id: 't-status', title: 'Independent professional', body: [
    `You are an independent contractor and are solely responsible for your work, tools, staff, insurance, taxes and legal compliance. Nothing here creates employment, agency, partnership or a joint venture with Webafix.`,
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
    `Work with reasonable skill and care. Follow the law, safety standards and required permits. Reply to bookings promptly and keep appointments. Be honest about price, timing and materials, and include everything in your quoted price. Carry the insurance your work needs. Treat clients with respect. Do not hand work to unqualified people or misrepresent who is doing it.`,
    `Mark a job complete only when the work is finished and you have been paid in full. Proof-of-work photos must be genuine photos of that job, taken at the job location. Repeated late cancellations, no-shows or false completions can lead to warnings, reduced visibility or suspension.`,
  ]},
  { id: 't-fees', title: 'Subscriptions', body: [
    { ul: [
      `**Free trial.** New Technicians get a **${L.trialDays}-day free trial** with a ${L.trialRadius} visibility radius.`,
      `**Free plan.** After a trial or plan ends you stay on the **Free plan** at no cost, visible to clients within ${L.trialRadius}.`,
      `**Paid plans** let clients further away find you. Plans differ by **visibility radius**, price (in KES) and features. The plan details and prices shown in the app when you pay are the ones that apply. Your first month on a paid plan can be taken free, **once**, whichever plan you choose.`,
      `**Paying and plan length.** You pay by card (Paystack) or M-Pesa. Each payment adds **30 days**. If you pay before your plan or free trial ends, the 30 days are added to the time you have left, so you never lose days. If you pay after it has ended, the 30 days start on the day the payment is confirmed. The plan you pay for applies from the day you pay.`,
      `**No automatic renewal.** Plans do not renew or charge you automatically. We send reminders ${L.reminderDays} before your plan ends.`,
      `**Expiry.** When a paid plan, free month or free trial ends, you move to the Free plan and clients further than ${L.trialRadius} away stop seeing you until you pay again. Bookings already made continue.`,
      `**Refunds.** Subscription fees are non-refundable, except where the law requires a refund or we end the service for our own reasons.`,
      `**Tax.** Fees are ${L.vatNote}.`,
      `**Changes.** We may change fees with ${L.feeChangeNotice} notice. Changes do not affect bookings already accepted.`,
    ]},
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
    `You are **solely liable** to clients for your work, including defects, damage, injury, delays and breach of contract, and you indemnify Webafix against related claims as set out under "Indemnity" above.`,
  ]},
  { id: 't-suspend', title: 'Suspension and removal', body: [
    `We may suspend or remove your profile for false information, unlicensed work, safety issues, fraud, serious or repeated complaints, unpaid fees or breach of these terms. If you delete your account, your data is handled as described in the Privacy Policy, and any fees you owe remain payable.`,
  ]},
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      intro={`**By creating an account or using the Webafix platform, you agree to these Terms, our Privacy Policy and, if you are a Technician, the Technician Terms at the end of this page.** If you do not agree, please do not use the platform.`}
      sections={sections}
      other={{ to: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
