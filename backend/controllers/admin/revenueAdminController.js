/**
 * revenueController.js
 * ====================
 * Read-only revenue analytics for the admin dashboard.
 *
 * Revenue sources:
 *   - Subscription plan payments (real `subscription.payments[]` records
 *     OR, as a fallback, the current plan's price when no payment record
 *     exists — this keeps legacy/synthetic data visible).
 *   - Commission payments (5% of labor, marked "paid").
 *
 * Query params:
 *   period = day | week | month | year | all     (default: month)
 *
 * Mounted at: /api/admin/revenue
 */

const Booking = require('../../models/Booking');
const Technician = require('../../models/Technician');

// ═══════════════════════════════════════════════════════════
// PERIOD HELPERS
// ═══════════════════════════════════════════════════════════
const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const startOfWeek = (d = new Date()) => {
  // Week starts Monday
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Mon = 0
  const s = startOfDay(d);
  s.setDate(s.getDate() - diff);
  return s;
};

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const startOfYear = (d = new Date()) =>
  new Date(d.getFullYear(), 0, 1);

/**
 * Given a `period`, return:
 *   - rangeStart, rangeEnd  → the window used for the "current" totals
 *   - prevStart, prevEnd    → the equivalent previous window (for growth %)
 *   - buckets               → array of { label, start, end } for the chart
 *   - groupLabel            → human description
 */
function buildPeriod(period) {
  const now = new Date();

  switch (period) {
    // ── TODAY ─────────────────────────────────────────────
    case 'day': {
      const rangeStart = startOfDay(now);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 1);

      const prevStart = new Date(rangeStart);
      prevStart.setDate(prevStart.getDate() - 1);
      const prevEnd = new Date(rangeStart);

      const buckets = [];
      for (let h = 0; h < 24; h++) {
        const b = new Date(rangeStart);
        b.setHours(h);
        const e = new Date(rangeStart);
        e.setHours(h + 1);
        buckets.push({ label: `${String(h).padStart(2, '0')}:00`, start: b, end: e });
      }
      return { rangeStart, rangeEnd, prevStart, prevEnd, buckets, groupLabel: 'Today' };
    }

    // ── LAST 7 DAYS ───────────────────────────────────────
    case 'week': {
      const rangeStart = startOfWeek(now);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 7);

      const prevStart = new Date(rangeStart);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevEnd = new Date(rangeStart);

      const buckets = [];
      for (let i = 0; i < 7; i++) {
        const b = new Date(rangeStart);
        b.setDate(b.getDate() + i);
        const e = new Date(b);
        e.setDate(e.getDate() + 1);
        buckets.push({
          label: b.toLocaleDateString('en-KE', { weekday: 'short' }),
          start: b,
          end: e,
        });
      }
      return { rangeStart, rangeEnd, prevStart, prevEnd, buckets, groupLabel: 'This week' };
    }

    // ── THIS YEAR ─────────────────────────────────────────
    case 'year': {
      const rangeStart = startOfYear(now);
      const rangeEnd = new Date(now.getFullYear() + 1, 0, 1);

      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear(), 0, 1);

      const buckets = [];
      for (let m = 0; m < 12; m++) {
        const b = new Date(now.getFullYear(), m, 1);
        const e = new Date(now.getFullYear(), m + 1, 1);
        buckets.push({
          label: b.toLocaleDateString('en-KE', { month: 'short' }),
          start: b,
          end: e,
        });
      }
      return { rangeStart, rangeEnd, prevStart, prevEnd, buckets, groupLabel: 'This year' };
    }

    // ── LAST 12 MONTHS ────────────────────────────────────
    case 'all': {
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const prevStart = new Date(now.getFullYear(), now.getMonth() - 23, 1);
      const prevEnd = new Date(rangeStart);

      const buckets = [];
      for (let i = 11; i >= 0; i--) {
        const b = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        buckets.push({
          label: b.toLocaleDateString('en-KE', { month: 'short' }),
          start: b,
          end: e,
        });
      }
      return {
        rangeStart,
        rangeEnd,
        prevStart,
        prevEnd,
        buckets,
        groupLabel: 'Last 12 months',
      };
    }

    // ── THIS MONTH (default) ──────────────────────────────
    case 'month':
    default: {
      const rangeStart = startOfMonth(now);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(rangeStart);

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const buckets = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const b = new Date(now.getFullYear(), now.getMonth(), d);
        const e = new Date(now.getFullYear(), now.getMonth(), d + 1);
        buckets.push({ label: String(d), start: b, end: e });
      }
      return {
        rangeStart,
        rangeEnd,
        prevStart,
        prevEnd,
        buckets,
        groupLabel: 'This month',
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EVENT COLLECTORS
// Produce a flat list of { date, amount, type, status, user, ... }
// so every endpoint can slice the same stream.
// ═══════════════════════════════════════════════════════════

/**
 * Every paid-plan subscription contributes one or more events.
 * Preference order:
 *   1. Real `subscription.payments[]` entries (each with paidAt).
 *   2. Fallback: current plan's price, dated at subscription.startDate
 *      (or technician.updatedAt / createdAt if startDate is missing).
 *      This makes legacy data show up even without payment records.
 */
async function collectSubscriptionEvents() {
  const techs = await Technician.find({
    'subscription.plan': { $nin: ['free', null, undefined] },
  })
    .populate('userId', 'firstName lastName email')
    .lean();

  const events = [];

  techs.forEach((t) => {
    const s = t.subscription || {};
    const plan = s.plan;
    const price = s.planDetails?.price || 0;
    const payments = Array.isArray(s.payments) ? s.payments : [];

    if (payments.length > 0) {
      payments.forEach((p) => {
        if (!p || !p.paidAt) return;
        events.push({
          _id: `${t._id}-${p._id || Math.random().toString(36).slice(2)}`,
          type: 'subscription',
          amount: Number(p.amount) || 0,
          status: p.status || 'paid',
          method: p.method || 'unknown',
          date: new Date(p.paidAt),
          reference: p.reference || '',
          user: t.userId
            ? { firstName: t.userId.firstName, lastName: t.userId.lastName, email: t.userId.email }
            : null,
          plan,
          planLabel: s.planDetails?.name || plan,
          label: `Subscription (${plan || 'plan'})`,
          synthesized: false,
        });
      });
      return;
    }

    // Fallback — synthetic from plan
    if (price > 0) {
      const date =
        s.startDate
          ? new Date(s.startDate)
          : t.updatedAt
          ? new Date(t.updatedAt)
          : t.createdAt
          ? new Date(t.createdAt)
          : new Date();
      events.push({
        _id: `${t._id}-plan`,
        type: 'subscription',
        amount: price,
        status: 'paid',
        method: 'unknown',
        date,
        reference: '',
        user: t.userId
          ? { firstName: t.userId.firstName, lastName: t.userId.lastName, email: t.userId.email }
          : null,
        plan,
        planLabel: s.planDetails?.name || plan,
        label: `Subscription (${plan || 'plan'})`,
        synthesized: true,
      });
    }
  });

  return events;
}

/**
 * Commissions live on bookings. Only those with an amount > 0.
 * A commission is "paid" when commission.status === 'paid'.
 * The date used is paidAt (paid) or createdAt (pending).
 */
async function collectCommissionEvents() {
  const bookings = await Booking.find({ 'commission.amount': { $gt: 0 } })
    .populate({
      path: 'technicianId',
      select: 'businessName userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    })
    .lean();

  return bookings.map((b) => ({
    _id: `${b._id}-comm`,
    type: 'commission',
    amount: b.commission?.amount || 0,
    status: b.commission?.status || 'pending',
    method: 'mpesa/card',
    date: b.commission?.paidAt
      ? new Date(b.commission.paidAt)
      : b.completedAt
      ? new Date(b.completedAt)
      : new Date(b.createdAt),
    reference: b.commission?.reference || '',
    user: b.technicianId?.userId
      ? {
          firstName: b.technicianId.userId.firstName,
          lastName: b.technicianId.userId.lastName,
          email: b.technicianId.userId.email,
        }
      : null,
    bookingId: b._id,
    label: `Commission — ${b.serviceCategory || ''}${
      b.subService ? ' / ' + b.subService : ''
    }`,
    paidAt: b.commission?.paidAt ? new Date(b.commission.paidAt) : null,
  }));
}

const within = (d, start, end) => d && d >= start && d < end;

// ═══════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════
exports.getOverview = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const { rangeStart, rangeEnd, prevStart, prevEnd, groupLabel } = buildPeriod(period);

    const [subEvents, commEvents] = await Promise.all([
      collectSubscriptionEvents(),
      collectCommissionEvents(),
    ]);

    // Sum over a window
    const sumInWindow = (events, start, end, filter) =>
      events.reduce((total, e) => {
        if (!within(e.date, start, end)) return total;
        if (filter && !filter(e)) return total;
        return total + (Number(e.amount) || 0);
      }, 0);

    // Current window
    const thisSubs = sumInWindow(subEvents, rangeStart, rangeEnd);
    const thisComms = sumInWindow(commEvents, rangeStart, rangeEnd, (e) => e.status === 'paid');

    // Previous window (for growth %)
    const prevSubs = sumInWindow(subEvents, prevStart, prevEnd);
    const prevComms = sumInWindow(commEvents, prevStart, prevEnd, (e) => e.status === 'paid');

    const thisTotal = thisSubs + thisComms;
    const prevTotal = prevSubs + prevComms;
    const growth =
      prevTotal === 0
        ? thisTotal > 0
          ? 100
          : 0
        : Math.round(((thisTotal - prevTotal) / prevTotal) * 100);

    // All-time
    const allSubs = subEvents.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const allCommsPaid = commEvents
      .filter((e) => e.status === 'paid')
      .reduce((a, e) => a + (Number(e.amount) || 0), 0);

    // Pending commission (all-time, not windowed)
    const pendingCommission = commEvents
      .filter((e) => e.status === 'pending' || e.status === 'invoiced')
      .reduce((a, e) => a + (Number(e.amount) || 0), 0);

    // Active paid subscriptions
    const activeSubscriptions = await Technician.countDocuments({
      'subscription.plan': { $nin: ['free', 'trial', null] },
      'subscription.isActive': true,
    });

    res.json({
      success: true,
      data: {
        period,
        groupLabel,
        rangeStart,
        rangeEnd,
        thisMonth: {
          // keep the legacy key so the existing frontend works
          total: thisTotal,
          subscriptions: thisSubs,
          commission: thisComms,
        },
        lastMonth: {
          total: prevTotal,
          subscriptions: prevSubs,
          commission: prevComms,
        },
        growth,
        allTime: {
          total: allSubs + allCommsPaid,
          subscriptions: allSubs,
          commission: allCommsPaid,
        },
        pendingCommission,
        activeSubscriptions,
      },
    });
  } catch (err) {
    console.error('getRevenueOverview error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue overview' });
  }
};

// ═══════════════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════════════
exports.getTimeline = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const { buckets } = buildPeriod(period);

    const [subEvents, commEvents] = await Promise.all([
      collectSubscriptionEvents(),
      collectCommissionEvents(),
    ]);

    const data = buckets.map((b) => {
      const subscriptions = subEvents
        .filter((e) => within(e.date, b.start, b.end))
        .reduce((a, e) => a + (Number(e.amount) || 0), 0);

      const commission = commEvents
        .filter((e) => e.status === 'paid' && within(e.date, b.start, b.end))
        .reduce((a, e) => a + (Number(e.amount) || 0), 0);

      return {
        month: b.label,
        monthShort: b.label,
        subscriptions,
        commission,
        total: subscriptions + commission,
      };
    });

    res.json({ success: true, data, period });
  } catch (err) {
    console.error('getRevenueTimeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue timeline' });
  }
};

// ═══════════════════════════════════════════════════════════
// BREAKDOWN — by plan
// ═══════════════════════════════════════════════════════════
exports.getBreakdown = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const { rangeStart, rangeEnd } = buildPeriod(period);

    const [subEvents, commEvents] = await Promise.all([
      collectSubscriptionEvents(),
      collectCommissionEvents(),
    ]);

    // Group subscription revenue by plan within the window
    const byPlanMap = new Map();
    subEvents
      .filter((e) => within(e.date, rangeStart, rangeEnd))
      .forEach((e) => {
        const key = e.plan || 'unknown';
        const entry = byPlanMap.get(key) || {
          plan: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          count: 0,
          revenue: 0,
        };
        entry.count += 1;
        entry.revenue += Number(e.amount) || 0;
        byPlanMap.set(key, entry);
      });

    const byPlan = Array.from(byPlanMap.values()).sort((a, b) => b.revenue - a.revenue);

    const commissionTotal = commEvents
      .filter((e) => e.status === 'paid' && within(e.date, rangeStart, rangeEnd))
      .reduce((a, e) => a + (Number(e.amount) || 0), 0);

    res.json({
      success: true,
      data: { byPlan, commissionTotal },
      period,
    });
  } catch (err) {
    console.error('getRevenueBreakdown error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue breakdown' });
  }
};

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS — combined ledger with filters
// ═══════════════════════════════════════════════════════════
exports.getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const period = req.query.period || 'month';
    const { rangeStart, rangeEnd } = buildPeriod(period);
    const { type } = req.query;

    const [subEvents, commEvents] = await Promise.all([
      collectSubscriptionEvents(),
      collectCommissionEvents(),
    ]);

    let all = [...subEvents, ...commEvents].filter((e) =>
      within(e.date, rangeStart, rangeEnd)
    );

    if (type === 'subscription') all = all.filter((e) => e.type === 'subscription');
    if (type === 'commission') all = all.filter((e) => e.type === 'commission');

    all.sort((a, b) => b.date - a.date);

    const total = all.length;
    const items = all.slice(skip, skip + limit);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      period,
    });
  } catch (err) {
    console.error('getRevenueTransactions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORT CSV — same buckets as the timeline
// ═══════════════════════════════════════════════════════════
exports.exportRevenue = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const { buckets } = buildPeriod(period);

    const [subEvents, commEvents] = await Promise.all([
      collectSubscriptionEvents(),
      collectCommissionEvents(),
    ]);

    const rows = [
      [`Period: ${period}`],
      ['Bucket', 'Subscriptions (KES)', 'Commission (KES)', 'Total (KES)'],
      ...buckets.map((b) => {
        const s = subEvents
          .filter((e) => within(e.date, b.start, b.end))
          .reduce((a, e) => a + (Number(e.amount) || 0), 0);
        const c = commEvents
          .filter((e) => e.status === 'paid' && within(e.date, b.start, b.end))
          .reduce((a, e) => a + (Number(e.amount) || 0), 0);
        return [b.label, s, c, s + c];
      }),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="revenue-${period}-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (err) {
    console.error('exportRevenue error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};