/**
 * jobCategories.js
 * ================
 * Categories on job posts. A poster picks a main category, service category
 * and sub-service from the catalog, or types their own when theirs isn't
 * listed ("Other"). Typed service categories / sub-services may be left
 * blank, which is stored as "N/A".
 *
 * Typed main categories are stored on the job with customCategory: true.
 * They show in the Available Jobs filter under their own name, and all of
 * them together under "Other". The curated service catalog is not changed.
 */

const ServiceCatalog = require('../models/ServiceCatalog');
const Job = require('../models/Job');

const NA = 'N/A';
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactly = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

// "  car  wash " → "Car Wash" (keeps the rest of each word, so "CCTV" stays "CCTV")
const tidy = (s) =>
  String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

const isNA = (s) => !s || /^n\/?a$/i.test(String(s).trim());

/**
 * Normalise what the poster sent. Returns { data } or { error }.
 * data: { mainCategory, serviceCategory, subService, customCategory }
 */
const resolveJobCategories = async ({ mainCategory, serviceCategory, subService }) => {
  const main = tidy(mainCategory);
  if (!main || isNA(main)) return { error: 'Please choose a main category, or type your own.' };

  const catalog = await ServiceCatalog.findOne({ mainCategory: exactly(main), isActive: true })
    .select('mainCategory serviceCategories.name serviceCategories.subServices.name')
    .lean();

  let mainName = main;
  let custom = !catalog;
  if (catalog) {
    mainName = catalog.mainCategory;
  } else {
    // Reuse the spelling of an earlier custom category so the filter doesn't split
    const known = await Job.findOne({ customCategory: true, mainCategory: exactly(main) }).select('mainCategory').lean();
    if (known) mainName = known.mainCategory;
  }

  let service = isNA(serviceCategory) ? NA : tidy(serviceCategory);
  let sub = isNA(subService) ? NA : tidy(subService);

  // Use the catalog's spelling when the typed service or sub-service is already listed
  if (catalog && service !== NA) {
    const sc = (catalog.serviceCategories || []).find((s) => s.name.toLowerCase() === service.toLowerCase());
    if (sc) {
      service = sc.name;
      const ss = (sc.subServices || []).find((s) => s.name.toLowerCase() === sub.toLowerCase());
      if (ss) sub = ss.name;
    }
  }

  return { data: { mainCategory: mainName, serviceCategory: service, subService: sub, customCategory: custom } };
};

/**
 * Main categories for the Available Jobs filter: the catalog's, plus custom
 * ones from open jobs, each with how many open jobs it has.
 */
const jobFilterCategories = async () => {
  const [catalog, counts] = await Promise.all([
    ServiceCatalog.find({ isActive: true }).select('mainCategory').sort({ mainCategory: 1 }).lean(),
    Job.aggregate([
      { $match: { status: 'approved', expiresAt: { $gt: new Date() } } },
      { $group: { _id: { name: '$mainCategory', custom: { $ifNull: ['$customCategory', false] } }, count: { $sum: 1 } } },
    ]),
  ]);
  const countOf = (name) =>
    counts.filter((c) => !c._id.custom && c._id.name === name).reduce((n, c) => n + c.count, 0);
  const custom = counts
    .filter((c) => c._id.custom)
    .map((c) => ({ name: c._id.name, count: c.count, custom: true }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    catalog: catalog.map((c) => ({ name: c.mainCategory, count: countOf(c.mainCategory) })),
    custom,
    otherCount: custom.reduce((n, c) => n + c.count, 0),
  };
};

module.exports = { NA, resolveJobCategories, jobFilterCategories, tidy };
