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

// Distance search: the furthest a "near me" search reaches, in km
const MAX_SEARCH_KM = 500;
// Pins must fall inside Kenya (with a small margin), which also catches swapped lat/lng
const KENYA_BOUNDS = { minLat: -5, maxLat: 5.5, minLng: 33.5, maxLng: 42.5 };

const readPoint = (lat, lng) => {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
};

// About 1 km of precision: enough to show the area, not the door
const approximate = (coords) =>
  coords?.length === 2 ? { lat: Math.round(coords[1] * 100) / 100, lng: Math.round(coords[0] * 100) / 100 } : null;

const roundKm = (meters) => Math.round(meters / 100) / 10;

/**
 * Shape a listing for the browser. Contact details only for signed-in users;
 * the exact pin only for the owner (everyone else gets an approximate area).
 */
const present = (listing, viewer) => {
  const l = listing.toObject ? listing.toObject() : { ...listing };
  if (!viewer) delete l.contactPhone;
  l.isOwner = !!viewer && String(l.owner?._id || l.owner) === viewer.userId;
  const coords = l.location?.coordinates;
  if (l.isOwner && coords?.length === 2) {
    l.lat = coords[1];
    l.lng = coords[0];
  } else {
    l.approxLocation = approximate(coords);
  }
  delete l.location;
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
  if (body.lat !== undefined || body.lng !== undefined) {
    const point = readPoint(body.lat, body.lng);
    if (!point) return { error: 'Please set the location on the map.' };
    const b = KENYA_BOUNDS;
    if (point.lat < b.minLat || point.lat > b.maxLat || point.lng < b.minLng || point.lng > b.maxLng) {
      return { error: 'The map pin must be in Kenya. Please move it to the property.' };
    }
    data.location = { type: 'Point', coordinates: [point.lng, point.lat] };
  } else if (!existing?.location?.coordinates?.length) {
    return { error: 'Please set the location on the map so clients nearby can find you.' };
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

// Fields never sent in result lists
const LIST_HIDDEN = { contactPhone: 0, description: 0, location: 0 };

/**
 * Nearest-first search with $geoNear. Each item gets `distanceKm`;
 * minKm/maxKm make a distance band (e.g. 1–10 km).
 */
const searchNear = async ({ point, filter, minKm, maxKm, sort, page, limit }) => {
  const geoNear = {
    near: { type: 'Point', coordinates: [point.lng, point.lat] },
    distanceField: 'distanceMeters',
    spherical: true,
    query: filter,
    maxDistance: maxKm * 1000,
  };
  if (minKm > 0) geoNear.minDistance = minKm * 1000;

  const sortStage = {
    price_asc: { price: 1, distanceMeters: 1 },
    price_desc: { price: -1, distanceMeters: 1 },
  }[sort] || { distanceMeters: 1 };

  const [result] = await Listing.aggregate([
    { $geoNear: geoNear },
    {
      $facet: {
        items: [{ $sort: sortStage }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: LIST_HIDDEN }],
        total: [{ $count: 'n' }],
      },
    },
  ]);
  const items = (result?.items || []).map(({ distanceMeters, ...l }) => ({ ...l, distanceKm: roundKm(distanceMeters) }));
  return { items, total: result?.total?.[0]?.n || 0 };
};

/**
 * GET /api/listings
 * Query: group, category, county, area, q, minPrice, maxPrice, bedrooms (min),
 *        sort (newest | price_asc | price_desc | nearest), page, limit,
 *        lat, lng, minKm, maxKm (with lat/lng: nearest first, within the band)
 */
exports.searchListings = async (req, res) => {
  try {
    const { group, category, county, area, q, minPrice, maxPrice, bedrooms, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const point = readPoint(req.query.lat, req.query.lng);

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

    if (point) {
      const minKm = Math.max(0, toNumber(req.query.minKm) || 0);
      const maxKmRaw = toNumber(req.query.maxKm);
      const maxKm = Math.min(MAX_SEARCH_KM, Number.isFinite(maxKmRaw) && maxKmRaw > 0 ? maxKmRaw : MAX_SEARCH_KM);
      if (minKm >= maxKm) return fail(res, 400, 'The distance range is not valid.');
      const { items, total } = await searchNear({ point, filter, minKm, maxKm, sort, page, limit });
      return res.json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
        near: { minKm, maxKm },
      });
    }

    const sortBy = {
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
    }[sort] || { createdAt: -1 };

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .select(LIST_HIDDEN)
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

/**
 * GET /api/listings/:id/nearby?limit=8&group=
 * Other live places near this one, nearest first (within 50 km).
 */
exports.getNearbyListings = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Listing not found.');
    const listing = await Listing.findById(req.params.id).select('location').lean();
    const coords = listing?.location?.coordinates;
    if (!coords?.length) return res.json({ success: true, data: [] });

    const filter = { status: 'active', _id: { $ne: listing._id } };
    const { group } = req.query;
    if (typeof group === 'string' && LISTING_GROUPS.some((g) => g.id === group)) filter.group = group;
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 8));

    const { items } = await searchNear({
      point: { lng: coords[0], lat: coords[1] },
      filter,
      minKm: 0,
      maxKm: 50,
      page: 1,
      limit,
    });
    res.json({ success: true, data: items });
  } catch (error) {
    fail(res, 500, 'Failed to load nearby places.', error);
  }
};

// ─────────────────────────────────────────────────────────────
// LISTER
// ─────────────────────────────────────────────────────────────

/** GET /api/listings/mine */
exports.getMyListings = async (req, res) => {
  try {
    const items = await Listing.find({ owner: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: items.map((l) => present(l, req.user)) });
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
    res.status(201).json({ success: true, data: present(listing, req.user), message: 'Your listing is live.' });
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
    res.json({ success: true, data: present(listing, req.user), message: 'Listing updated.' });
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
    res.json({ success: true, data: present(listing, req.user), message: status === 'active' ? 'Listing is live again.' : 'Listing paused.' });
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
