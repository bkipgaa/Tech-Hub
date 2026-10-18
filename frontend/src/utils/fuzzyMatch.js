/**
 * fuzzyMatch.js
 * =============
 * Forgiving text matching for the service catalog search box: "plumbng",
 * "cctv instal" or "wifi" still find the right category.
 */

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Edit distance between two short strings (insert / delete / replace = 1). */
const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
};

/** How well one typed word matches one label word, from 0 to 1. */
const wordScore = (typed, word) => {
  if (word.startsWith(typed)) return 1;
  // Compare against the start of the word too, so partly typed words with a typo still match
  const prefix = word.slice(0, typed.length + 1);
  const distance = Math.min(levenshtein(typed, word), levenshtein(typed, prefix));
  return 1 - distance / Math.max(typed.length, 1);
};

/**
 * Score a label against a query, from 0 (no match) to 1 (exact substring).
 * Every typed word must match some word in the label reasonably well.
 */
export const matchScore = (query, label) => {
  const q = normalize(query);
  const l = normalize(label);
  if (!q || !l) return 0;
  if (l.includes(q)) return l.startsWith(q) ? 1 : 0.95;

  const typedWords = q.split(' ').filter((w) => w.length >= 2);
  const labelWords = l.split(' ');
  if (!typedWords.length) return 0;

  let total = 0;
  for (const typed of typedWords) {
    const best = Math.max(...labelWords.map((word) => wordScore(typed, word)));
    // Short words need to match exactly; longer ones can carry a typo or two
    const needed = typed.length <= 3 ? 1 : 0.7;
    if (best < needed) return 0;
    total += best;
  }
  return 0.9 * (total / typedWords.length);
};

/**
 * Rank catalog entries against a query. On equal scores, broader entries
 * (shorter `path`, e.g. a category before its sub-services) come first,
 * then shorter labels.
 * @param {string} query
 * @param {Array<{label: string, path?: string[]}>} entries
 * @param {number} limit
 */
export const rankMatches = (query, entries, limit = 8) =>
  entries
    .map((entry) => ({ entry, score: matchScore(query, entry.label) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.entry.path?.length || 0) - (b.entry.path?.length || 0) ||
        a.entry.label.length - b.entry.label.length
    )
    .slice(0, limit)
    .map((r) => r.entry);
