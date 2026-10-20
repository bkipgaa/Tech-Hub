/**
 * listingCategories.js
 * ====================
 * Stays & Spaces categories. Each group sets how the price is quoted:
 * short stays per night, rentals and business spaces per month,
 * entertainment by entry fee.
 *
 * The frontend has a matching copy in src/utils/listingCategories.js.
 */

const LISTING_GROUPS = [
  {
    id: 'short_stays',
    name: 'Short stays',
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
    priceUnit: 'month',
    categories: [
      { id: 'house_rent', name: 'Houses & apartments for rent' },
      { id: 'hostel', name: 'Hostels & student rooms' },
    ],
  },
  {
    id: 'business',
    name: 'Business spaces',
    priceUnit: 'month',
    categories: [
      { id: 'office', name: 'Offices & co-working' },
      { id: 'shop', name: 'Shops & commercial spaces' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    priceUnit: 'entry', // entry or cover charge; 0 means free entry
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

// Unit sizes for houses and apartments
const PROPERTY_TYPES = ['bedsitter', 'studio', '1br', '2br', '3br', '4br_plus', 'bungalow', 'maisonette', 'room', 'other'];

const AMENITIES = [
  'wifi', 'parking', 'water_24h', 'backup_power', 'security', 'cctv', 'furnished',
  'kitchen', 'hot_shower', 'tv', 'pool', 'gym', 'lift', 'balcony', 'garden',
  'pets_allowed', 'breakfast', 'conference_room', 'air_conditioning', 'laundry',
  // entertainment
  'live_music', 'dj', 'food', 'outdoor_seating', 'vip_area', 'sports_screens', 'dance_floor', 'card_payments',
];

const CATEGORY_IDS = LISTING_GROUPS.flatMap((g) => g.categories.map((c) => c.id));

const groupFor = (categoryId) => LISTING_GROUPS.find((g) => g.categories.some((c) => c.id === categoryId));

const priceUnitFor = (categoryId) => groupFor(categoryId)?.priceUnit || 'month';

module.exports = { LISTING_GROUPS, PROPERTY_TYPES, AMENITIES, CATEGORY_IDS, groupFor, priceUnitFor };

// Kenya's 47 counties; towns and estates under them are added by listers
const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
  'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru',
  'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

module.exports.COUNTIES = COUNTIES;
