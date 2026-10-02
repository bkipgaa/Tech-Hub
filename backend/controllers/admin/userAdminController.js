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
    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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

    let technicianProfile = null;
    if (user.role === 'technician' || user.role === 'admin') {
      technicianProfile = await Technician.findOne({ userId: user._id });
    }

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
    const [total, active, inactive, byRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
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
        inactive,
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
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) user[k] = String(req.body[k]).trim();
    });
    if (req.body.isActive !== undefined) user.isActive = !!req.body.isActive;

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// ═══════════════════════════════════════════════════════════
// SET STATUS
// ═══════════════════════════════════════════════════════════
exports.setStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user, message: isActive ? 'User activated' : 'User suspended' });
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