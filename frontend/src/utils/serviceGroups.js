/**
 * serviceGroups.js
 * ================
 * Helpers for the expert service picker (components/ServicePicker.jsx).
 *
 * A group is { mainCategory, serviceCategories: [{ categoryName, subServices: [] }] };
 * the first group is the expert's main category.
 */

export const EMPTY_GROUP = { mainCategory: '', serviceCategories: [] };

/** Technician serviceCategories (flat) → picker groups, main category first */
export const groupsFromTechnician = (tech) => {
  const order = [tech.mainCategory, ...(tech.mainCategories || [])].filter(Boolean);
  const byMain = new Map();
  (tech.serviceCategories || []).forEach((sc) => {
    const main = sc.mainCategory || tech.mainCategory;
    if (!byMain.has(main)) byMain.set(main, []);
    byMain.get(main).push({ categoryName: sc.categoryName, subServices: [...(sc.subServices || [])] });
  });
  [...byMain.keys()].forEach((m) => !order.includes(m) && order.push(m));
  const groups = [...new Set(order)].map((m) => ({ mainCategory: m, serviceCategories: byMain.get(m) || [] }));
  return groups.length ? groups : [{ ...EMPTY_GROUP }];
};

/** First problem with the picked services, or '' when they're complete */
export const servicesError = (groups) => {
  if (!groups[0]?.mainCategory) return 'Pick the category you work in.';
  for (const g of groups) {
    if (!g.mainCategory) continue;
    if (g.serviceCategories.length === 0) return `Pick at least one service category under ${g.mainCategory}.`;
    const empty = g.serviceCategories.find((sc) => sc.subServices.length === 0);
    if (empty) return `Pick at least one service under ${empty.categoryName}.`;
  }
  return '';
};
