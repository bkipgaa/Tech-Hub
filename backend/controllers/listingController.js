/**
 * listingController.js
 * ====================
 * Stays & Spaces: browse, view and manage property listings.
 *
 * Public:  GET /api/listings, /api/listings/meta, /api/listings/:id
 * Lister:  GET /api/listings/mine, POST/PUT/DELETE, PATCH /:id/status,
 *          POST /api/listings/photos
 *
 * The lister's phone number is only sent to signed-in users.
 */

const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const {
  LISTING_GROUPS,
  PROPERTY_TYPES,
  AMENITIES,
  CATEGORY_IDS,
  groupFor,
  priceUnitFor,
} = require('../utils/listingCategories');
const { uploadBufferToCloudinary } = require('../config/cloudinary');

const MAX_PHOTOS = 12;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const fail = (res, status, message, error) => {
  if (error) console.error('[listingController]', message, error);
  return res.status(status).json({ success: false, message });
};

const OWNER_FIELDS = 'firstName lastName profileImage';

/** Shape a listing for the browser; contact details only for signed-in users. */
const present = (listing, viewer) => {
  const l = listing.toObject ? listing.toObject() : { ...listing };
  if (!viewer) delete l.contactPhone;
  l.isOwner = !!viewer && String(l.owner?._id || l.owner) === viewer.userId;
  return l;
};

/**
 * Validate and pick the fields a lister may set.
 * Returns { data } or { error }.
 */
const readListingInput = (body, existing = null) => {
  const category = body.category ?? existing?.category;
  if (!CATEGORY_IDS.includes(category)) return { error: 'Please choose a category.' };

  const data = {
    category,
    group: groupFor(category).id,
    priceUnit: priceUnitFor(category),
  };

  const text = (key, max, required) => {
    if (body[key] === undefined) return existing ? undefined : (required ? null : '');
    const v = String(body[key] || '').trim();
    if (required && !v) return null;
    return v.slice(0, max);
  };

  for (const [key, max, required] of [
    ['title', 120, true],
    ['description', 3000, false],
    ['county', 40, true],
    ['area', 80, true],
    ['landmark', 160, false],
    ['contactPhone', 20, true],
  ]) {
    const v = text(key, max, required);
    if (v === null) return { error: `Please fill in the ${key === 'contactPhone' ? 'contact phone' : key}.` };
    if (v !== undefined) data[key] = v;
  }

  if (data.contactPhone !== undefined && !/^\+?[0-9 ]{9,15}$/.test(data.contactPhone)) {
    return { error: 'Please enter a valid phone number, e.g. 0712 345 678.' };
  }

  if (body.price !== undefined || !existing) {
    const price = toNumber(body.price);
    if (!Number.isFinite(price) || price <= 0) return { error: 'Please enter a price above 0.' };
    data.price = Math.round(price);
  }

  for (const key of ['bedrooms', 'bathrooms', 'maxGuests', 'sizeSqft', 'deposit']) {
    if (body[key] === undefined) continue;
    const n = toNumber(body[key]);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return { error: `Invalid ${key}.` };
    data[key] = n === null ? null : Math.round(n);
  }

  if (body.propertyType !== undefined) {
    data.propertyType = PROPERTY_TYPES.includes(body.propertyType) ? body.propertyType : null;
  }
  if (body.listerType !== undefined) {
    data.listerType = ['owner', 'agent', 'property_manager', 'host'].includes(body.listerType)
      ? body.listerType
      : 'owner';
  }
  if (body.amenities !== undefined) {
    data.amenities = Array.isArray(body.amenities)
      ? [...new Set(body.amenities.filter((a) => AMENITIES.includes(a)))]
      : [];
  }
  if (body.photos !== undefined) {
    if (!Array.isArray(body.photos)) return { error: 'Invalid photos.' };
    const photos = body.photos
      .filter((p) => p && typeof p.url === 'string' && /^https:\/\//.test(p.url))
      .map((p) => ({ url: p.url, publicId: typeof p.publicId === 'string' ? p.publicId : undefined }));
    if (photos.length > MAX_PHOTOS) return { error: `You can add up to ${MAX_PHOTOS} photos.` };
    data.photos = photos;
  }
  if (body.whatsapp !== undefined) data.whatsapp = !!body.whatsapp;
  if (body.availableFrom !== undefined) {
    const d = body.availableFrom ? new Date(body.availableFrom) : null;
    data.availableFrom = d && !isNaN(d) ? d : null;
  }

  return { data };
};

const findOwnListing = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    fail(res, 404, 'Listing not found.');
    return null;
  }
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    fail(res, 404, 'Listing not found.');
    return null;
  }
  if (String(listing.owner) !== req.user.userId) {
    fail(res, 403, 'You can only change your own listings.');
    return null;
  }
  return listing;
};

// ─────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────

/** GET /api/listings/meta — categories with live counts, amenities, unit types */
exports.getMeta = async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countBy = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    res.json({
      success: true,
      data: {
        groups: LISTING_GROUPS.map((g) => ({
          ...g,
          categories: g.categories.map((c) => ({ ...c, count: countBy[c.id] || 0 })),
        })),
        amenities: AMENITIES,
        propertyTypes: PROPERTY_TYPES,
      },
    });
  } catch (error) {
    fail(res, 500, 'Failed to load categories.', error);
  }
};

/**
 * GET /api/listings
 * Query: group, category, county, area, q, minPrice, maxPrice, bedrooms (min),
 *        sort (newest | price_asc | price_desc), page, limit
 */
exports.searchListings = async (req, res) => {
  try {
    const { group, category, county, area, q, minPrice, maxPrice, bedrooms, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

    const filter = { status: 'active' };
    if (typeof category === 'string' && CATEGORY_IDS.includes(category)) filter.category = category;
    else if (typeof group === 'string' && LISTING_GROUPS.some((g) => g.id === group)) filter.group = group;
    if (typeof county === 'string' && county) filter.county = county;
    if (typeof area === 'string' && area.trim()) filter.area = new RegExp(escapeRegex(area.trim()), 'i');
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { area: rx }, { landmark: rx }, { county: rx }];
    }
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      filter.price = {};
      if (Number.isFinite(min)) filter.price.$gte = min;
      if (Number.isFinite(max)) filter.price.$lte = max;
    }
    const beds = toNumber(bedrooms);
    if (Number.isFinite(beds) && beds > 0) filter.bedrooms = { $gte: beds };

    const sortBy = {
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
    }[sort] || { createdAt: -1 };

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-contactPhone -description')
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    fail(res, 500, 'Failed to load listings.', error);
  }
};

/** GET /api/listings/:id — counts a view unless the owner is looking */
exports.getListing = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Listing not found.');
    const listing = await Listing.findById(req.params.id).populate('owner', OWNER_FIELDS);
    if (!listing) return fail(res, 404, 'Listing not found.');

    const isOwner = req.user && String(listing.owner?._id) === req.user.userId;
    if (listing.status !== 'active' && !isOwner) return fail(res, 404, 'This listing is no longer available.');

    if (!isOwner) await Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } });

    res.json({ success: true, data: present(listing, req.user) });
  } catch (error) {
    fail(res, 500, 'Failed to load listing.', error);
  }
};

// ─────────────────────────────────────────────────────────────
// LISTER
// ─────────────────────────────────────────────────────────────

/** GET /api/listings/mine */
exports.getMyListings = async (req, res) => {
  try {
    const items = await Listing.find({ owner: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (error) {
    fail(res, 500, 'Failed to load your listings.', error);
  }
};

/** POST /api/listings */
exports.createListing = async (req, res) => {
  try {
    const { data, error } = readListingInput(req.body);
    if (error) return fail(res, 400, error);
    const listing = await Listing.create({ ...data, owner: req.user.userId, status: 'active' });
    res.status(201).json({ success: true, data: listing, message: 'Your listing is live.' });
  } catch (error) {
    if (error.name === 'ValidationError') return fail(res, 400, Object.values(error.errors)[0]?.message || 'Invalid listing.');
    fail(res, 500, 'Failed to create listing.', error);
  }
};

/** PUT /api/listings/:id */
exports.updateListing = async (req, res) => {
  try {
    const listing = await findOwnListing(req, res);
    if (!listing) return;
    const { data, error } = readListingInput(req.body, listing);
    if (error) return fail(res, 400, error);
    Object.assign(listing, data);
    await listing.save();
    res.json({ success: true, data: listing, message: 'Listing updated.' });
  } catch (error) {
    if (error.name === 'ValidationError') return fail(res, 400, Object.values(error.errors)[0]?.message || 'Invalid listing.');
    fail(res, 500, 'Failed to update listing.', error);
  }
};

/** PATCH /api/listings/:id/status — body: { status: 'active' | 'paused' } */
exports.setListingStatus = async (req, res) => {
  try {
    const listing = await findOwnListing(req, res);
    if (!listing) return;
    const { status } = req.body;
    if (!['active', 'paused'].includes(status)) return fail(res, 400, 'Status must be active or paused.');
    if (listing.status === 'hidden') return fail(res, 403, 'Our team has hidden this listing. Please contact support.');
    listing.status = status;
    await listing.save();
    res.json({ success: true, data: listing, message: status === 'active' ? 'Listing is live again.' : 'Listing paused.' });
  } catch (error) {
    fail(res, 500, 'Failed to update listing.', error);
  }
};

/** DELETE /api/listings/:id */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await findOwnListing(req, res);
    if (!listing) return;
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted.' });
  } catch (error) {
    fail(res, 500, 'Failed to delete listing.', error);
  }
};

/** POST /api/listings/photos — multipart field "photo"; returns { url, publicId } */
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'Please attach a photo.');
    if (!req.file.mimetype.startsWith('image/')) return fail(res, 400, 'Only photos can be added to a listing.');
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'listings',
      resource_type: 'image',
      transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
    });
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  } catch (error) {
    fail(res, 500, error.message || 'Photo upload failed.', error);
  }
};
