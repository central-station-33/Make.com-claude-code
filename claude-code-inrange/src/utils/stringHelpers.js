'use strict';

/**
 * Clean and normalize a name (trim, title case).
 * @param {string} name
 * @returns {string}
 */
const cleanName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Format a phone number to (XXX) XXX-XXXX or return as-is if not parseable.
 * @param {string} phone
 * @returns {string}
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

/**
 * Parse US address components from a single address string.
 * Returns best-effort breakdown.
 * @param {string} address
 * @returns {{ street: string, city: string, state: string, zip: string }}
 */
const parseAddress = (address) => {
  if (!address) return { street: '', city: '', state: '', zip: '' };

  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  const zip = zipMatch ? zipMatch[1] : '';

  const stateMatch = address.match(/\b([A-Z]{2})\b\s*(?:\d{5})?$/);
  const state = stateMatch ? stateMatch[1] : '';

  const parts = address.split(',').map((s) => s.trim());
  const street = parts[0] || '';
  const city = parts[1] || '';

  return { street: street.toUpperCase(), city: city.toUpperCase(), state: state.toUpperCase(), zip };
};

/**
 * Sanitize a string to prevent XSS / SQL injection characters.
 * @param {string} str
 * @returns {string}
 */
const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"'`]/g, '');
};

module.exports = { cleanName, formatPhone, parseAddress, sanitize };
