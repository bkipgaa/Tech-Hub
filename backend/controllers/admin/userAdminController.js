/**
 * userController.js
 * =================
 * Admin management of regular Users (clients, technicians, engineers).
 * NOTE: this is NOT the same as adminUserController (which manages
 * AdminUser accounts). This manages the `User` collection.
 *
 * Mounted at: /api/admin/users
 */

const User = require('../../models/User');
const Technician = require('../../models/Technician');
const Booking = require('../../models/Booking');
const { normalizeServiceSelection } = require('../../utils/serviceSelection');
const { updateCompletionStats, newExpertSubscriptionFields } = require('../technician/profile/helpers');

const ROLES = ['client', 'technician'];
const SIGNUP_INTENTS = ['expert', 'client', 'lister', 'stay_seeker'];

/** { lat, lng } from the request, or an error message. null when not given. */
const parseCoordinates = (raw) => {
  if (!raw || (raw.lat === undefined && raw.lng === undefined)) return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (raw.lat === '' || raw.lng === '' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: 'Enter both latitude and longitude as numbers.' };
  }
  if (lat < -90 || lat > 90) return { error: 'Latitude must be between -90 and 90.' };
  if (lng < -180 || lng > 180) return { error: 'Longitude must be between -180 and 180.' };
  return { lat, lng };
};

/** Copy the user's location and town/county onto their expert profile. */
const syncTechnicianLocation = (tech, user) => {
  if (user.location?.lat !== undefined && user.location?.lng !== undefined) {
    tech.location = {
      type: 'Point',
      coordinates: [user.location.lng, user.location.lat],
      formattedAddress: user.location.formattedAddress || tech.location?.formattedAddress,
    };
    tech.locationUpdatedAt = new Date();
  }
  const address = user.address || {};
  const current = tech.toObject().address || {};
  tech.address = {
    ...current,
    city: address.city || current.city,
    state: address.state || current.state,
    country: address.country || current.country || 'Kenya',
  };
};

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;

    // status filter instead of isActive
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;   // 'active' | 'suspended' | 'pending'
    }

    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
};

// ═══════════════════════════════════════════════════════════
// GET ONE
// ═══════════════════════════════════════════════════════════
exports.getOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Former experts keep a hidden profile, so look it up whatever the role
    const technicianProfile = await Technician.findOne({ userId: user._id });

    const stats = {
      bookingsAsClient: await Booking.countDocuments({ clientId: user._id }),
      bookingsAsTechnician: technicianProfile
        ? await Booking.countDocuments({ technicianId: technicianProfile._id })
        : 0,
    };

    res.json({ success: true, data: { user, technicianProfile, stats } });
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to load user' });
  }
};

// ═══════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════
exports.stats = async (req, res) => {
  try {
    const [total, active, suspended, pending, byRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'pending' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const roleMap = byRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonthStart } });

    res.json({
      success: true,
      data: {
        total,
        active,
        suspended,
        pending,
        inactive: suspended,          // keep key name for frontend compatibility
        clients: roleMap.client || 0,
        technicians: roleMap.technician || 0,
        admins: roleMap.admin || 0,
        newThisMonth,
      },
    });
  } catch (err) {
    console.error('userStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load user stats' });
  }
};

// ═══════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const allowed = ['firstName', 'lastName', 'phone'];
    for (const k of allowed) {
      if (req.body[k] === undefined) continue;
      const value = String(req.body[k]).trim();
      if (!value) return res.status(400).json({ success: false, message: `${k} cannot be empty` });
      user[k] = value;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
      }
      if (email !== user.email && await User.exists({ email, _id: { $ne: user._id } })) {
        return res.status(400).json({ success: false, message: 'Another account already uses this email' });
      }
      user.email = email;
    }

    let locationChanged = false;
    if (req.body.address) {
      const current = user.toObject().address || {};
      const next = { ...current };
      for (const k of ['city', 'state', 'country']) {
        if (req.body.address[k] !== undefined) next[k] = String(req.body.address[k]).trim();
      }
      user.address = next;
      locationChanged = true;
    }

    if (req.body.location) {
      const coords = parseCoordinates(req.body.location);
      if (coords?.error) return res.status(400).json({ success: false, message: coords.error });
      const formattedAddress = req.body.location.formattedAddress !== undefined
        ? String(req.body.location.formattedAddress).trim()
        : user.location?.formattedAddress;
      if (coords) {
        user.location = { lat: coords.lat, lng: coords.lng, formattedAddress, updatedAt: new Date() };
        locationChanged = true;
      } else if (formattedAddress !== user.location?.formattedAddress && user.location?.lat !== undefined) {
        user.location = { ...user.toObject().location, formattedAddress };
        locationChanged = true;
      }
    }

    if (req.body.signupIntent !== undefined) {
      if (req.body.signupIntent && !SIGNUP_INTENTS.includes(req.body.signupIntent)) {
        return res.status(400).json({ success: false, message: 'Invalid signup type' });
      }
      user.signupIntent = req.body.signupIntent || undefined;
    }
    if (req.body.preferences) {
      const prefs = { ...(user.toObject().preferences || {}) };
      for (const k of ['mainCategory', 'listingCategory']) {
        if (req.body.preferences[k] !== undefined) prefs[k] = String(req.body.preferences[k]).trim() || undefined;
      }
      user.preferences = prefs;
    }

    // Role: an expert needs an expert profile (create it with POST /:id/technician)
    const tech = await Technician.findOne({ userId: user._id });
    if (req.body.role !== undefined && req.body.role !== user.role) {
      if (!ROLES.includes(req.body.role)) {
        return res.status(400).json({ success: false, message: 'Role must be client or technician' });
      }
      if (req.body.role === 'technician' && !tech) {
        return res.status(400).json({ success: false, message: 'Create their expert profile first — that makes them an expert.' });
      }
      user.role = req.body.role;
      // A former expert's profile is kept but hidden from clients
      if (tech) tech.isActive = req.body.role === 'technician';
    }

    if (typeof req.body.status === 'string' &&
        ['active', 'suspended', 'pending'].includes(req.body.status)) {
      user.status = req.body.status;
    } else if (typeof req.body.isActive === 'boolean') {
      user.status = req.body.isActive ? 'active' : 'suspended';
    }

    await user.save();
    if (tech) {
      if (locationChanged) syncTechnicianLocation(tech, user);
      if (tech.isModified()) await tech.save();
    }
    const out = user.toObject();
    delete out.password;
    res.json({ success: true, data: out });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// ═══════════════════════════════════════════════════════════
// MAKE EXPERT — create their expert profile and switch them to technician
// ═══════════════════════════════════════════════════════════
// Body: { services: [{ mainCategory, serviceCategories: [{ categoryName, subServices }] }],
//         businessName?, profileHeadline?, aboutMe?, yearsOfExperience? }
// Uses the user's saved location and town/county. Created by an admin, so the
// expert is approved and visible straight away, on the Free plan.
exports.makeExpert = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (await Technician.exists({ userId: user._id })) {
      return res.status(400).json({ success: false, message: 'This user already has an expert profile.' });
    }
    if (!user.address?.city || !user.address?.state) {
      return res.status(400).json({ success: false, message: "Save the user's town and county first." });
    }

    let services;
    try {
      services = await normalizeServiceSelection(req.body.services);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const text = (v, max) => String(v || '').trim().slice(0, max);
    const tech = new Technician({
      userId: user._id,
      ...services,
      businessName: text(req.body.businessName, 120),
      profileHeadline: text(req.body.profileHeadline, 200),
      aboutMe: text(req.body.aboutMe, 2000),
      yearsOfExperience: Math.max(0, Number(req.body.yearsOfExperience) || 0),
      address: { city: user.address.city, state: user.address.state, country: user.address.country || 'Kenya' },
      languages: [{ name: 'English', proficiency: 'Fluent' }],
      pricing: { paymentMethods: ['Cash', 'M-Pesa'] },
      verificationStatus: 'verified',
      awaitingApproval: false,
      ...newExpertSubscriptionFields(),
    });
    syncTechnicianLocation(tech, user);
    await tech.save();
    await updateCompletionStats(tech);

    user.role = 'technician';
    user.signupIntent = user.signupIntent || 'expert';
    await user.save();

    res.status(201).json({ success: true, message: 'Expert profile created. They are now an expert on the Free plan.', data: tech });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    console.error('makeExpert error:', err);
    res.status(500).json({ success: false, message: 'Failed to create the expert profile' });
  }
};

// ═══════════════════════════════════════════════════════════
// SET STATUS
// ═══════════════════════════════════════════════════════════
exports.setStatus = async (req, res) => {
  try {
    const { isActive, status } = req.body;

    let nextStatus;
    if (typeof status === 'string') {
      if (!['active', 'suspended', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      nextStatus = status;
    } else if (typeof isActive === 'boolean') {
      nextStatus = isActive ? 'active' : 'suspended';
    } else {
      return res.status(400).json({ success: false, message: 'Provide `status` or `isActive`' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: nextStatus },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: user,
      message: nextStatus === 'active' ? 'User activated' : 'User suspended',
    });
  } catch (err) {
    console.error('setUserStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ═══════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await user.deleteOne();
    // Optionally delete their technician profile:
    await Technician.deleteOne({ userId: user._id });

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};