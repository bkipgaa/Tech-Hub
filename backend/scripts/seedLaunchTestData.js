/**
 * seedLaunchTestData.js
 * =====================
 * Pre-launch test data. DELETES all experts, clients and their activity,
 * then creates a full test set around 13 locations (Malindi, Watamu,
 * Matsangoni, Kilifi, Mombasa, Nairobi):
 *
 *   - 26 experts: 2 per location, 26 different categories, different
 *     ratings, completed jobs and subscription plans
 *   - 13 clients: one per location; each owns the stays at their
 *     location and posts jobs there
 *   - 50+ Stays & Spaces listings: at least a hotel, an Airbnb and an
 *     office at every location, plus guest houses, rentals, hostels, shops
 *     and entertainment. A few are left waiting for review / unpaid so the
 *     admin and payment flows can be tested.
 *   - jobs: approved (catalog and typed categories) and pending ones
 *
 * Kept: the service catalog, admin logins, roles and permissions, activity logs.
 * Deleted: users with role client / technician / user, expert profiles,
 *   listings, bookings, jobs, job applications, conversations, messages,
 *   booking evidence hashes.
 *
 * Every test account uses one password and a Gmail-style alias of
 * --email (name+tag@domain), so their notification emails reach that inbox.
 *
 * Usage (from backend/):
 *   node scripts/seedLaunchTestData.js --email=you@gmail.com --confirm-db=tech-hub
 *        → dry run: shows what would be deleted and created
 *   node scripts/seedLaunchTestData.js --email=you@gmail.com --confirm-db=tech-hub --apply --backup-dir=../../tech-hub-backups
 *        → writes a backup (EJSON) of everything it deletes, then resets and seeds,
 *          and saves the test logins to <backup-dir>/<stamp>/test-accounts.txt
 *
 * MONGODB_URI comes from .env (or the environment). --confirm-db must match
 * the connected database's name, so it can't run against the wrong one.
 */

require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const User = require('../models/User');
const Technician = require('../models/Technician');
const Listing = require('../models/Listing');
const Job = require('../models/Job');
const ServiceCatalog = require('../models/ServiceCatalog');
const { subscriptionPlans } = require('../utils/subscriptionPlans');
const { FREE_MONTHS, addMonths } = require('../utils/listingPlan');
const { priceUnitFor, groupFor } = require('../utils/listingCategories');

// ─── Arguments ────────────────────────────────────────────────
const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const APPLY = process.argv.includes('--apply');
const EMAIL = arg('email');
const CONFIRM_DB = arg('confirm-db');
const BACKUP_DIR = arg('backup-dir');

const die = (msg) => { console.error(`\n❌ ${msg}\n`); process.exit(1); };
if (!EMAIL || !/^[^@\s+]+@[^@\s]+\.[^@\s]+$/.test(EMAIL)) die('Pass --email=you@example.com (no "+" in it): test accounts use aliases of it.');
if (!CONFIRM_DB) die('Pass --confirm-db=<database name> to confirm which database to reset.');
if (APPLY && !BACKUP_DIR) die('Pass --backup-dir=<folder> with --apply: a backup is written before anything is deleted.');

const [LOCAL, DOMAIN] = EMAIL.split('@');
const alias = (tag) => `${LOCAL}+${tag}@${DOMAIN}`;

// ─── The 13 locations ─────────────────────────────────────────
const LOCATIONS = [
  { key: 'mayungu', label: 'Mayungu Public Beach', lat: -3.2292073, lng: 40.0073959, county: 'Kilifi', town: 'Malindi', estate: 'Mayungu' },
  { key: 'ganda', label: 'Ganda', lat: -3.2179448, lng: 40.0636143, county: 'Kilifi', town: 'Malindi', estate: 'Ganda' },
  { key: 'mwembe', label: 'Mwembe Resort', lat: -3.2216106, lng: 40.0253402, county: 'Kilifi', town: 'Malindi', estate: 'Mwembe' },
  { key: 'watamu', label: 'Watamu Marine National Park', lat: -3.3470321, lng: 39.9519479, county: 'Kilifi', town: 'Watamu', estate: 'Marine Park' },
  { key: 'matsangoni', label: 'Matsangoni', lat: -3.3868146, lng: 39.9164842, county: 'Kilifi', town: 'Matsangoni', estate: '' },
  { key: 'kilifi-town', label: 'Kilifi Town', lat: -3.5369119, lng: 39.7318169, county: 'Kilifi', town: 'Kilifi', estate: 'Kilifi Town' },
  { key: 'mnarani', label: 'Kilifi, Mnarani', lat: -3.5551419, lng: 39.7779875, county: 'Kilifi', town: 'Kilifi', estate: 'Mnarani' },
  { key: 'mama-ngina', label: 'Mama Ngina Waterfront', lat: -4.0350133, lng: 39.5838597, county: 'Mombasa', town: 'Mombasa', estate: 'Mama Ngina' },
  { key: 'mombasa-island', label: 'Mombasa Island', lat: -4.0350133, lng: 39.5838597, county: 'Mombasa', town: 'Mombasa', estate: 'Mombasa Island' },
  { key: 'nyali', label: 'Mombasa, Nyali', lat: -4.0208216, lng: 39.6819091, county: 'Mombasa', town: 'Mombasa', estate: 'Nyali' },
  { key: 'donholm', label: 'Donholm', lat: -1.2947215, lng: 36.8759083, county: 'Nairobi', town: 'Nairobi', estate: 'Donholm' },
  { key: 'greenspan', label: 'Greenspan Shopping Mall', lat: -1.2947215, lng: 36.8759083, county: 'Nairobi', town: 'Nairobi', estate: 'Greenspan' },
  { key: 'buruburu', label: 'Buru-Buru Phase 2', lat: -1.282561, lng: 36.8686197, county: 'Nairobi', town: 'Nairobi', estate: 'Buru Buru Phase 2' },
];

// ─── 26 experts: 2 per location, different categories and track records ──
// [location, first, last, mainCategory, rating, reviews, completedJobs, plan, hourlyRate, years]
const EXPERTS = [
  ['mayungu', 'Amina', 'Bakari', 'Cleaning Services', 4.9, 58, 74, 'premium', 900, 7],
  ['mayungu', 'Kazungu', 'Charo', 'Catering & Chefs', 3.7, 9, 11, 'trial', 1500, 3],
  ['ganda', 'Baraka', 'Kahindi', 'Plumbing', 4.3, 26, 41, 'basic', 1200, 5],
  ['ganda', 'Rehema', 'Mwende', 'Gardening & Landscaping', 4.8, 44, 66, 'business', 800, 9],
  ['mwembe', 'Omar', 'Said', 'Electrical Services', 4.6, 71, 102, 'enterprise', 1800, 12],
  ['mwembe', 'Zawadi', 'Kenga', 'Hairdressing & Beauty', 3.9, 14, 19, 'basicPlus', 700, 4],
  ['watamu', 'Lucas', 'Fondo', 'Photography & Videography', 5.0, 33, 38, 'premium', 3500, 6],
  ['watamu', 'Fatuma', 'Ali', 'Event Planning', 4.1, 12, 15, 'trial', 2500, 3],
  ['matsangoni', 'Juma', 'Ngala', 'Water & Borehole Services', 4.4, 19, 27, 'basicPlus', 2200, 10],
  ['matsangoni', 'Neema', 'Kadzo', 'Solar & Renewable Energy', 4.7, 37, 52, 'business', 2000, 8],
  ['kilifi-town', 'Brian', 'Mwangi', 'IT & Networking', 4.5, 49, 63, 'unlimited', 2500, 9],
  ['kilifi-town', 'Esther', 'Kombe', 'Tutoring & Training', 3.5, 7, 9, 'basic', 1000, 2],
  ['mnarani', 'Hamisi', 'Tsuma', 'Carpentry & Furniture', 4.8, 82, 120, 'enterprise', 1500, 15],
  ['mnarani', 'Grace', 'Nzai', 'Painting & Decorating', 4.0, 16, 24, 'trial', 900, 4],
  ['mama-ngina', 'Salim', 'Hassan', 'Automotive Repair', 4.6, 95, 140, 'unlimited', 2000, 14],
  ['mama-ngina', 'Mercy', 'Akinyi', 'Moving & Logistics', 3.8, 11, 18, 'basicPlus', 1800, 5],
  ['mombasa-island', 'Abdul', 'Rashid', 'Tailoring & Fashion', 4.9, 64, 90, 'premium', 800, 11],
  ['mombasa-island', 'Joy', 'Wanjiru', 'Phone & Electronics Repair', 4.2, 23, 31, 'basic', 1000, 4],
  ['nyali', 'Peter', 'Otieno', 'HVAC Services', 4.4, 29, 45, 'business', 2500, 8],
  ['nyali', 'Halima', 'Juma', 'Pest Control & Fumigation', 3.6, 8, 10, 'trial', 1600, 2],
  ['donholm', 'Kevin', 'Kamau', 'Appliance Repair', 4.7, 53, 79, 'premium', 1300, 10],
  ['donholm', 'Purity', 'Njeri', 'Welding & Fabrication', 4.0, 13, 22, 'basic', 1400, 6],
  ['greenspan', 'Dennis', 'Ochieng', 'Digital Marketing & Design', 4.5, 31, 40, 'enterprise', 3000, 7],
  ['greenspan', 'Lilian', 'Wambui', 'Health & Wellness', 4.9, 47, 58, 'basicPlus', 2000, 9],
  ['buruburu', 'Samuel', 'Mutua', 'Construction & Renovation', 4.3, 38, 57, 'unlimited', 2200, 13],
  ['buruburu', 'Catherine', 'Atieno', 'Domestic & Care Services', 3.9, 17, 26, 'trial', 700, 5],
];

// ─── 13 clients: one per location ─────────────────────────────
const CLIENTS = [
  ['mayungu', 'Rose', 'Kalama'], ['ganda', 'Hassan', 'Mohamed'], ['mwembe', 'Diana', 'Chome'],
  ['watamu', 'Paolo', 'Rossi'], ['matsangoni', 'Mwanaisha', 'Nyale'], ['kilifi-town', 'Victor', 'Baya'],
  ['mnarani', 'Agnes', 'Mramba'], ['mama-ngina', 'Yusuf', 'Abdalla'], ['mombasa-island', 'Sarah', 'Achieng'],
  ['nyali', 'Michael', 'Kariuki'], ['donholm', 'Ann', 'Wairimu'], ['greenspan', 'James', 'Ndungu'],
  ['buruburu', 'Lucy', 'Muthoni'],
];

// ─── Listings: hotel + Airbnb + office everywhere, plus extras ──
// [category, title, price, extra fields]
const COMMON = (loc) => [
  ['hotel', `${loc.estate || loc.town} Bay Hotel`, 8500, { maxGuests: 2, amenities: ['wifi', 'parking', 'pool', 'breakfast', 'air_conditioning', 'security'] }],
  ['airbnb', `Cosy 1-bedroom Airbnb, ${loc.estate || loc.town}`, 4500, { propertyType: '1br', bedrooms: 1, bathrooms: 1, maxGuests: 2, amenities: ['wifi', 'kitchen', 'hot_shower', 'tv', 'backup_power'] }],
  ['office', `Serviced office space, ${loc.estate || loc.town}`, 35000, { sizeSqft: 450, deposit: 35000, amenities: ['wifi', 'conference_room', 'backup_power', 'parking', 'security'] }],
];
const EXTRAS = {
  mayungu: [['club', 'Mayungu Beach Club', 500, { openingHours: 'Fri–Sun, 6pm–3am', amenities: ['dj', 'dance_floor', 'outdoor_seating', 'food'] }]],
  ganda: [['guest_house', 'Ganda Village Guest House', 2800, { maxGuests: 4, amenities: ['breakfast', 'garden', 'parking'] }]],
  mwembe: [['bar', 'Mwembe Sports Bar & Grill', 0, { openingHours: 'Daily, 11am–1am', amenities: ['sports_screens', 'food', 'card_payments'] }]],
  watamu: [
    ['guest_house', 'Watamu Coral Guest House', 5200, { maxGuests: 6, amenities: ['breakfast', 'pool', 'garden', 'wifi'] }],
    ['live_music', 'Watamu Live Music Lounge', 300, { openingHours: 'Thu–Sat, 7pm–1am', amenities: ['live_music', 'food', 'outdoor_seating'] }],
  ],
  matsangoni: [['house_rent', 'Matsangoni 2-bedroom house to let', 18000, { propertyType: '2br', bedrooms: 2, bathrooms: 1, deposit: 18000, amenities: ['water_24h', 'parking', 'garden'] }]],
  'kilifi-town': [['hostel', 'Kilifi student rooms near Pwani University', 6500, { propertyType: 'room', deposit: 6500, amenities: ['wifi', 'water_24h', 'security', 'laundry'] }]],
  mnarani: [['event_venue', 'Mnarani Creekside Garden Venue', 0, { openingHours: 'Bookings, daily 8am–11pm', amenities: ['outdoor_seating', 'parking', 'food'] }]],
  'mama-ngina': [['casino', 'Waterfront Casino Lounge', 0, { openingHours: '24 hours', amenities: ['vip_area', 'food', 'security', 'card_payments'] }]],
  'mombasa-island': [['shop', 'Shop to let near Fort Jesus', 28000, { sizeSqft: 300, deposit: 56000, amenities: ['security', 'cctv'] }]],
  nyali: [
    ['house_rent', 'Nyali 3-bedroom apartment', 75000, { propertyType: '3br', bedrooms: 3, bathrooms: 2, deposit: 150000, amenities: ['pool', 'lift', 'backup_power', 'water_24h', 'parking', 'security'] }],
    ['gaming', 'Nyali Gaming Arcade', 200, { openingHours: 'Daily, 10am–10pm', amenities: ['air_conditioning', 'food', 'card_payments'] }],
  ],
  donholm: [['house_rent', 'Donholm bedsitter to let', 9000, { propertyType: 'bedsitter', deposit: 9000, amenities: ['water_24h', 'security'] }]],
  greenspan: [['shop', 'Retail space at Greenspan Mall', 55000, { sizeSqft: 600, deposit: 110000, amenities: ['security', 'cctv', 'parking', 'backup_power'] }]],
  buruburu: [['house_rent', 'Buru Buru Phase 2 maisonette', 45000, { propertyType: 'maisonette', bedrooms: 3, bathrooms: 2, deposit: 45000, amenities: ['parking', 'garden', 'water_24h', 'security'] }]],
};
// Listings left for testing other flows
const TEST_STATES = {
  'pending-review': [['nyali', 'airbnb', 'Nyali studio by the beach (waiting for review)', 3800, { propertyType: 'studio', maxGuests: 2 }],
                     ['donholm', 'hostel', 'Donholm shared rooms (waiting for review)', 4500, { propertyType: 'room' }]],
  'unpaid-6th': [['nyali', 'office', 'Nyali co-working desk (6th listing, unpaid)', 12000, { sizeSqft: 80 }]],
};

// ─── Jobs ─────────────────────────────────────────────────────
// [client location, title, mainCategory, serviceCategory|null, budget, status]
const JOBS = [
  ['mayungu', 'Deep clean a 3-bedroom beach house', 'Cleaning Services', null, 6000, 'approved'],
  ['ganda', 'Fix a leaking water tank', 'Plumbing', null, 3500, 'approved'],
  ['watamu', 'Photographer for a beach wedding', 'Photography & Videography', null, 40000, 'approved'],
  ['kilifi-town', 'Set up Wi-Fi in a small office', 'IT & Networking', null, 8000, 'approved'],
  ['mama-ngina', 'Service and repair a Toyota Probox', 'Automotive Repair', null, 12000, 'approved'],
  ['donholm', 'Repair a fridge that stopped cooling', 'Appliance Repair', null, 4000, 'approved'],
  ['buruburu', 'Build a perimeter wall extension', 'Construction & Renovation', null, 150000, 'approved'],
  ['nyali', 'Weekly car wash for two cars', 'Car Wash', 'N/A', 3000, 'approved', true],
  ['mombasa-island', 'Sew 20 school uniforms', 'Tailoring & Fashion', null, 18000, 'pending'],
  ['greenspan', 'Kids birthday party magician', 'Party Entertainment', 'N/A', 7000, 'pending', true],
];

// ─── Helpers ──────────────────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000;
const locByKey = Object.fromEntries(LOCATIONS.map((l) => [l.key, l]));
const pic = (seed) => [{ url: `https://picsum.photos/seed/webafix-${seed}/1200/800` }, { url: `https://picsum.photos/seed/webafix-${seed}-2/1200/800` }];
// Small offsets so pins at one location don't sit exactly on top of each other (≈ 0–350 m)
const OFFSETS = [[0, 0], [0.0012, 0.0009], [-0.0011, 0.0013], [0.0019, -0.0008], [-0.0016, -0.0017], [0.0024, 0.0021], [-0.0026, 0.0006]];
const phone = (n) => `0700 000 ${String(n).padStart(3, '0')}`; // test numbers; don't call them
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const DELETE_USER_ROLES = ['client', 'technician', 'user'];
const RELATED = ['bookings', 'jobs', 'jobapplications', 'conversations', 'messages', 'evidencehashes'];

const main = async () => {
  if (!process.env.MONGODB_URI) die('MONGODB_URI is not set.');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (db.databaseName !== CONFIRM_DB) die(`Connected to "${db.databaseName}", but --confirm-db says "${CONFIRM_DB}". Nothing changed.`);

  // ── What will be deleted ───────────────────────────────────
  const userFilter = { role: { $in: DELETE_USER_ROLES } };
  const counts = {
    users: await db.collection('users').countDocuments(userFilter),
    technicians: await db.collection('technicians').countDocuments(),
    listings: await db.collection('listings').countDocuments(),
  };
  for (const c of RELATED) counts[c] = await db.collection(c).countDocuments().catch(() => 0);
  console.log(`\nDatabase: ${db.databaseName}  (${APPLY ? 'APPLYING' : 'DRY RUN, add --apply to change anything'})`);
  console.log('Will delete:', counts);

  // ── Catalog lookups (categories must exist) ────────────────
  const catalog = await ServiceCatalog.find({ isActive: true }).lean();
  const byMain = Object.fromEntries(catalog.map((c) => [c.mainCategory, c]));
  const missing = EXPERTS.map((e) => e[3]).filter((m) => !byMain[m]);
  if (missing.length) die(`These categories aren't in the catalog: ${missing.join(', ')}`);

  const nListings = LOCATIONS.reduce((n, l) => n + COMMON(l).length + (EXTRAS[l.key] || []).length, 0)
    + Object.values(TEST_STATES).flat().length;
  console.log(`Will create: ${EXPERTS.length} experts, ${CLIENTS.length} clients, ${nListings} listings, ${JOBS.length} jobs`);
  if (!APPLY) { await mongoose.disconnect(); return; }

  // ── Backup ─────────────────────────────────────────────────
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.resolve(BACKUP_DIR, `${db.databaseName}-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const dump = async (name, filter = {}) => {
    const docs = await db.collection(name).find(filter).toArray();
    fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, null, 1, { relaxed: false }));
    return docs.length;
  };
  const backedUp = { users: await dump('users', userFilter), technicians: await dump('technicians'), listings: await dump('listings') };
  for (const c of RELATED) backedUp[c] = await dump(c);
  console.log(`\n💾 Backup written to ${dir}`, backedUp);

  // ── Delete ─────────────────────────────────────────────────
  await db.collection('users').deleteMany(userFilter);
  await db.collection('technicians').deleteMany({});
  await db.collection('listings').deleteMany({});
  for (const c of RELATED) await db.collection(c).deleteMany({});
  console.log('🗑️  Deleted');

  // ── Create ─────────────────────────────────────────────────
  const password = 'Webafix-' + crypto.randomBytes(5).toString('hex');
  const accounts = [];
  const now = new Date();

  // Experts
  let n = 0;
  for (const [locKey, first, last, mainCat, rating, reviews, completed, planId, rate, years] of EXPERTS) {
    n++;
    const loc = locByKey[locKey];
    const email = alias(`expert${String(n).padStart(2, '0')}`);
    const user = await User.create({ email, password, firstName: first, lastName: last, phone: phone(n), role: 'technician', isVerified: true });
    const cat = byMain[mainCat];
    const svc = (cat.serviceCategories || []).slice(0, 2).map((sc, i) => ({
      mainCategory: mainCat,
      categoryName: sc.name,
      subServices: (sc.subServices || []).slice(0, 3).map((s) => s.name),
      description: `${sc.name} in ${loc.town} and nearby`,
      basePrice: rate * 2,
      estimatedDuration: '2-4 hours',
      isActive: true,
      displayOrder: i,
    }));
    const plan = subscriptionPlans[planId];
    const trial = planId === 'trial';
    await Technician.create({
      userId: user._id,
      businessName: `${first} ${last} ${mainCat.split(' ')[0]}`,
      profileHeadline: `${mainCat} in ${loc.estate || loc.town}, ${loc.town}`,
      aboutMe: `I'm ${first}, with ${years} years of experience in ${mainCat.toLowerCase()} around ${loc.town}. Reliable, on time and fairly priced.`,
      mainCategory: mainCat,
      mainCategories: [mainCat],
      serviceCategories: svc,
      skills: [{ name: svc[0]?.categoryName || mainCat, level: rating >= 4.5 ? 'Expert' : 'Advanced', yearsOfExperience: years }],
      pricing: { hourlyRate: rate, fixedPrice: 0, consultationFee: 300, currency: 'KES', paymentMethods: ['Cash', 'M-Pesa'] },
      yearsOfExperience: years,
      address: { street: loc.label, city: loc.town, state: `${loc.county} County`, zipCode: '', country: 'Kenya' },
      location: { type: 'Point', coordinates: [loc.lng, loc.lat], formattedAddress: `${loc.label}, ${loc.town}, ${loc.county}, Kenya` },
      serviceRadius: plan.visibilityRadius,
      languages: [{ name: 'English', proficiency: 'Fluent' }, { name: 'Swahili', proficiency: 'Fluent' }],
      subscription: {
        plan: planId,
        planDetails: { name: plan.name, visibilityRadius: plan.visibilityRadius, price: plan.price, features: plan.features },
        startDate: now,
        endDate: trial ? null : new Date(now.getTime() + 30 * DAY),
        trialEndDate: trial ? new Date(now.getTime() + 30 * DAY) : null,
        isTrial: trial,
        autoRenew: false,
      },
      rating: { average: rating, count: reviews },
      statistics: { totalJobs: completed + Math.round(completed * 0.1), completedJobs: completed, completionRate: 90 + (n % 10) },
      verificationStatus: 'verified',
      isActive: true,
      isAvailable: true,
      emergencyAvailable: n % 3 === 0,
      weekendAvailable: n % 2 === 0,
    });
    accounts.push(['Expert', email, `${first} ${last}`, mainCat, loc.label, `${rating}★ · ${completed} jobs · ${plan.name}`]);
  }

  // Clients (and the stays they own at their location)
  const clientByLoc = {};
  let c = 0;
  for (const [locKey, first, last] of CLIENTS) {
    c++;
    const loc = locByKey[locKey];
    const email = alias(`client${String(c).padStart(2, '0')}`);
    const user = await User.create({
      email, password, firstName: first, lastName: last, phone: phone(100 + c), role: 'client', isVerified: true,
      listingPlan: { freeUntil: addMonths(now, FREE_MONTHS) },
    });
    clientByLoc[locKey] = user;
    accounts.push(['Client', email, `${first} ${last}`, '', loc.label, `${loc.lat}, ${loc.lng}`]);
  }

  const listingDoc = (loc, owner, [category, title, price, extra], i, overrides = {}) => {
    const [dLat, dLng] = OFFSETS[i % OFFSETS.length];
    const group = groupFor(category).id;
    return {
      owner: owner._id,
      listerType: ['hotel', 'guest_house'].includes(category) ? 'owner' : group === 'business' ? 'agent' : group === 'entertainment' ? 'owner' : 'host',
      category,
      group,
      priceUnit: priceUnitFor(category),
      title,
      description: `${title} in ${loc.estate ? `${loc.estate}, ` : ''}${loc.town}. Test listing for the Webafix launch.`,
      price,
      county: loc.county,
      town: loc.town,
      estate: loc.estate,
      landmark: `Near ${loc.label}`,
      location: { type: 'Point', coordinates: [loc.lng + dLng, loc.lat + dLat] },
      photos: pic(`${loc.key}-${slug(category)}-${i}`),
      contactPhone: owner.phone,
      whatsapp: true,
      status: 'active',
      review: { submittedAt: now, reviewedAt: now },
      freeSlot: true,
      activeUntil: owner.listingPlan.freeUntil,
      ...extra,
      ...overrides,
    };
  };

  const listings = [];
  for (const loc of LOCATIONS) {
    const owner = clientByLoc[loc.key];
    [...COMMON(loc), ...(EXTRAS[loc.key] || [])].forEach((spec, i) => listings.push(listingDoc(loc, owner, spec, i)));
  }
  for (const [locKey, category, title, price, extra] of TEST_STATES['pending-review']) {
    const loc = locByKey[locKey];
    listings.push(listingDoc(loc, clientByLoc[locKey], [category, title, price, extra], 5, { status: 'pending', review: { submittedAt: now } }));
  }
  for (const [locKey, category, title, price, extra] of TEST_STATES['unpaid-6th']) {
    const loc = locByKey[locKey];
    listings.push(listingDoc(loc, clientByLoc[locKey], [category, title, price, extra], 6, { freeSlot: false, activeUntil: null }));
  }
  // Each client has up to 5 free listings; anything beyond that is paid (not free)
  const freeCount = {};
  for (const l of listings) {
    const k = String(l.owner);
    if (l.freeSlot) {
      freeCount[k] = (freeCount[k] || 0) + 1;
      if (freeCount[k] > 5) { l.freeSlot = false; l.activeUntil = null; }
    }
  }
  await Listing.insertMany(listings);

  // Jobs
  const jobs = JOBS.map(([locKey, title, mainCat, svc, budget, status, custom]) => {
    const loc = locByKey[locKey];
    const cat = byMain[mainCat];
    const sc = svc || cat?.serviceCategories?.[0]?.name || 'N/A';
    const sub = svc ? 'N/A' : cat?.serviceCategories?.[0]?.subServices?.[0]?.name || 'N/A';
    return {
      clientId: clientByLoc[locKey]._id,
      title,
      description: `${title}. Location: ${loc.label}, ${loc.town}. Test job for the Webafix launch.`,
      mainCategory: mainCat,
      customCategory: !!custom,
      serviceCategory: sc,
      subService: sub,
      address: loc.label,
      location: `${loc.estate ? `${loc.estate}, ` : ''}${loc.town}`,
      budget,
      currency: 'KES',
      pricingType: 'fixed',
      status,
      approvedAt: status === 'approved' ? now : null,
      expiresAt: new Date(now.getTime() + 30 * DAY),
    };
  });
  await Job.insertMany(jobs);

  // Logins file (kept next to the backup, never in the repo)
  const lines = [
    `Webafix test accounts (${db.databaseName}, ${now.toISOString()})`,
    `Password for every account: ${password}`,
    `Emails are aliases of ${EMAIL}, so all their emails arrive in that inbox.`,
    `Phone numbers (0700 000 xxx) are placeholders; don't call or M-Pesa them.`,
    '',
    ...accounts.map((a) => a.filter(Boolean).join('  |  ')),
  ];
  fs.writeFileSync(path.join(dir, 'test-accounts.txt'), lines.join('\n'));

  const byStatus = await Listing.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  console.log(`\n✅ Created ${EXPERTS.length} experts, ${CLIENTS.length} clients, ${listings.length} listings (${JSON.stringify(byStatus)}), ${jobs.length} jobs`);
  console.log(`🔑 Test logins saved to ${path.join(dir, 'test-accounts.txt')}`);
  await mongoose.disconnect();
};

main().catch((err) => { console.error(err); process.exit(1); });
