'use strict';

/**
 * Parse a date from various formats; returns null if invalid.
 * @param {*} value
 * @returns {Date|null}
 */
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Format a date to ISO string (YYYY-MM-DD).
 * @param {Date|string} date
 * @returns {string|null}
 */
const formatDate = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  return d.toISOString().split('T')[0];
};

/**
 * Calculate days between two dates (positive = future, negative = past).
 * @param {Date|string} from
 * @param {Date|string} to
 * @returns {number|null}
 */
const daysBetween = (from, to) => {
  const f = parseDate(from);
  const t = parseDate(to);
  if (!f || !t) return null;
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Days until a target date from now.
 * @param {Date|string} targetDate
 * @returns {number|null}
 */
const daysUntil = (targetDate) => daysBetween(new Date(), targetDate);

/**
 * Days since a past date from now.
 * @param {Date|string} pastDate
 * @returns {number|null}
 */
const daysSince = (pastDate) => {
  const d = daysBetween(pastDate, new Date());
  return d === null ? null : d;
};

module.exports = { parseDate, formatDate, daysBetween, daysUntil, daysSince };
