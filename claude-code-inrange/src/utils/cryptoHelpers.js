const crypto = require('crypto');

/**
 * Generate a deterministic SHA-256 hash for a property record.
 * Used for deduplication.
 * @param {object} property
 * @returns {string}
 */
const generatePropertyHash = (property) => {
  const key = [
    (property.address || '').toUpperCase().trim(),
    (property.city || '').toUpperCase().trim(),
    (property.state || '').toUpperCase().trim(),
    (property.zip || '').trim(),
    (property.owner_name || '').toUpperCase().trim(),
    (property.source || '').toLowerCase().trim(),
  ].join('|');

  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generate an HMAC-SHA256 signature.
 * @param {string} payload
 * @param {string} secret
 * @returns {string}
 */
const generateHmac = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

/**
 * Constant-time comparison of two strings/buffers.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const safeEqual = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
};

module.exports = { generatePropertyHash, generateHmac, safeEqual };
