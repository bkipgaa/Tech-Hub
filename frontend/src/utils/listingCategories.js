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
];

export const ALL_CATEGORIES = LISTING_GROUPS.flatMap((g) =>
  g.categories.map((c) => ({ ...c, groupId: g.id, priceUnit: g.priceUnit }))
);

export const categoryById = (id) => ALL_CATEGORIES.find((c) => c.id === id);
export const groupById = (id) => LISTING_GROUPS.find((g) => g.id === id);

export const isShortStay = (categoryId) => categoryById(categoryId)?.groupId === 'short_stays';
export const isBusiness = (categoryId) => categoryById(categoryId)?.groupId === 'business';

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
];

export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label || id;

export const LISTER_TYPES = [
  { id: 'owner', label: 'Owner / landlord' },
  { id: 'host', label: 'Host' },
  { id: 'agent', label: 'Agent' },
  { id: 'property_manager', label: 'Property manager' },
];

export const listerTypeLabel = (id) => LISTER_TYPES.find((l) => l.id === id)?.label || 'Lister';

export const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado', 'Uasin Gishu',
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kakamega', 'Kericho', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Murang\'a', 'Nandi', 'Narok',
  'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Vihiga', 'Wajir', 'West Pokot',
];

export const formatPrice = (price, unit) =>
  `KES ${Number(price || 0).toLocaleString('en-KE')}${unit ? ` / ${unit}` : ''}`;

/** "0712 345 678" → "254712345678" for wa.me / tel: links */
export const toInternationalPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};
