/**
 * expandServiceCatalog.js
 * =======================
 * Adds the categories, service categories and services in
 * data/catalogExpansion.js to the ServiceCatalog collection.
 *
 * Safe to run more than once: it only ADDS what is missing (matching names
 * case-insensitively). It never renames, removes or deactivates anything,
 * so admin edits and existing technician selections are untouched.
 *
 * Usage (from backend/):
 *   node scripts/expandServiceCatalog.js           # dry run — shows what would change
 *   node scripts/expandServiceCatalog.js --apply   # writes the changes
 *
 * Uses MONGODB_URI from .env.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ServiceCatalog = require('../models/ServiceCatalog');
const expansion = require('../data/catalogExpansion');

const APPLY = process.argv.includes('--apply');
const key = (s) => String(s).trim().toLowerCase();

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN (use --apply to write)'} — database: ${mongoose.connection.name}\n`);

  const totals = { newCategories: 0, newServiceCategories: 0, newServices: 0 };

  for (const [mainCategory, serviceCategories] of Object.entries(expansion)) {
    let catalog = await ServiceCatalog.findOne({ mainCategory });
    const isNewCategory = !catalog;
    if (isNewCategory) {
      catalog = new ServiceCatalog({ mainCategory, serviceCategories: [], isActive: true, version: 1 });
      totals.newCategories++;
    }

    let addedSc = 0;
    let addedSvc = 0;

    for (const [scName, servicesStr] of Object.entries(serviceCategories)) {
      let sc = catalog.serviceCategories.find((s) => key(s.name) === key(scName));
      if (!sc) {
        catalog.serviceCategories.push({
          name: scName,
          isActive: true,
          displayOrder: catalog.serviceCategories.length,
          subServices: [],
        });
        sc = catalog.serviceCategories[catalog.serviceCategories.length - 1];
        addedSc++;
      }

      const existing = new Set(sc.subServices.map((s) => key(s.name)));
      for (const name of servicesStr.split('|').map((s) => s.trim()).filter(Boolean)) {
        if (existing.has(key(name))) continue;
        sc.subServices.push({ name, isActive: true, displayOrder: sc.subServices.length });
        existing.add(key(name));
        addedSvc++;
      }
    }

    totals.newServiceCategories += addedSc;
    totals.newServices += addedSvc;

    if (isNewCategory || addedSc || addedSvc) {
      console.log(
        `${isNewCategory ? '[NEW] ' : '      '}${mainCategory}: +${addedSc} service categories, +${addedSvc} services` +
          ` → ${catalog.serviceCategories.length} service categories`
      );
      if (APPLY) {
        if (!isNewCategory) catalog.version = (catalog.version || 1) + 1;
        await catalog.save();
      }
    } else {
      console.log(`      ${mainCategory}: already complete`);
    }
  }

  console.log(
    `\n${APPLY ? 'Added' : 'Would add'}: ${totals.newCategories} categories, ` +
      `${totals.newServiceCategories} service categories, ${totals.newServices} services`
  );
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
