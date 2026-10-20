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
  COUNTIES,
  groupFor,
  priceUnitFor,
} = require('../utils/listingCategories');
const User = require('../models/User');
const listingPlan = require('../utils/listingPlan');
const { uploadBufferToCloudinary, cloudinary } = require('../config/cloudinary');

const MAX_PHOTOS = 12;
const PHOTO_FOLDER = 'listings';
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const fail = (res, status, message, error) => {
  if (error) console.error('[listingController]', message, error);
  return res.status(status).json({ success: false, message });
};

/**
 * Remove listing photos from Cloudinary once no listing uses them (after a
 * listing is deleted, or photos are taken off it). The photo list comes from
 * the browser, so only files in the listings folder are touched, and never one
 * another listing still shows. Failures are logged; they never block the user.
 */
const removeUnusedPhotos = async (photos) => {
  const ids = [...new Set((photos || [])
    .map((p) => p.publicId)
    .filter((id) => typeof id === 'string' && id.startsWith(`${PHOTO_FOLDER}/`)))];
  if (!ids.length) return;
  try {
    const stillUsed = await Listing.distinct('photos.publicId', { 'photos.publicId': { $in: ids } });
    const unused = ids.filter((id) => !stillUsed.includes(id));
    await Promise.all(unused.map((id) => cloudinary.uploader.destroy(id, { resource_type: 'image', invalidate: true })));
  } catch (error) {
    console.error('[listingController] Could not remove listing photos', ids, error.message);
  }
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

// "  nyali   beach " → "Nyali Beach"-ish: trim, single spaces, first letter of each word capitalised
// (the rest is kept, so "CBD" stays "CBD")
const tidyPlace = (s) =>
  String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

// Case-insensitive exact match
const exactly = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

// Approved, not paused or hidden, and free or paid up
const visibleFilter = () => ({ status: 'active', activeUntil: { $gt: new Date() } });

// Pricing and review fields only the owner sees
const OWNER_ONLY = ['activeUntil', 'paidUntil', 'freeSlot', 'reminders', 'review'];

/**
 * Shape a listing for the browser. Contact details only for signed-in users;
 * the exact pin only for the owner (everyone else gets an approximate area).
 */
const present = (listing, viewer, ownerUser = null) => {
  const l = listing.toObject ? listing.toObject() : { ...listing };
  if (!viewer) delete l.contactPhone;
  if (!l.town && l.area) l.town = l.area;
  l.isOwner = !!viewer && String(l.owner?._id || l.owner) === viewer.userId;
  if (l.isOwner) {
    l.visibleInSearch = l.status === 'active' && !!l.activeUntil && new Date(l.activeUntil) > new Date();
    if (ownerUser) l.billing = listingPlan.listingBilling(l, ownerUser);
    delete l.reminders;
  } else {
    OWNER_ONLY.forEach((k) => delete l[k]);
  }
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

  const LABELS = { contactPhone: 'contact phone' };
  for (const [key, max, required] of [
    ['title', 120, true],
    ['description', 3000, false],
    ['county', 40, true],
    ['town', 60, !existing?.town && !existing?.area],
    ['estate', 60, false],
    ['landmark', 160, false],
    ['openingHours', 120, false],
    ['contactPhone', 20, true],
  ]) {
    const v = text(key, max, required);
    if (v === null) return { error: `Please fill in the ${LABELS[key] || key}.` };
    if (v !== undefined) data[key] = ['town', 'estate'].includes(key) ? tidyPlace(v) : v;
  }

  if (data.county !== undefined && !COUNTIES.includes(data.county)) {
    return { error: 'Please choose a county from the list.' };
  }
  if (data.town !== undefined && !data.town && !existing?.area) return { error: 'Please fill in the town.' };

  if (data.contactPhone !== undefined && !/^\+?[0-9 ]{9,15}$/.test(data.contactPhone)) {
    return { error: 'Please enter a valid phone number, e.g. 0712 345 678.' };
  }

  if (body.price !== undefined || !existing) {
    const price = toNumber(body.price);
    // Entertainment can be free to enter; everything else needs a price
    const freeAllowed = data.priceUnit === 'entry';
    if (!Number.isFinite(price) || price < 0 || (price === 0 && !freeAllowed)) {
      return { error: freeAllowed ? 'Please enter the entry fee, or 0 for free entry.' : 'Please enter a price above 0.' };
    }
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

/**
 * Reuse the spelling already in use for a town (in that county) or estate
 * (in that town), so "kilimani" and "Kilimani " don't become two options.
 */
const useKnownSpelling = async (data, existing) => {
  const county = data.county ?? existing?.county;
  const town = data.town ?? existing?.town;
  if (data.town) {
    const known = await Listing.findOne({ county, town: exactly(data.town) }).select('town').lean();
    if (known) data.town = known.town;
  }
  if (data.estate) {
    const known = await Listing.findOne({ county, town: exactly(data.town || town), estate: exactly(data.estate) })
      .select('estate')
      .lean();
    if (known) data.estate = known.estate;
  }
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
      { $match: visibleFilter() },
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
 * GET /api/listings/places?county=Nairobi            → towns in that county
 * GET /api/listings/places?county=Nairobi&town=Nairobi → estates in that town
 * Built from the listings themselves, so a town or estate a lister types
 * shows up here as soon as that listing is live. Each comes with a count.
 * &scope=all includes every listing (the listing form uses it for suggestions).
 */
exports.getPlaces = async (req, res) => {
  try {
    const { county, town, scope } = req.query;
    if (typeof county !== 'string' || !COUNTIES.includes(county)) {
      return res.json({ success: true, data: { counties: COUNTIES, towns: [], estates: [] } });
    }
    const match = scope === 'all' ? { county } : { ...visibleFilter(), county };
    if (typeof town === 'string' && town.trim()) {
      match.town = exactly(tidyPlace(town));
      match.estate = { $nin: ['', null] };
    } else {
      match.town = { $nin: ['', null] };
    }
    const field = match.estate ? '$estate' : '$town';
    const rows = await Listing.aggregate([
      { $match: match },
      // Group case-insensitively, keep the most common spelling
      { $group: { _id: { $toLower: field }, names: { $push: field }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 300 },
    ]);
    const mostCommon = (names) => {
      const tally = {};
      names.forEach((n) => { tally[n] = (tally[n] || 0) + 1; });
      return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    };
    const list = rows
      .map((r) => ({ name: mostCommon(r.names), count: r.count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      success: true,
      data: match.estate ? { estates: list } : { towns: list },
    });
  } catch (error) {
    fail(res, 500, 'Failed to load places.', error);
  }
};

// Fields never sent in result lists
const LIST_HIDDEN = { contactPhone: 0, description: 0, location: 0, activeUntil: 0, paidUntil: 0, freeSlot: 0, reminders: 0, review: 0 };

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
 * Query: group, category, county, town, estate, q, minPrice, maxPrice, bedrooms (min),
 *        sort (newest | price_asc | price_desc | nearest), page, limit,
 *        lat, lng, minKm, maxKm (with lat/lng: nearest first, within the band)
 */
exports.searchListings = async (req, res) => {
  try {
    const { group, category, county, estate, q, minPrice, maxPrice, bedrooms, sort } = req.query;
    const town = req.query.town ?? req.query.area; // "area" was the old name
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const point = readPoint(req.query.lat, req.query.lng);

    const filter = visibleFilter();
    if (typeof category === 'string' && CATEGORY_IDS.includes(category)) filter.category = category;
    else if (typeof group === 'string' && LISTING_GROUPS.some((g) => g.id === group)) filter.group = group;
    if (typeof county === 'string' && county) filter.county = county;
    if (typeof town === 'string' && town.trim()) filter.town = exactly(tidyPlace(town));
    if (typeof estate === 'string' && estate.trim()) filter.estate = exactly(tidyPlace(estate));
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { town: rx }, { estate: rx }, { landmark: rx }, { county: rx }];
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
    const visible = listing.status === 'active' && listing.activeUntil > new Date();
    if (!visible && !isOwner) return fail(res, 404, 'This listing is no longer available.');

    if (!isOwner) await Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } });

    const ownerUser = isOwner ? await User.findById(req.user.userId).select('listingPlan') : null;
    res.json({ success: true, data: present(listing, req.user, ownerUser) });
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

    const filter = { ...visibleFilter(), _id: { $ne: listing._id } };
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
    const [items, user] = await Promise.all([
      Listing.find({ owner: req.user.userId }).sort({ updatedAt: -1 }).lean(),
      User.findById(req.user.userId).select('listingPlan'),
    ]);
    res.json({ success: true, data: items.map((l) => present(l, req.user, user)) });
  } catch (error) {
    fail(res, 500, 'Failed to load your listings.', error);
  }
};

/** POST /api/listings */
exports.createListing = async (req, res) => {
  try {
    const { data, error } = readListingInput(req.body);
    if (error) return fail(res, 400, error);
    await useKnownSpelling(data);

    // The first listing starts the free months
    const user = await User.findById(req.user.userId);
    if (!user) return fail(res, 401, 'Please sign in again.');
    if (listingPlan.startFreePeriodIfNeeded(user)) await user.save({ validateModifiedOnly: true });

    // New listings wait for an admin to approve them
    const listing = new Listing({
      ...data,
      owner: req.user.userId,
      status: 'pending',
      review: { submittedAt: new Date() },
    });
    await listingPlan.assignNewListing(listing, user);
    await listing.save();

    const price = listingPlan.PRICE_PER_LISTING;
    res.status(201).json({
      success: true,
      data: present(listing, req.user, user),
      plan: await listingPlan.planSummary(user),
      message: listing.freeSlot
        ? "Submitted for review. We'll email you when it's approved. It's free during your free months."
        : `Submitted for review. Once it's approved, pay KES ${price} a month to show it in search.`,
    });
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
    // Approved listings can be edited while they're free or paid up; listings still in
    // review (or rejected, to fix and resubmit) can always be edited
    const user = await User.findById(req.user.userId).select('listingPlan');
    if (listing.status === 'hidden') return fail(res, 403, 'Our team has hidden this listing. Please contact support.');
    const approved = ['active', 'paused'].includes(listing.status);
    if (approved && !listingPlan.listingBilling(listing, user).covered) {
      return fail(res, 402, `Pay KES ${listingPlan.PRICE_PER_LISTING} to renew this listing before editing it.`);
    }

    const { data, error } = readListingInput(req.body, listing);
    if (error) return fail(res, 400, error);
    await useKnownSpelling(data, listing);
    const photosBefore = listing.photos.map((p) => ({ publicId: p.publicId }));
    Object.assign(listing, data);
    const resubmitted = listing.status === 'rejected';
    if (resubmitted) {
      listing.status = 'pending';
      listing.review = { submittedAt: new Date() };
      await listingPlan.assignNewListing(listing, user); // may get a free slot back
    }
    await listing.save();
    // Photos taken off this listing (checked after saving, so they no longer count as used)
    if (data.photos) await removeUnusedPhotos(photosBefore);
    res.json({
      success: true,
      data: present(listing, req.user, user),
      message: resubmitted ? "Changes saved and sent for review again. We'll email you." : 'Listing updated.',
    });
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
    if (!['active', 'paused'].includes(listing.status)) {
      return fail(res, 400, 'You can pause or resume a listing once it has been approved.');
    }
    listing.status = status;
    await listing.save();
    const user = await User.findById(req.user.userId).select('listingPlan');
    res.json({ success: true, data: present(listing, req.user, user), message: status === 'active' ? 'Listing is live again.' : 'Listing paused.' });
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
    await removeUnusedPhotos(listing.photos);
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
      folder: PHOTO_FOLDER,
      resource_type: 'image',
      transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
    });
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  } catch (error) {
    fail(res, 500, error.message || 'Photo upload failed.', error);
  }
};
