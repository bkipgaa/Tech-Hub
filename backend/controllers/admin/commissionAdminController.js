/**
 * commissionController.js
 * =======================
 * Admin management of technician commissions
 * (5% of labor, marked "pending" | "invoiced" | "paid").
 *
 * Mounted at: /api/admin/commissions
 */

const Booking = require('../../models/Booking');

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { 'commission.amount': { $gt: 0 } };
    if (req.query.status && req.query.status !== 'all') {
      filter['commission.status'] = req.query.status;
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('technicianId', 'businessName userId mainCategory')
        .populate('technicianId.userId', 'firstName lastName email')
        .populate('clientId', 'firstName lastName email')
        .sort({ 'commission.createdAt': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('listCommissions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load commissions' });
  }
};

// ═══════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════
exports.stats = async (req, res) => {
  try {
    const [agg] = await Booking.aggregate([
      { $match: { 'commission.amount': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$commission.amount' },
          pending: {
            $sum: { $cond: [{ $eq: ['$commission.status', 'pending'] }, '$commission.amount', 0] },
          },
          invoiced: {
            $sum: { $cond: [{ $eq: ['$commission.status', 'invoiced'] }, '$commission.amount', 0] },
          },
          paid: {
            $sum: { $cond: [{ $eq: ['$commission.status', 'paid'] }, '$commission.amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [thisMonth] = await Booking.aggregate([
      { $match: { 'commission.amount': { $gt: 0 }, 'commission.createdAt': { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        total: agg?.total || 0,
        pending: agg?.pending || 0,
        invoiced: agg?.invoiced || 0,
        paid: agg?.paid || 0,
        count: agg?.count || 0,
        thisMonth: thisMonth?.total || 0,
      },
    });
  } catch (err) {
    console.error('commissionStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};

// ═══════════════════════════════════════════════════════════
// MARK PAID
// ═══════════════════════════════════════════════════════════
exports.markPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.commission?.amount) {
      return res.status(400).json({ success: false, message: 'Booking has no commission' });
    }

    booking.commission.status = 'paid';
    booking.commission.paidAt = new Date();
    booking.commission.reference = req.body.reference || booking.commission.reference || '';
    await booking.save();

    res.json({ success: true, data: booking, message: 'Commission marked as paid' });
  } catch (err) {
    console.error('markCommissionPaid error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark commission as paid' });
  }
};

// ═══════════════════════════════════════════════════════════
// WAIVE
// ═══════════════════════════════════════════════════════════
exports.waive = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!booking.commission?.amount) {
      return res.status(400).json({ success: false, message: 'Booking has no commission' });
    }

    booking.commission.status = 'waived';
    booking.commission.waivedAt = new Date();
    booking.commission.waivedReason = (req.body.reason || '').slice(0, 500);
    await booking.save();

    res.json({ success: true, data: booking, message: 'Commission waived' });
  } catch (err) {
    console.error('waiveCommission error:', err);
    res.status(500).json({ success: false, message: 'Failed to waive commission' });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
exports.exportCsv = async (req, res) => {
  try {
    const filter = { 'commission.amount': { $gt: 0 } };
    if (req.query.status && req.query.status !== 'all') {
      filter['commission.status'] = req.query.status;
    }

    const items = await Booking.find(filter)
      .populate('technicianId.userId', 'firstName lastName email')
      .populate('clientId', 'firstName lastName')
      .lean();

    const rows = [
      ['Booking ID', 'Technician', 'Technician Email', 'Client', 'Service', 'Labor (KES)', 'Commission (KES)', 'Status', 'Date'],
      ...items.map((b) => [
        b._id.toString(),
        b.technicianId?.userId
          ? `${b.technicianId.userId.firstName} ${b.technicianId.userId.lastName}`
          : '',
        b.technicianId?.userId?.email || '',
        b.clientId ? `${b.clientId.firstName} ${b.clientId.lastName}` : '',
        `${b.serviceCategory || ''} / ${b.subService || ''}`,
        b.laborPayment?.amount || 0,
        b.commission?.amount || 0,
        b.commission?.status || '',
        b.commission?.createdAt ? new Date(b.commission.createdAt).toISOString() : '',
      ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="commissions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportCommissions error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};