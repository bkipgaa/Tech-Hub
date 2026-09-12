/**
 * seedAdminRoles.js
 * =================
 * Seeds permissions, roles, and a super admin.
 * Run once: node scripts/seedAdminRoles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const AdminUser = require('../models/AdminUser');

// ─────────────────────────────────────────────────────────────
// PERMISSIONS (grouped by section)
// ─────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // ── 1. Dashboard ────────────────────────────────────────
  { section: 'Dashboard', key: 'dashboard.view',   label: 'View Dashboard',    order: 1 },
  { section: 'Dashboard', key: 'dashboard.export', label: 'Export Dashboard Data', order: 2 },

  // ── 2. Technicians ──────────────────────────────────────
  { section: 'Technicians', key: 'technicians.view',           label: 'View Technicians',          order: 1 },
  { section: 'Technicians', key: 'technicians.view_details',   label: 'View Technician Details',   order: 2 },
  { section: 'Technicians', key: 'technicians.edit',           label: 'Edit Technicians',          order: 3 },
  { section: 'Technicians', key: 'technicians.suspend',        label: 'Suspend Technicians',       order: 4 },
  { section: 'Technicians', key: 'technicians.delete',         label: 'Delete Technicians',        order: 5 },
  { section: 'Technicians', key: 'technicians.impersonate',    label: 'Impersonate Technician',    order: 6 },

  // ── 3. Verifications ────────────────────────────────────
  { section: 'Verifications', key: 'verifications.view',          label: 'View Verifications',        order: 1 },
  { section: 'Verifications', key: 'verifications.approve',       label: 'Approve Verifications',     order: 2 },
  { section: 'Verifications', key: 'verifications.reject',        label: 'Reject Verifications',      order: 3 },
  { section: 'Verifications', key: 'verifications.request_more',  label: 'Request More Info',         order: 4 },

  // ── 4. Subscriptions ────────────────────────────────────
  { section: 'Subscriptions', key: 'subscriptions.view',           label: 'View Subscriptions',           order: 1 },
  { section: 'Subscriptions', key: 'subscriptions.view_details',   label: 'View Subscription Details',    order: 2 },
  { section: 'Subscriptions', key: 'subscriptions.manage',         label: 'Manage Subscriptions',         order: 3 },
  { section: 'Subscriptions', key: 'subscriptions.refund',         label: 'Refund Subscriptions',         order: 4 },
  { section: 'Subscriptions', key: 'subscriptions.export',         label: 'Export Subscriptions',         order: 5 },

  // ── 5. Bookings ─────────────────────────────────────────
  { section: 'Bookings', key: 'bookings.view',             label: 'View Bookings',            order: 1 },
  { section: 'Bookings', key: 'bookings.view_details',     label: 'View Booking Details',     order: 2 },
  { section: 'Bookings', key: 'bookings.manage',           label: 'Manage Bookings',          order: 3 },
  { section: 'Bookings', key: 'bookings.cancel',           label: 'Cancel Bookings',          order: 4 },
  { section: 'Bookings', key: 'bookings.resolve_dispute',  label: 'Resolve Disputes',         order: 5 },
  { section: 'Bookings', key: 'bookings.export',           label: 'Export Bookings',          order: 6 },

  // ── 6. Jobs ─────────────────────────────────────────────
  { section: 'Jobs', key: 'jobs.view',                 label: 'View Jobs',                order: 1 },
  { section: 'Jobs', key: 'jobs.approve',              label: 'Approve Jobs',             order: 2 },
  { section: 'Jobs', key: 'jobs.reject',               label: 'Reject Jobs',              order: 3 },
  { section: 'Jobs', key: 'jobs.edit',                 label: 'Edit Jobs',                order: 4 },
  { section: 'Jobs', key: 'jobs.delete',               label: 'Delete Jobs',              order: 5 },
  { section: 'Jobs', key: 'jobs.view_applications',    label: 'View Applications',        order: 6 },
  { section: 'Jobs', key: 'jobs.manage_applications',  label: 'Manage Applications',      order: 7 },

  // ── 7. Service Catalog ──────────────────────────────────
  { section: 'Service Catalog', key: 'catalog.view',     label: 'View Catalog',           order: 1 },
  { section: 'Service Catalog', key: 'catalog.create',   label: 'Create Catalog Items',   order: 2 },
  { section: 'Service Catalog', key: 'catalog.edit',     label: 'Edit Catalog Items',     order: 3 },
  { section: 'Service Catalog', key: 'catalog.delete',   label: 'Delete Catalog Items',   order: 4 },
  { section: 'Service Catalog', key: 'catalog.reorder',  label: 'Reorder Catalog',        order: 5 },

  // ── 8. Revenue ──────────────────────────────────────────
  { section: 'Revenue', key: 'revenue.view',               label: 'View Revenue',             order: 1 },
  { section: 'Revenue', key: 'revenue.view_transactions',  label: 'View Transactions',        order: 2 },
  { section: 'Revenue', key: 'revenue.export',             label: 'Export Revenue Reports',   order: 3 },

  // ── 9. Commissions ──────────────────────────────────────
  { section: 'Commissions', key: 'commission.view',        label: 'View Commissions',        order: 1 },
  { section: 'Commissions', key: 'commission.manage',      label: 'Manage Commissions',      order: 2 },
  { section: 'Commissions', key: 'commission.mark_paid',   label: 'Mark Commissions Paid',   order: 3 },
  { section: 'Commissions', key: 'commission.waive',       label: 'Waive Commissions',       order: 4 },
  { section: 'Commissions', key: 'commission.export',      label: 'Export Commissions',      order: 5 },

  // ── 10. Payments ────────────────────────────────────────
  { section: 'Payments', key: 'payments.view',     label: 'View Payments',           order: 1 },
  { section: 'Payments', key: 'payments.refund',   label: 'Issue Refunds',           order: 2 },
  { section: 'Payments', key: 'payments.retry',    label: 'Retry Failed Payments',   order: 3 },
  { section: 'Payments', key: 'payments.export',   label: 'Export Payments',         order: 4 },

  // ── 11. Users ───────────────────────────────────────────
  { section: 'Users', key: 'users.view',           label: 'View Users',           order: 1 },
  { section: 'Users', key: 'users.view_details',   label: 'View User Details',    order: 2 },
  { section: 'Users', key: 'users.edit',           label: 'Edit Users',           order: 3 },
  { section: 'Users', key: 'users.suspend',        label: 'Suspend Users',        order: 4 },
  { section: 'Users', key: 'users.delete',         label: 'Delete Users',         order: 5 },
  { section: 'Users', key: 'users.impersonate',    label: 'Impersonate User',     order: 6 },

  // ── 12. Chat ────────────────────────────────────────────
  { section: 'Chat', key: 'chat.view',             label: 'View Conversations',   order: 1 },
  { section: 'Chat', key: 'chat.flag',             label: 'Flag Conversations',   order: 2 },
  { section: 'Chat', key: 'chat.delete_message',   label: 'Delete Messages',      order: 3 },
  { section: 'Chat', key: 'chat.block_user',       label: 'Block Users',          order: 4 },

  // ── 13. Admin Users ─────────────────────────────────────
  { section: 'Admin Users', key: 'admin_users.view',             label: 'View Admin Users',           order: 1 },
  { section: 'Admin Users', key: 'admin_users.create',           label: 'Create Admin Users',         order: 2 },
  { section: 'Admin Users', key: 'admin_users.edit',             label: 'Edit Admin Users',           order: 3 },
  { section: 'Admin Users', key: 'admin_users.delete',           label: 'Delete Admin Users',         order: 4 },
  { section: 'Admin Users', key: 'admin_users.toggle_active',    label: 'Activate/Deactivate Admins', order: 5 },
  { section: 'Admin Users', key: 'admin_users.reset_password',   label: 'Reset Admin Passwords',      order: 6 },

  // ── 14. Roles & Permissions ─────────────────────────────
  { section: 'Roles & Permissions', key: 'roles.view',         label: 'View Roles',          order: 1 },
  { section: 'Roles & Permissions', key: 'roles.create',       label: 'Create Roles',        order: 2 },
  { section: 'Roles & Permissions', key: 'roles.edit',         label: 'Edit Roles',          order: 3 },
  { section: 'Roles & Permissions', key: 'roles.delete',       label: 'Delete Roles',        order: 4 },
  { section: 'Roles & Permissions', key: 'permissions.view',   label: 'View Permissions',    order: 5 },

  // ── 15. Activity Logs ───────────────────────────────────
  { section: 'Activity Logs', key: 'activity.view',     label: 'View Activity Logs',     order: 1 },
  { section: 'Activity Logs', key: 'activity.filter',   label: 'Filter Activity Logs',   order: 2 },
  { section: 'Activity Logs', key: 'activity.export',   label: 'Export Activity Logs',   order: 3 },
  { section: 'Activity Logs', key: 'activity.delete',   label: 'Delete Activity Logs',   order: 4 },

  // ── 16. Notifications ───────────────────────────────────
  { section: 'Notifications', key: 'notifications.view',      label: 'View Notifications',      order: 1 },
  { section: 'Notifications', key: 'notifications.send',      label: 'Send Notifications',      order: 2 },
  { section: 'Notifications', key: 'notifications.schedule',  label: 'Schedule Notifications',  order: 3 },
  { section: 'Notifications', key: 'notifications.delete',    label: 'Delete Notifications',    order: 4 },

  // ── 17. Reports ─────────────────────────────────────────
  { section: 'Reports', key: 'reports.view',     label: 'View Reports',        order: 1 },
  { section: 'Reports', key: 'reports.create',   label: 'Create Reports',      order: 2 },
  { section: 'Reports', key: 'reports.export',   label: 'Export Reports',      order: 3 },

  // ── 18. Support ─────────────────────────────────────────
  { section: 'Support', key: 'support.view',      label: 'View Support Tickets',    order: 1 },
  { section: 'Support', key: 'support.respond',   label: 'Respond to Tickets',      order: 2 },
  { section: 'Support', key: 'support.assign',    label: 'Assign Tickets',          order: 3 },
  { section: 'Support', key: 'support.close',     label: 'Close Tickets',           order: 4 },

  // ── 19. Settings ────────────────────────────────────────
  { section: 'Settings', key: 'settings.view',              label: 'View Settings',              order: 1 },
  { section: 'Settings', key: 'settings.manage',            label: 'Manage Settings',            order: 2 },
  { section: 'Settings', key: 'settings.payment_gateways',  label: 'Manage Payment Gateways',    order: 3 },
  { section: 'Settings', key: 'settings.email',             label: 'Manage Email Settings',      order: 4 },
  { section: 'Settings', key: 'settings.features',          label: 'Toggle Features',            order: 5 },
];

// ─────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────

const allKeys = PERMISSIONS.map(p => p.key);

// Helper to filter permissions by section
const bySection = (...sections) =>
  PERMISSIONS.filter(p => sections.includes(p.section)).map(p => p.key);

const ROLES = [
  {
    name: 'super_admin',
    label: 'Super Admin',
    description: 'Full access to everything',
    isSystem: true,
    permissions: allKeys,
  },
  {
    name: 'admin',
    label: 'Admin',
    description: 'Manage platform, no admin/role management',
    isSystem: true,
    permissions: allKeys.filter(k =>
      !k.startsWith('admin_users.') &&
      !k.startsWith('roles.') &&
      !k.startsWith('permissions.') &&
      !k.startsWith('activity.delete')
    ),
  },
  {
    name: 'supervisor',
    label: 'Supervisor',
    description: 'Oversee operations, approve content',
    isSystem: true,
    permissions: [
      ...bySection('Dashboard'),
      ...bySection('Technicians'),
      ...bySection('Verifications'),
      ...bySection('Subscriptions'),
      ...bySection('Bookings'),
      ...bySection('Jobs'),
      ...bySection('Service Catalog'),
      ...bySection('Users'),
      ...bySection('Chat'),
      ...bySection('Activity Logs'),
      ...bySection('Reports'),
    ],
  },
  {
    name: 'customer_service',
    label: 'Customer Service',
    description: 'Handle user inquiries and disputes',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'technicians.view', 'technicians.view_details',
      'users.view', 'users.view_details',
      'bookings.view', 'bookings.view_details', 'bookings.resolve_dispute',
      'subscriptions.view', 'subscriptions.view_details',
      'jobs.view', 'jobs.view_applications',
      'chat.view', 'chat.flag',
      'support.view', 'support.respond', 'support.assign', 'support.close',
    ],
  },
  {
    name: 'finance',
    label: 'Finance',
    description: 'Manage revenue, subscriptions, commissions',
    isSystem: true,
    permissions: [
      'dashboard.view', 'dashboard.export',
      'subscriptions.view', 'subscriptions.view_details', 'subscriptions.manage', 'subscriptions.refund', 'subscriptions.export',
      'revenue.view', 'revenue.view_transactions', 'revenue.export',
      'commission.view', 'commission.manage', 'commission.mark_paid', 'commission.waive', 'commission.export',
      'payments.view', 'payments.refund', 'payments.retry', 'payments.export',
      'reports.view', 'reports.create', 'reports.export',
    ],
  },
  {
    name: 'content_moderator',
    label: 'Content Moderator',
    description: 'Approve jobs and moderate content',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'technicians.view', 'technicians.view_details',
      'verifications.view', 'verifications.approve', 'verifications.reject', 'verifications.request_more',
      'jobs.view', 'jobs.approve', 'jobs.reject', 'jobs.edit', 'jobs.delete',
      'jobs.view_applications', 'jobs.manage_applications',
      'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.delete', 'catalog.reorder',
      'chat.view', 'chat.flag', 'chat.delete_message',
    ],
  },
  {
    name: 'marketing',
    label: 'Marketing',
    description: 'Manage notifications and campaigns',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'notifications.view', 'notifications.send', 'notifications.schedule', 'notifications.delete',
      'reports.view', 'reports.create', 'reports.export',
      'revenue.view',
      'technicians.view',
      'users.view',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Upsert permissions
    for (const p of PERMISSIONS) {
      await Permission.updateOne({ key: p.key }, p, { upsert: true });
    }
    console.log(`✅ Seeded ${PERMISSIONS.length} permissions across ${new Set(PERMISSIONS.map(p => p.section)).size} sections\n`);

    // Upsert roles
    for (const r of ROLES) {
      await Role.updateOne({ name: r.name }, r, { upsert: true });
    }
    console.log(`✅ Seeded ${ROLES.length} roles\n`);

    // Create super admin if none exists
    const existing = await AdminUser.findOne({ role: 'super_admin' });
    if (!existing) {
      await AdminUser.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@webahub.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123',
        role: 'super_admin',
        isActive: true,
      });
      console.log('✅ Super admin created');
      console.log(`   Email:    ${process.env.SUPER_ADMIN_EMAIL || 'superadmin@webahub.com'}`);
      console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123'}`);
      console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!\n');
    } else {
      console.log('ℹ️  Super admin already exists, skipping.\n');
    }

    // Summary of sections
    const sections = [...new Set(PERMISSIONS.map(p => p.section))];
    console.log('📋 Permission sections:');
    sections.forEach(s => {
      const count = PERMISSIONS.filter(p => p.section === s).length;
      console.log(`   • ${s} (${count})`);
    });

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();