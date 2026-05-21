'use strict';

/**
 * Parse a currency string or number to a float.
 * @param {*} value
 * @returns {number|null}
 */
const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Format a number as a USD currency string.
 * @param {number} value
 * @returns {string}
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
};

/**
 * Calculate percentage.
 * @param {number} part
 * @param {number} whole
 * @param {number} [decimals=2]
 * @returns {number|null}
 */
const percentage = (part, whole, decimals = 2) => {
  if (!whole) return null;
  return parseFloat(((part / whole) * 100).toFixed(decimals));
};

/**
 * Clamp a number within a range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Round to a given number of decimal places.
 * @param {number} value
 * @param {number} [decimals=0]
 * @returns {number}
 */
const round = (value, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

module.exports = { parseCurrency, formatCurrency, percentage, clamp, round };
