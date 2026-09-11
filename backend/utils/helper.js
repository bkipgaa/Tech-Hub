// utils/helper.js
// ─── Currency helpers ─────────────────────────────────────────

/**
 * Convert a major-unit currency amount (e.g. 100 KES) into the
 * smallest unit Paystack expects (kobo / cents).
 *
 * KES, NGN, GHS → 1 major unit = 100 subunits → multiply by 100
 *
 * @param {number} amount  - amount in major units (e.g. KES)
 * @param {string} currency - ISO code (default 'KES')
 * @returns {number}        - integer amount in smallest unit
 */
function convertToSmallestUnit(amount, currency = 'KES') {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error(`Invalid amount for conversion: ${amount}`);
  }

  // Paystack-supported currencies all have 2 decimal places.
  // Extend this map if you ever add JPY-style zero-decimal currencies.
  const supported = ['KES', 'NGN', 'GHS', 'ZAR', 'USD'];
  const cur = String(currency || 'KES').toUpperCase();

  if (!supported.includes(cur)) {
    throw new Error(`Unsupported currency for conversion: ${currency}`);
  }

  return Math.round(amount * 100);
}

/**
 * Convert smallest unit back to major unit (useful for reading
 * Paystack webhook amounts back into human-readable KES).
 */
function convertFromSmallestUnit(amount, currency = 'KES') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid amount for conversion: ${amount}`);
  }
  return amount / 100;
}

module.exports = {
  convertToSmallestUnit,
  convertFromSmallestUnit,
};