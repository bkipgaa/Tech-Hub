/**
 * Listing.js
 * ==========
 * A place in Stays & Spaces: an Airbnb, guest house, hotel, house for rent,
 * hostel, office or shop. Any signed-in user can list one; clients contact
 * the lister directly by phone or WhatsApp.
 */

const mongoose = require('mongoose');
const { CATEGORY_IDS, PROPERTY_TYPES, AMENITIES } = require('../utils/listingCategories');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
}, { _id: false });

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

  price: { type: Number, required: true, min: 0 },
  priceUnit: { type: String, enum: ['night', 'month'], required: true },
  deposit: { type: Number, min: 0, default: null },

  county: { type: String, required: true, trim: true, index: true },
  area: { type: String, required: true, trim: true, maxlength: 80 },   // estate / town, e.g. Kilimani
  landmark: { type: String, trim: true, maxlength: 160, default: '' },

  amenities: [{ type: String, enum: AMENITIES }],
  photos: { type: [photoSchema], validate: [(v) => v.length <= 12, 'At most 12 photos'] },

  contactPhone: { type: String, required: true, trim: true },
  whatsapp: { type: Boolean, default: true },
  availableFrom: { type: Date, default: null },

  // active: shown in search · paused: hidden by the lister · hidden: hidden by an admin
  status: { type: String, enum: ['active', 'paused', 'hidden'], default: 'active', index: true },
  views: { type: Number, default: 0 },
}, { timestamps: true });

listingSchema.index({ status: 1, category: 1, county: 1, price: 1 });
listingSchema.index({ title: 'text', area: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
