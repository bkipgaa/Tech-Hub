/**
 * dashboardController.js
 * ======================
 * Aggregated stats for the admin dashboard.
 * 
 * Endpoints:
 *   GET /api/admin/dashboard/stats
 *   GET /api/admin/dashboard/revenue-timeline
 *   GET /api/admin/dashboard/subscription-breakdown
 *   GET /api/admin/dashboard/recent-activity
 * 
 * @version 1.0.0
 */

const User = require('../../models/User');
const Technician = require('../../models/Technician');
const Booking = require('../../models/Booking');
const Job = require('../../models/Job');
const AdminUser = require('../../models/AdminUser');
const ActivityLog = require('../../models/ActivityLog');
const { isPlanActive } = require('../../utils/subscriptionPlans');

// ─────────────────────────────────────────────────────────────
// MAIN STATS
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ── User counts ────────────────────────────────────────
    const [totalUsers, totalTechnicians, totalClients, totalAdmins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'technician' }),
      User.countDocuments({ role: 'client' }),
      AdminUser.countDocuments({ isActive: true }),
    ]);

    // ── Subscription breakdown ────────────────────────────
    const techs = await Technician.find().select('subscription serviceRadius').lean();
    const nowMs = now.getTime();
    const activeSubs = techs.filter(t =>
      isPlanActive(t.subscription?.plan, t.subscription?.endDate, t.subscription?.trialEndDate)
    );
    const paidSubs = techs.filter(t =>
      t.subscription?.plan &&
      !['free', 'trial'].includes(t.subscription.plan) &&
      t.subscription?.endDate &&
      new Date(t.subscription.endDate).getTime() > nowMs
    );
    const expiringSoon = techs.filter(t => {
      const end = t.subscription?.endDate;
      if (!end) return false;
      const days = (new Date(end).getTime() - nowMs) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 7;
    });

    // ── Revenue (subscription payments this/last month) ───
    const revenueThisMonth = paidSubs
      .filter(t => t.subscription.startDate && new Date(t.subscription.startDate) >= startOfMonth)
      .reduce((sum, t) => sum + (t.subscription.planDetails?.price || 0), 0);

    const revenueLastMonth = paidSubs
      .filter(t => {
        const start = new Date(t.subscription.startDate);
        return start >= startOfLastMonth && start <= endOfLastMonth;
      })
      .reduce((sum, t) => sum + (t.subscription.planDetails?.price || 0), 0);

    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    // ── Bookings ──────────────────────────────────────────
    const [bookingsThisMonth, totalBookings, completedBookings, pendingBookings] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: { $in: ['pending', 'quoted', 'agreed'] } }),
    ]);

    // ── Commission aggregation ────────────────────────────
    const commissionAgg = await Booking.aggregate([
      { $match: { 'commission.status': { $in: ['pending', 'invoiced'] } } },
      {
        $group: {
          _id: '$commission.status',
          total: { $sum: '$commission.amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const pendingCommission = commissionAgg.find(c => c._id === 'pending')?.total || 0;
    const invoicedCommission = commissionAgg.find(c => c._id === 'invoiced')?.total || 0;

    // ── Jobs ──────────────────────────────────────────────
    let pendingJobs = 0;
    let activeJobs = 0;
    try {
      [pendingJobs, activeJobs] = await Promise.all([
        Job.countDocuments({ status: 'pending' }),
        Job.countDocuments({ status: { $in: ['active', 'approved'] } }),
      ]);
    } catch {
      // Job model may not have those statuses — ignore
    }

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, technicians: totalTechnicians, clients: totalClients, admins: totalAdmins },
        subscriptions: {
          active: activeSubs.length,
          paid: paidSubs.length,
          expiringSoon: expiringSoon.length,
          total: techs.length,
        },
        revenue: {
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          growth: Number(revenueGrowth.toFixed(1)),
        },
        bookings: {
          thisMonth: bookingsThisMonth,
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
        },
        commission: {
          pending: pendingCommission,
          invoiced: invoicedCommission,
        },
        jobs: { pending: pendingJobs, active: activeJobs },
      },
    });
  } catch (error) {
    console.error('[dashboardController.getStats]', error);
    res.status(500).json({ success: false, message: 'Failed to load stats.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// REVENUE TIMELINE (last 6 months)
// ─────────────────────────────────────────────────────────────
exports.getRevenueTimeline = async (req, res) => {
  try {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const subsAgg = await Technician.aggregate([
        { $match: { 'subscription.startDate': { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$subscription.planDetails.price' } } },
      ]);

      const commAgg = await Booking.aggregate([
        { $match: { 'commission.invoicedAt': { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]);

      months.push({
        month: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        monthShort: start.toLocaleString('en-US', { month: 'short' }),
        subscription: subsAgg[0]?.total || 0,
        commission: commAgg[0]?.total || 0,
        total: (subsAgg[0]?.total || 0) + (commAgg[0]?.total || 0),
      });
    }

    res.json({ success: true, data: months });
  } catch (error) {
    console.error('[dashboardController.getRevenueTimeline]', error);
    res.status(500).json({ success: false, message: 'Failed to load revenue timeline.' });
  }
};

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION BREAKDOWN (by plan)
// ─────────────────────────────────────────────────────────────
exports.getSubscriptionBreakdown = async (req, res) => {
  try {
    const breakdown = await Technician.aggregate([
      { $match: { 'subscription.plan': { $exists: true } } },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const planLabels = {
      free: 'Free',
      trial: 'Trial',
      test: 'Test',
      basic: 'Basic',
      basicPlus: 'Basic-Plus',
      premium: 'Premium',
      business: 'Business',
      enterprise: 'Enterprise',
      unlimited: 'Unlimited',
    };

    const data = breakdown.map(item => ({
      plan: item._id,
      label: planLabels[item._id] || item._id,
      count: item.count,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[dashboardController.getSubscriptionBreakdown]', error);
    res.status(500).json({ success: false, message: 'Failed to load subscription breakdown.' });
  }
};

// ─────────────────────────────────────────────────────────────
// RECENT ACTIVITY (last 10 events)
// ─────────────────────────────────────────────────────────────
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 10, 50))
      .lean();

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('[dashboardController.getRecentActivity]', error);
    res.status(500).json({ success: false, message: 'Failed to load activity.' });
  }
};