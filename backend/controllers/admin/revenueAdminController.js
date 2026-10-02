/**
 * revenueController.js
 * ====================
 * Read-only revenue analytics for the admin dashboard.
 * Sources of revenue:
 *   - Subscription payments (paid plan purchases/renewals)
 *   - Commission payments (5% of labor, marked paid)
 *
 * Mounted at: /api/admin/revenue
 */

const Booking = require('../../models/Booking');
const Technician = require('../../models/Technician');
const User = require('../../models/User');

// ── Helpers ───────────────────────────────────────────────
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthsBack = (n) => {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      year: x.getFullYear(),
      month: x.getMonth(),
      monthShort: x.toLocaleString('en-KE', { month: 'short' }),
      start: new Date(x.getFullYear(), x.getMonth(), 1),
      end: new Date(x.getFullYear(), x.getMonth() + 1, 1),
    });
  }
  return out;
};

// ═══════════════════════════════════════════════════════════
// OVERVIEW — top cards
// ═══════════════════════════════════════════════════════════
exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [
      thisMonthSubsAgg,
      lastMonthSubsAgg,
      thisMonthCommAgg,
      lastMonthCommAgg,
      allTimeSubsAgg,
      allTimeCommAgg,
      pendingCommAgg,
      activeSubsCount,
    ] = await Promise.all([
      // Subscription revenue (technicians with subscription payments in this month)
      Technician.aggregate([
        { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
        { $match: { 'subscription.payments.paidAt': { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$subscription.payments.amount' } } },
      ]),
      Technician.aggregate([
        { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
        {
          $match: {
            'subscription.payments.paidAt': { $gte: lastMonthStart, $lt: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$subscription.payments.amount' } } },
      ]),
      // Commission received this month
      Booking.aggregate([
        { $match: { 'commission.status': 'paid', 'commission.paidAt': { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            'commission.status': 'paid',
            'commission.paidAt': { $gte: lastMonthStart, $lt: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
      // All-time
      Technician.aggregate([
        { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, total: { $sum: '$subscription.payments.amount' } } },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
      // Pending commission (owed by technicians)
      Booking.aggregate([
        { $match: { 'commission.status': { $in: ['pending', 'invoiced'] } } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
      // Active paid subscriptions
      Technician.countDocuments({
        'subscription.plan': { $nin: ['free', 'trial'] },
        'subscription.isActive': true,
      }),
    ]);

    const thisSub = thisMonthSubsAgg[0]?.total || 0;
    const lastSub = lastMonthSubsAgg[0]?.total || 0;
    const thisComm = thisMonthCommAgg[0]?.total || 0;
    const lastComm = lastMonthCommAgg[0]?.total || 0;

    const thisMonthTotal = thisSub + thisComm;
    const lastMonthTotal = lastSub + lastComm;
    const growth =
      lastMonthTotal === 0
        ? thisMonthTotal > 0 ? 100 : 0
        : Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);

    res.json({
      success: true,
      data: {
        thisMonth: {
          total: thisMonthTotal,
          subscriptions: thisSub,
          commission: thisComm,
        },
        lastMonth: {
          total: lastMonthTotal,
          subscriptions: lastSub,
          commission: lastComm,
        },
        growth,
        allTime: {
          total: (allTimeSubsAgg[0]?.total || 0) + (allTimeCommAgg[0]?.total || 0),
          subscriptions: allTimeSubsAgg[0]?.total || 0,
          commission: allTimeCommAgg[0]?.total || 0,
        },
        pendingCommission: pendingCommAgg[0]?.total || 0,
        activeSubscriptions: activeSubsCount,
      },
    });
  } catch (err) {
    console.error('getRevenueOverview error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue overview' });
  }
};

// ═══════════════════════════════════════════════════════════
// TIMELINE — 6 month chart
// ═══════════════════════════════════════════════════════════
exports.getTimeline = async (req, res) => {
  try {
    const months = monthsBack(6);

    const [subs, comms] = await Promise.all([
      Technician.aggregate([
        { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
        { $match: { 'subscription.payments.paidAt': { $gte: months[0].start } } },
        {
          $group: {
            _id: {
              y: { $year: '$subscription.payments.paidAt' },
              m: { $month: '$subscription.payments.paidAt' },
            },
            total: { $sum: '$subscription.payments.amount' },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'paid', 'commission.paidAt': { $gte: months[0].start } } },
        {
          $group: {
            _id: { y: { $year: '$commission.paidAt' }, m: { $month: '$commission.paidAt' } },
            total: { $sum: '$commission.amount' },
          },
        },
      ]),
    ]);

    const pick = (arr, m) =>
      arr.find((x) => x._id.y === m.year && x._id.m === m.month + 1)?.total || 0;

    const data = months.map((m) => {
      const subscriptions = pick(subs, m);
      const commission = pick(comms, m);
      return {
        month: m.monthShort,
        monthShort: m.monthShort,
        year: m.year,
        subscriptions,
        commission,
        total: subscriptions + commission,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('getRevenueTimeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue timeline' });
  }
};

// ═══════════════════════════════════════════════════════════
// BREAKDOWN — by plan / by source
// ═══════════════════════════════════════════════════════════
exports.getBreakdown = async (req, res) => {
  try {
    const [byPlan, totals] = await Promise.all([
      Technician.aggregate([
        { $match: { 'subscription.plan': { $nin: ['free'] } } },
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 },
            revenue: { $sum: '$subscription.planDetails.price' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
    ]);

    const LABELS = {
      trial: 'Trial',
      basic: 'Basic',
      basicPlus: 'Basic-Plus',
      premium: 'Premium',
      business: 'Business',
      enterprise: 'Enterprise',
      unlimited: 'Unlimited',
    };

    const data = byPlan.map((r) => ({
      plan: r._id,
      label: LABELS[r._id] || r._id,
      count: r.count,
      revenue: r.revenue,
    }));

    res.json({
      success: true,
      data: {
        byPlan: data,
        commissionTotal: totals[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error('getRevenueBreakdown error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue breakdown' });
  }
};

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS — combined ledger
// ═══════════════════════════════════════════════════════════
exports.getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { from, to, type } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const wantSubs = !type || type === 'subscription';
    const wantComms = !type || type === 'commission';

    const [subs, comms] = await Promise.all([
      wantSubs
        ? Technician.find({ 'subscription.payments.0': { $exists: true } })
            .populate('userId', 'firstName lastName email')
            .lean()
        : [],
      wantComms
        ? Booking.find({ 'commission.amount': { $gt: 0 } })
            .populate('technicianId', 'businessName userId')
            .populate('clientId', 'firstName lastName')
            .lean()
        : [],
    ]);

    const subTxns = subs.flatMap((t) =>
      (t.subscription?.payments || []).map((p) => ({
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
        plan: t.subscription?.plan,
      }))
    );

    const commTxns = comms.map((b) => ({
      _id: `${b._id}-comm`,
      type: 'commission',
      amount: b.commission?.amount || 0,
      status: b.commission?.status || 'pending',
      method: 'mpesa/card',
      date: b.commission?.paidAt || b.completedAt || b.createdAt,
      reference: b.commission?.reference || '',
      user: b.technicianId?.userId
        ? {
            firstName: b.technicianId.userId.firstName,
            lastName: b.technicianId.userId.lastName,
            email: b.technicianId.userId.email,
          }
        : null,
      bookingId: b._id,
    }));

    let all = [...subTxns, ...commTxns];

    if (Object.keys(dateFilter).length) {
      all = all.filter((t) => {
        const d = new Date(t.date);
        if (dateFilter.$gte && d < dateFilter.$gte) return false;
        if (dateFilter.$lte && d > dateFilter.$lte) return false;
        return true;
      });
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
    console.error('getRevenueTransactions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════════
exports.exportRevenue = async (req, res) => {
  try {
    const months = monthsBack(12);
    const [subs, comms] = await Promise.all([
      Technician.aggregate([
        { $unwind: { path: '$subscription.payments', preserveNullAndEmptyArrays: false } },
        { $match: { 'subscription.payments.paidAt': { $gte: months[0].start } } },
        {
          $group: {
            _id: {
              y: { $year: '$subscription.payments.paidAt' },
              m: { $month: '$subscription.payments.paidAt' },
            },
            total: { $sum: '$subscription.payments.amount' },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'paid', 'commission.paidAt': { $gte: months[0].start } } },
        {
          $group: {
            _id: { y: { $year: '$commission.paidAt' }, m: { $month: '$commission.paidAt' } },
            total: { $sum: '$commission.amount' },
          },
        },
      ]),
    ]);

    const pick = (arr, m) =>
      arr.find((x) => x._id.y === m.year && x._id.m === m.month + 1)?.total || 0;

    const rows = [
      ['Month', 'Year', 'Subscriptions (KES)', 'Commission (KES)', 'Total (KES)'],
      ...months.map((m) => {
        const s = pick(subs, m);
        const c = pick(comms, m);
        return [`${m.monthShort}`, m.year, s, c, s + c];
      }),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportRevenue error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};