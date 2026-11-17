/**
 * Listing.js
 * ==========
 * A business or place in Businesses: a hardware shop, pharmacy, restaurant,
 * Airbnb, hotel, house for rent, office, club… (utils/listingCategories.js).
 * Any signed-in user can list one; clients contact the lister directly by
 * phone or WhatsApp, and can send a business an order for its products.
 */

const mongoose = require('mongoose');
const { CATEGORY_IDS, PROPERTY_TYPES, AMENITIES } = require('../utils/listingCategories');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
}, { _id: false });

const MAX_PRODUCTS = 60;
const MAX_EXTRAS = 30;

// Something a business sells
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  price: { type: Number, min: 0, default: null }, // null: ask for the price
  unit: { type: String, trim: true, maxlength: 30, default: '' }, // e.g. per bag, per metre
  description: { type: String, trim: true, maxlength: 300, default: '' },
  photo: { type: photoSchema, default: undefined },
  inStock: { type: Boolean, default: true },
});

const listingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listerType: { type: String, enum: ['owner', 'agent', 'property_manager', 'host'], default: 'owner' },

  category: { type: String, enum: CATEGORY_IDS, required: true, index: true },
  group: { type: String, required: true, index: true },

  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },

  propertyType: { type: String, enum: [...PROPERTY_TYPES, null], default: null },
  bedrooms: { type: Number, min: 0, max: 50, default: null },
  bathrooms: { type: Number, min: 0, max: 50, default: null },
  maxGuests: { type: Number, min: 0, max: 500, default: null },   // short stays
  sizeSqft: { type: Number, min: 0, default: null },               // offices and shops

  // Per night, per month, or the entry fee for entertainment (0 = free entry)
  // Shops (priceUnit 'none') have no single price; they list products instead
  price: { type: Number, min: 0, default: 0 },
  priceUnit: { type: String, enum: ['night', 'month', 'entry', 'none'], required: true },
  deposit: { type: Number, min: 0, default: null },
  openingHours: { type: String, trim: true, maxlength: 120, default: '' }, // entertainment

  // County → town → estate. Towns and estates are free text: a new one typed by
  // a lister becomes a search option as soon as the listing is live.
  county: { type: String, required: true, trim: true, index: true },
  town: { type: String, trim: true, maxlength: 60 },     // e.g. Nairobi, Thika, Nyali
  estate: { type: String, trim: true, maxlength: 60, default: '' }, // e.g. Kilimani (optional)
  area: { type: String, trim: true, maxlength: 80 },     // legacy single field, read as the town
  landmark: { type: String, trim: true, maxlength: 160, default: '' },
  // Street and building, for businesses customers walk into
  address: { type: String, trim: true, maxlength: 160, default: '' },

  // Pin set by the lister on a map, as GeoJSON [lng, lat]. Never sent to other
  // users as-is: they get a distance and an approximate area (see the controller).
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], default: undefined },
  },

  amenities: [{ type: String, enum: AMENITIES }],
  // "What it offers" items the lister types in themselves, e.g. "Free tile cutting"
  extras: {
    type: [{ type: String, trim: true, maxlength: 60 }],
    validate: [(v) => v.length <= MAX_EXTRAS, `At most ${MAX_EXTRAS} of your own items`],
  },

  // Businesses: what they sell. Customers pick items and send the order on WhatsApp.
  products: {
    type: [productSchema],
    validate: [(v) => v.length <= MAX_PRODUCTS, `At most ${MAX_PRODUCTS} products`],
  },
  delivery: { type: Boolean, default: false }, // the business delivers
  photos: { type: [photoSchema], validate: [(v) => v.length <= 12, 'At most 12 photos'] },

  contactPhone: { type: String, required: true, trim: true },
  whatsapp: { type: Boolean, default: true },
  availableFrom: { type: Date, default: null },

  // pending: waiting for admin approval · rejected: not approved (lister can fix and resubmit)
  // active: approved and listed · paused: hidden by the lister · hidden: hidden by an admin
  status: {
    type: String,
    enum: ['pending', 'rejected', 'active', 'paused', 'hidden'],
    default: 'pending',
    index: true,
  },
  review: {
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  views: { type: Number, default: 0 },

  // Pricing (utils/listingPlan.js): a lister's first 5 listings are free during
  // their 3 free months (freeSlot); otherwise KES 500 per listing per month.
  freeSlot: { type: Boolean, default: false },
  paidUntil: { type: Date, default: null },
  // When the listing stops showing: the later of paidUntil and, for a free
  // slot, the end of the free months. Search filters on this directly.
  activeUntil: { type: Date, default: null, index: true },
  // Reminder emails already sent for the current activeUntil (jobs/listingPlanReminders.js)
  reminders: {
    until: Date,
    sent: [String], // 'd7' | 'd3' | 'd1' | 'ended'
  },
}, { timestamps: true });

listingSchema.index({ status: 1, category: 1, county: 1, town: 1, estate: 1, price: 1 });
listingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.MAX_PRODUCTS = MAX_PRODUCTS;
module.exports.MAX_EXTRAS = MAX_EXTRAS;
