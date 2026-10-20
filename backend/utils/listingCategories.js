/**
 * listingCategories.js
 * ====================
 * Stays & Spaces categories. Each group sets how the price is quoted:
 * short stays per night, rentals and business spaces per month.
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
];

// Unit sizes for houses and apartments
const PROPERTY_TYPES = ['bedsitter', 'studio', '1br', '2br', '3br', '4br_plus', 'bungalow', 'maisonette', 'room', 'other'];

const AMENITIES = [
  'wifi', 'parking', 'water_24h', 'backup_power', 'security', 'cctv', 'furnished',
  'kitchen', 'hot_shower', 'tv', 'pool', 'gym', 'lift', 'balcony', 'garden',
  'pets_allowed', 'breakfast', 'conference_room', 'air_conditioning', 'laundry',
];

const CATEGORY_IDS = LISTING_GROUPS.flatMap((g) => g.categories.map((c) => c.id));

const groupFor = (categoryId) => LISTING_GROUPS.find((g) => g.categories.some((c) => c.id === categoryId));

const priceUnitFor = (categoryId) => groupFor(categoryId)?.priceUnit || 'month';

module.exports = { LISTING_GROUPS, PROPERTY_TYPES, AMENITIES, CATEGORY_IDS, groupFor, priceUnitFor };
