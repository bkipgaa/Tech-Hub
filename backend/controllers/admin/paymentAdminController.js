/**
 * paymentController.js
 * ====================
 * Read/act on payment transactions from subscriptions and commissions.
 * There is no separate Payment collection; transactions are derived
 * from Booking.commission + Technician.subscription.payments.
 *
 * Mounted at: /api/admin/payments
 */

const Booking = require('../../models/Booking');
const Technician = require('../../models/Technician');

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { type, status, from, to, search } = req.query;

    const wantSubs = !type || type === 'all' || type === 'subscription';
    const wantComms = !type || type === 'all' || type === 'commission';

    const subQuery = {};
    if (from || to) {
      subQuery['subscription.payments.paidAt'] = {};
      if (from) subQuery['subscription.payments.paidAt'].$gte = new Date(from);
      if (to) subQuery['subscription.payments.paidAt'].$lte = new Date(to);
    }

    const commQuery = { 'commission.amount': { $gt: 0 } };
    if (status && status !== 'all') commQuery['commission.status'] = status;

    const [subs, comms] = await Promise.all([
      wantSubs
        ? Technician.find({ 'subscription.payments.0': { $exists: true }, ...subQuery })
            .populate('userId', 'firstName lastName email role')
            .lean()
        : [],
      wantComms
        ? Booking.find(commQuery)
            .populate('technicianId', 'businessName userId')
            .populate('technicianId.userId', 'firstName lastName email')
            .lean()
        : [],
    ]);

    const subTxns = subs.flatMap((t) =>
      (t.subscription?.payments || [])
        .filter((p) => {
          if (!from && !to) return true;
          const d = new Date(p.paidAt);
          if (from && d < new Date(from)) return false;
          if (to && d > new Date(to)) return false;
          return true;
        })
        .map((p) => ({
          _id: `${t._id}-${p._id}`,
          type: 'subscription',
          amount: p.amount,
          status: p.status || 'paid',
          method: p.method || 'unknown',
          date: p.paidAt,
          reference: p.reference || '',
          user: t.userId
            ? { firstName: t.userId.firstName, lastName: t.userId.lastName, email: t.userId.email }
            : null,
          description: `Subscription (${t.subscription?.plan || 'plan'})`,
        }))
    );

    const commTxns = comms.map((b) => ({
      _id: `${b._id}-comm`,
      type: 'commission',
      amount: b.commission?.amount || 0,
      status: b.commission?.status || 'pending',
      method: 'mpesa/card',
      date: b.commission?.paidAt || b.commission?.createdAt || b.createdAt,
      reference: b.commission?.reference || '',
      user: b.technicianId?.userId
        ? {
            firstName: b.technicianId.userId.firstName,
            lastName: b.technicianId.userId.lastName,
            email: b.technicianId.userId.email,
          }
        : null,
      description: `Commission — ${b.serviceCategory || ''}${b.subService ? ' / ' + b.subService : ''}`,
      bookingId: b._id,
    }));

    let all = [...subTxns, ...commTxns];

    if (status && status !== 'all') {
      all = all.filter((t) => t.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(
        (t) =>
          t.reference?.toLowerCase().includes(q) ||
          t.user?.email?.toLowerCase().includes(q) ||
          `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase().includes(q)
      );
    }

    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = all.length;
    const items = all.slice(skip, skip + limit);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('listPayments error:', err);
    res.status(500).json({ success: false, message: 'Failed to load payments' });
  }
};

// ═══════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════
exports.stats = async (req, res) => {
  try {
    const [subsAgg] = await Technician.aggregate([
      { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          total: { $sum: '$subscription.payments.amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const [commAgg] = await Booking.aggregate([
      { $match: { 'commission.amount': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$commission.amount' },
          paid: {
            $sum: { $cond: [{ $eq: ['$commission.status', 'paid'] }, '$commission.amount', 0] },
          },
          pending: {
            $sum: {
              $cond: [{ $in: ['$commission.status', ['pending', 'invoiced']] }, '$commission.amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [thisMonthAgg] = await Booking.aggregate([
      { $match: { 'commission.status': 'paid', 'commission.paidAt': { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        subscriptions: { total: subsAgg?.total || 0, count: subsAgg?.count || 0 },
        commission: {
          total: commAgg?.total || 0,
          paid: commAgg?.paid || 0,
          pending: commAgg?.pending || 0,
          count: commAgg?.count || 0,
        },
        thisMonthCommission: thisMonthAgg?.total || 0,
        totalVolume: (subsAgg?.total || 0) + (commAgg?.total || 0),
      },
    });
  } catch (err) {
    console.error('paymentStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load payment stats' });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
exports.exportCsv = async (req, res) => {
  try {
    const subs = await Technician.find({ 'subscription.payments.0': { $exists: true } })
      .populate('userId', 'firstName lastName email')
      .lean();
    const comms = await Booking.find({ 'commission.amount': { $gt: 0 } })
      .populate('technicianId.userId', 'firstName lastName email')
      .lean();

    const rows = [
      ['Type', 'Description', 'User', 'Email', 'Amount (KES)', 'Status', 'Method', 'Reference', 'Date'],
    ];

    subs.forEach((t) => {
      (t.subscription?.payments || []).forEach((p) => {
        rows.push([
          'Subscription',
          `Plan: ${t.subscription?.plan || ''}`,
          t.userId ? `${t.userId.firstName} ${t.userId.lastName}` : '',
          t.userId?.email || '',
          p.amount || 0,
          p.status || 'paid',
          p.method || '',
          p.reference || '',
          p.paidAt ? new Date(p.paidAt).toISOString() : '',
        ]);
      });
    });

    comms.forEach((b) => {
      rows.push([
        'Commission',
        `Booking ${b._id.toString()}`,
        b.technicianId?.userId
          ? `${b.technicianId.userId.firstName} ${b.technicianId.userId.lastName}`
          : '',
        b.technicianId?.userId?.email || '',
        b.commission?.amount || 0,
        b.commission?.status || '',
        '',
        b.commission?.reference || '',
        b.commission?.paidAt ? new Date(b.commission.paidAt).toISOString() : '',
      ]);
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportPayments error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};