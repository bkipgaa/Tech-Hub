/**
 * subscriptionAdminController.js
 * ==============================
 * Admin endpoints for monitoring and managing technician subscriptions.
 * 
 * Endpoints:
 *   GET   /api/admin/subscriptions                → paginated list with filters
 *   GET   /api/admin/subscriptions/stats          → aggregate stats
 *   GET   /api/admin/subscriptions/expiring       → technicians expiring in N days
 *   GET   /api/admin/subscriptions/:id            → single subscription detail
 *   PATCH /api/admin/subscriptions/:id/extend     → add days to subscription
 *   PATCH /api/admin/subscriptions/:id/cancel     → force downgrade to free
 *   GET   /api/admin/subscriptions/export         → CSV export
 * 
 * @version 1.0.0
 */

const Technician = require('../../models/Technician');
const User = require('../../models/User');
const { subscriptionPlans, isPlanActive } = require('../../utils/subscriptionPlans');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[subscriptionAdminController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

/**
 * Compute display-ready subscription info for a technician.
 */
const decorateSubscription = (tech, nowMs = Date.now()) => {
  const plan = tech.subscription?.plan || 'free';
  const isPaid = !['free', 'trial'].includes(plan);
  const endDate = tech.subscription?.endDate;
  const startDate = tech.subscription?.startDate;
  const trialEndDate = tech.subscription?.trialEndDate;

  const isActive = isPlanActive(plan, endDate, trialEndDate);

  let daysRemaining = null;
  let expiresAt = null;

  if (isPaid && endDate) {
    expiresAt = new Date(endDate);
    daysRemaining = Math.ceil((expiresAt.getTime() - nowMs) / (1000 * 60 * 60 * 24));
  } else if (plan === 'trial' && trialEndDate) {
    expiresAt = new Date(trialEndDate);
    daysRemaining = Math.ceil((expiresAt.getTime() - nowMs) / (1000 * 60 * 60 * 24));
  }

  return {
    plan,
    planLabel: subscriptionPlans[plan]?.name || plan,
    isPaid,
    isActive,
    price: tech.subscription?.planDetails?.price || subscriptionPlans[plan]?.price || 0,
    visibilityRadius: tech.subscription?.planDetails?.visibilityRadius || 10,
    startDate,
    endDate,
    trialEndDate,
    expiresAt,
    daysRemaining,
    autoRenew: tech.subscription?.autoRenew || false,
    paymentMethod: tech.subscription?.paymentMethod || null,
    lastPaymentDate: tech.subscription?.lastPaymentDate || null,
    nextPaymentDate: tech.subscription?.nextPaymentDate || null,
    paymentHistoryCount: tech.subscription?.paymentHistory?.length || 0,
  };
};

// ─────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────
exports.listSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      plan,
      status, // 'active' | 'expired' | 'expiring' | 'free' | 'paid' | 'all'
      search,
      expiringInDays = 7,
    } = req.query;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const nowMs = Date.now();
    const expiringWindow = parseInt(expiringInDays) || 7;

    // Build base filter
    const filter = {};

    if (plan && plan !== 'all') {
      filter['subscription.plan'] = plan;
    }

    // Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const userIds = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }],
      }).distinct('_id');

      filter.$or = [
        { businessName: regex },
        { userId: { $in: userIds } },
      ];
    }

    // Status filter
    if (status === 'free') {
      filter['subscription.plan'] = 'free';
    } else if (status === 'paid') {
      filter['subscription.plan'] = { $nin: ['free', 'trial'] };
    } else if (status === 'active') {
      filter['subscription.plan'] = { $nin: ['free', 'trial'] };
      filter['subscription.endDate'] = { $gt: new Date(nowMs) };
    } else if (status === 'expired') {
      filter['subscription.plan'] = { $nin: ['free', 'trial'] };
      filter['subscription.endDate'] = { $lte: new Date(nowMs) };
    } else if (status === 'expiring') {
      const upper = new Date(nowMs + expiringWindow * 24 * 60 * 60 * 1000);
      filter['subscription.plan'] = { $nin: ['free', 'trial'] };
      filter['subscription.endDate'] = { $gt: new Date(nowMs), $lte: upper };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [techs, total] = await Promise.all([
      Technician.find(filter)
        .populate('userId', 'firstName lastName email phone profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Technician.countDocuments(filter),
    ]);

    const data = techs.map((t) => ({
      _id: t._id,
      user: t.userId,
      businessName: t.businessName,
      mainCategory: t.mainCategory,
      subscriptionStatus: decorateSubscription(t, nowMs),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch subscriptions.');
  }
};

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const nowMs = Date.now();
    const now = new Date(nowMs);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const techs = await Technician.find()
      .select('subscription')
      .lean();

    let activePaid = 0;
    let expiredPaid = 0;
    let free = 0;
    let trial = 0;
    let expiringSoon = 0;
    let mrr = 0; // monthly recurring revenue

    techs.forEach((t) => {
      const plan = t.subscription?.plan || 'free';
      const endDate = t.subscription?.endDate;
      const trialEndDate = t.subscription?.trialEndDate;
      const isActive = isPlanActive(plan, endDate, trialEndDate);

      if (plan === 'free') {
        free++;
      } else if (plan === 'trial') {
        trial++;
      } else if (isActive) {
        activePaid++;
        mrr += t.subscription?.planDetails?.price || subscriptionPlans[plan]?.price || 0;
        if (endDate) {
          const days = (new Date(endDate).getTime() - nowMs) / (1000 * 60 * 60 * 24);
          if (days > 0 && days <= 7) expiringSoon++;
        }
      } else {
        expiredPaid++;
      }
    });

    // Revenue this month from payment history
    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    techs.forEach((t) => {
      const history = t.subscription?.paymentHistory || [];
      history.forEach((p) => {
        if (!p.date) return;
        const date = new Date(p.date);
        if (date >= startOfMonth) {
          revenueThisMonth += p.amount || 0;
        } else {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (date >= lastMonthStart && date < startOfMonth) {
            revenueLastMonth += p.amount || 0;
          }
        }
      });
    });

    const growth = revenueLastMonth > 0
      ? Number((((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        total: techs.length,
        activePaid,
        expiredPaid,
        free,
        trial,
        expiringSoon,
        mrr,
        revenue: {
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          growth,
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to load subscription stats.');
  }
};

// ─────────────────────────────────────────────────────────────
// EXPIRING SOON
// ─────────────────────────────────────────────────────────────
exports.getExpiringSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const nowMs = Date.now();
    const upper = new Date(nowMs + days * 24 * 60 * 60 * 1000);

    const techs = await Technician.find({
      'subscription.plan': { $nin: ['free', 'trial'] },
      'subscription.endDate': { $gt: new Date(nowMs), $lte: upper },
    })
      .populate('userId', 'firstName lastName email phone profileImage')
      .sort({ 'subscription.endDate': 1 })
      .limit(100)
      .lean();

    const data = techs.map((t) => ({
      _id: t._id,
      user: t.userId,
      businessName: t.businessName,
      subscriptionStatus: decorateSubscription(t, nowMs),
    }));

    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to load expiring subscriptions.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getSubscriptionDetail = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage createdAt')
      .lean();

    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    res.json({
      success: true,
      data: {
        _id: tech._id,
        user: tech.userId,
        businessName: tech.businessName,
        mainCategory: tech.mainCategory,
        subscription: tech.subscription,
        subscriptionStatus: decorateSubscription(tech),
        paymentHistory: tech.subscription?.paymentHistory || [],
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch subscription.');
  }
};

// ─────────────────────────────────────────────────────────────
// EXTEND
// ─────────────────────────────────────────────────────────────
exports.extendSubscription = async (req, res) => {
  try {
    const { days } = req.body;
    const daysNum = parseInt(days);

    if (!daysNum || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_DAYS',
        message: 'Days must be between 1 and 365.',
      });
    }

    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    const plan = tech.subscription?.plan;
    if (!plan || ['free', 'trial'].includes(plan)) {
      return res.status(400).json({
        success: false,
        code: 'NO_PAID_PLAN',
        message: 'Technician does not have a paid plan to extend.',
      });
    }

    const base = tech.subscription.endDate && new Date(tech.subscription.endDate) > new Date()
      ? new Date(tech.subscription.endDate)
      : new Date();

    base.setDate(base.getDate() + daysNum);
    tech.subscription.endDate = base;
    tech.subscription.nextPaymentDate = base;

    await tech.save();

    res.json({
      success: true,
      message: `Subscription extended by ${daysNum} day(s).`,
      data: { endDate: tech.subscription.endDate },
    });
  } catch (error) {
    handleError(res, error, 'Failed to extend subscription.');
  }
};

// ─────────────────────────────────────────────────────────────
// CANCEL (force downgrade to free)
// ─────────────────────────────────────────────────────────────
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    if (!tech.subscription?.plan || tech.subscription.plan === 'free') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_FREE',
        message: 'Technician is already on the free plan.',
      });
    }

    // Preserve payment history
    const history = tech.subscription.paymentHistory || [];

    tech.subscription = {
      plan: 'free',
      planDetails: subscriptionPlans.free,
      startDate: new Date(),
      endDate: null,
      isTrial: false,
      autoRenew: false,
      paymentHistory: history,
    };
    tech.serviceRadius = subscriptionPlans.free.visibilityRadius;

    await tech.save();

    res.json({
      success: true,
      message: `Subscription cancelled${reason ? `: ${reason}` : ''}. Downgraded to Free plan.`,
      data: { plan: 'free' },
    });
  } catch (error) {
    handleError(res, error, 'Failed to cancel subscription.');
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORT (CSV)
// ─────────────────────────────────────────────────────────────
exports.exportSubscriptions = async (req, res) => {
  try {
    const nowMs = Date.now();

    const techs = await Technician.find()
      .populate('userId', 'firstName lastName email phone')
      .select('userId businessName mainCategory subscription serviceRadius')
      .lean();

    // Build CSV
    const header = [
      'Technician ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Business Name',
      'Main Category',
      'Plan',
      'Price',
      'Is Active',
      'Start Date',
      'End Date',
      'Days Remaining',
      'Auto Renew',
      'Payment Method',
    ];

    const rows = techs.map((t) => {
      const info = decorateSubscription(t, nowMs);
      return [
        t._id,
        t.userId?.firstName || '',
        t.userId?.lastName || '',
        t.userId?.email || '',
        t.userId?.phone || '',
        (t.businessName || '').replace(/,/g, ' '),
        t.mainCategory || '',
        info.plan,
        info.price,
        info.isActive ? 'Yes' : 'No',
        info.startDate ? new Date(info.startDate).toISOString().slice(0, 10) : '',
        info.endDate ? new Date(info.endDate).toISOString().slice(0, 10) : '',
        info.daysRemaining === null ? '' : info.daysRemaining,
        info.autoRenew ? 'Yes' : 'No',
        info.paymentMethod || '',
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    handleError(res, error, 'Failed to export subscriptions.');
  }
};