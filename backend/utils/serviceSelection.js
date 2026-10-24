/**
 * serviceSelection.js
 * ===================
 * Validates the categories an expert picks (at signup, or when an admin edits
 * their profile) and turns them into the Technician fields.
 *
 * Input is a list of groups, the first one being the expert's main category:
 *   [{ mainCategory, serviceCategories: [{ categoryName, subServices: [..] }] }]
 */

const ServiceCatalog = require('../models/ServiceCatalog');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

/**
 * @param {Array} groups
 * @param {Object} [opts]
 * @param {boolean} [opts.strict=true] every name must exist (and be active) in the catalog
 * @returns {Promise<{ mainCategory, mainCategories, serviceCategories }>}
 * @throws {Error} with a message that can be shown to the user
 */
const normalizeServiceSelection = async (groups, { strict = true } = {}) => {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error('Pick the category you work in');
  }

  const catalogs = strict
    ? await ServiceCatalog.find({ isActive: true }).select('mainCategory serviceCategories').lean()
    : [];
  const catalogByMain = new Map(catalogs.map((c) => [c.mainCategory, c]));

  const seenMain = new Set();
  const serviceCategories = [];

  for (const [i, group] of groups.entries()) {
    const mainCategory = clean(group?.mainCategory);
    if (!mainCategory) {
      // Only the first category is required; empty extra rows are ignored
      if (i === 0) throw new Error('Pick the category you work in');
      continue;
    }
    if (seenMain.has(mainCategory)) throw new Error(`"${mainCategory}" is selected twice`);
    seenMain.add(mainCategory);

    const catalog = catalogByMain.get(mainCategory);
    if (strict && !catalog) throw new Error(`Unknown category "${mainCategory}"`);

    const picked = (Array.isArray(group.serviceCategories) ? group.serviceCategories : [])
      .map((sc) => ({
        categoryName: clean(sc?.categoryName),
        subServices: [...new Set((Array.isArray(sc?.subServices) ? sc.subServices : []).map(clean).filter(Boolean))],
      }))
      .filter((sc) => sc.categoryName);

    if (picked.length === 0) throw new Error(`Pick at least one service category under ${mainCategory}`);

    for (const sc of picked) {
      if (sc.subServices.length === 0) {
        throw new Error(`Pick at least one service under ${sc.categoryName}`);
      }
      if (strict) {
        const entry = (catalog.serviceCategories || []).find(
          (c) => c.name === sc.categoryName && c.isActive !== false
        );
        if (!entry) throw new Error(`Unknown service category "${sc.categoryName}"`);
        const known = new Set((entry.subServices || []).filter((s) => s.isActive !== false).map((s) => s.name));
        const unknown = sc.subServices.find((s) => !known.has(s));
        if (unknown) throw new Error(`Unknown service "${unknown}" under ${sc.categoryName}`);
      }
      serviceCategories.push({ mainCategory, ...sc });
    }
  }

  const mainCategories = [...seenMain];
  return { mainCategory: mainCategories[0], mainCategories, serviceCategories };
};

module.exports = { normalizeServiceSelection };
