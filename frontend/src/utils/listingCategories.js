/**
 * listingCategories.js
 * ====================
 * Stays & Spaces categories and labels. Mirrors backend/utils/listingCategories.js
 * (the backend is the source of truth for which ids are valid).
 */

export const LISTING_GROUPS = [
  {
    id: 'short_stays',
    name: 'Short stays',
    blurb: 'Book a night, a weekend or a few weeks',
    priceUnit: 'night',
    categories: [
      { id: 'airbnb', name: 'Airbnbs & serviced apartments' },
      { id: 'guest_house', name: 'Guest houses & lodges' },
      { id: 'hotel', name: 'Hotels' },
    ],
  },
  {
    id: 'rentals',
    name: 'Long-term rentals',
    blurb: 'Find your next home',
    priceUnit: 'month',
    categories: [
      { id: 'house_rent', name: 'Houses & apartments for rent' },
      { id: 'hostel', name: 'Hostels & student rooms' },
    ],
  },
  {
    id: 'business',
    name: 'Business spaces',
    blurb: 'Room to run and grow your business',
    priceUnit: 'month',
    categories: [
      { id: 'office', name: 'Offices & co-working' },
      { id: 'shop', name: 'Shops & commercial spaces' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    blurb: 'Clubs, bars, casinos and nights out',
    priceUnit: 'entry',
    categories: [
      { id: 'club', name: 'Clubs & lounges' },
      { id: 'bar', name: 'Bars & pubs' },
      { id: 'casino', name: 'Casinos & betting lounges' },
      { id: 'live_music', name: 'Live music & karaoke' },
      { id: 'gaming', name: 'Gaming & arcades' },
      { id: 'event_venue', name: 'Event venues & gardens' },
    ],
  },
];

export const ALL_CATEGORIES = LISTING_GROUPS.flatMap((g) =>
  g.categories.map((c) => ({ ...c, groupId: g.id, priceUnit: g.priceUnit }))
);

export const categoryById = (id) => ALL_CATEGORIES.find((c) => c.id === id);
export const groupById = (id) => LISTING_GROUPS.find((g) => g.id === id);

export const isShortStay = (categoryId) => categoryById(categoryId)?.groupId === 'short_stays';
export const isBusiness = (categoryId) => categoryById(categoryId)?.groupId === 'business';
export const isEntertainment = (categoryId) => categoryById(categoryId)?.groupId === 'entertainment';

/** How a group's price is described, e.g. "per night", "entry fee" */
export const priceUnitLabel = (unit) => (unit === 'entry' ? 'entry fee' : `per ${unit}`);

export const PROPERTY_TYPES = [
  { id: 'bedsitter', label: 'Bedsitter' },
  { id: 'studio', label: 'Studio' },
  { id: '1br', label: '1 bedroom' },
  { id: '2br', label: '2 bedrooms' },
  { id: '3br', label: '3 bedrooms' },
  { id: '4br_plus', label: '4+ bedrooms' },
  { id: 'bungalow', label: 'Bungalow' },
  { id: 'maisonette', label: 'Maisonette' },
  { id: 'room', label: 'Single room' },
  { id: 'other', label: 'Other' },
];

export const propertyTypeLabel = (id) => PROPERTY_TYPES.find((p) => p.id === id)?.label || '';

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'parking', label: 'Parking' },
  { id: 'water_24h', label: '24h water' },
  { id: 'backup_power', label: 'Backup power' },
  { id: 'security', label: 'Security guard' },
  { id: 'cctv', label: 'CCTV' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'hot_shower', label: 'Hot shower' },
  { id: 'tv', label: 'TV' },
  { id: 'pool', label: 'Swimming pool' },
  { id: 'gym', label: 'Gym' },
  { id: 'lift', label: 'Lift' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'garden', label: 'Garden' },
  { id: 'pets_allowed', label: 'Pets allowed' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'conference_room', label: 'Meeting room' },
  { id: 'air_conditioning', label: 'Air conditioning' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'live_music', label: 'Live music', for: 'entertainment' },
  { id: 'dj', label: 'DJ', for: 'entertainment' },
  { id: 'food', label: 'Food served', for: 'entertainment' },
  { id: 'outdoor_seating', label: 'Outdoor seating', for: 'entertainment' },
  { id: 'vip_area', label: 'VIP area', for: 'entertainment' },
  { id: 'sports_screens', label: 'Sports on screen', for: 'entertainment' },
  { id: 'dance_floor', label: 'Dance floor', for: 'entertainment' },
  { id: 'card_payments', label: 'Card & M-Pesa accepted', for: 'entertainment' },
];

// Amenities that make sense for a category (entertainment has its own set)
export const amenitiesFor = (categoryId) => {
  const ent = isEntertainment(categoryId);
  const shared = ['wifi', 'parking', 'security', 'cctv', 'backup_power', 'air_conditioning'];
  return AMENITIES.filter((a) => (ent ? a.for === 'entertainment' || shared.includes(a.id) : a.for !== 'entertainment'));
};

export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label || id;

export const LISTER_TYPES = [
  { id: 'owner', label: 'Owner / landlord' },
  { id: 'host', label: 'Host' },
  { id: 'agent', label: 'Agent' },
  { id: 'property_manager', label: 'Property manager' },
];

export const listerTypeLabel = (id) => LISTER_TYPES.find((l) => l.id === id)?.label || 'Lister';

// Kenya's 47 counties (same list the backend accepts)
export const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
  'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru',
  'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

// Listing plan (mirrors backend/utils/listingPlan.js)
export const LISTING_FREE_MONTHS = 6;
export const LISTING_MONTHLY_PRICE = 1500;

export const formatPrice = (price, unit) => {
  if (unit === 'entry') return Number(price) > 0 ? `KES ${Number(price).toLocaleString('en-KE')} entry` : 'Free entry';
  return `KES ${Number(price || 0).toLocaleString('en-KE')}${unit ? ` / ${unit}` : ''}`;
};

/** "Kilimani, Nairobi, Nairobi" (estate, town, county), falling back to the old single area field */
export const placeLabel = (l, { withCounty = true } = {}) => {
  const town = l.town || l.area;
  // "Kilimani, Nairobi", not "Kilimani, Nairobi, Nairobi" when the town shares the county's name
  const county = withCounty && l.county && l.county.toLowerCase() !== String(town || '').toLowerCase() ? l.county : null;
  return [l.estate, town, county].filter(Boolean).join(', ');
};

/** "0712 345 678" → "254712345678" for wa.me / tel: links */
export const toInternationalPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

// "Near me" distance bands (km). The first is the default: everything, nearest first.
export const DISTANCE_BANDS = [
  { id: 'any', label: 'Any distance', minKm: 0, maxKm: null },
  { id: '0-1', label: 'Within 1 km', minKm: 0, maxKm: 1 },
  { id: '1-10', label: '1 – 10 km', minKm: 1, maxKm: 10 },
  { id: '10-20', label: '10 – 20 km', minKm: 10, maxKm: 20 },
  { id: '20-50', label: '20 – 50 km', minKm: 20, maxKm: 50 },
  { id: '50-100', label: '50 – 100 km', minKm: 50, maxKm: 100 },
];

export const bandById = (id) => DISTANCE_BANDS.find((b) => b.id === id) || DISTANCE_BANDS[0];

/** 0.35 → "350 m away", 12.4 → "12.4 km away" */
export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(Number(km))) return '';
  const n = Number(km);
  if (n < 1) return `${Math.max(100, Math.round(n * 10) * 100)} m away`;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km away`;
};
