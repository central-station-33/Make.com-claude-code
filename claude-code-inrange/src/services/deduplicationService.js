'use strict';

const { generatePropertyHash } = require('../utils/cryptoHelpers');
const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Find candidate duplicate properties in the database by address similarity.
 * @param {object} property - Normalized property
 * @returns {Promise<Array>}
 */
const findDuplicates = async (property) => {
  try {
    const result = await query(
      `SELECT id, address, city, state, zip, owner_name, source, property_hash
       FROM properties
       WHERE state = $1
         AND zip = $2
         AND similarity(address, $3) > 0.6
       LIMIT 10`,
      [property.state, property.zip, property.street || property.address]
    );
    return result.rows;
  } catch (err) {
    // If pg_trgm extension not available, fall back to exact match
    logger.warn('Similarity query failed, falling back to exact match', { error: err.message });
    const result = await query(
      `SELECT id, address, city, state, zip, owner_name, source, property_hash
       FROM properties
       WHERE state = $1 AND zip = $2 AND address = $3
       LIMIT 10`,
      [
        (property.state || '').toUpperCase(),
        (property.zip || '').trim(),
        (property.street || property.address || '').toUpperCase(),
      ]
    );
    return result.rows;
  }
};

/**
 * Merge two property records, keeping the most complete data.
 * @param {object} existing - Record from database
 * @param {object} incoming - New normalized record
 * @returns {object} Merged record
 */
const mergeDuplicates = (existing, incoming) => {
  const merged = { ...existing };

  // Prefer non-null values from incoming
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== null && value !== undefined && value !== '') {
      if (!merged[key]) {
        merged[key] = value;
      }
    }
  }

  // Merge distress indicators arrays
  const existingIndicators = existing.distress_indicators || [];
  const incomingIndicators = incoming.distress_indicators || [];
  merged.distress_indicators = [...new Set([...existingIndicators, ...incomingIndicators])];

  // Merge data sources
  const existingSources = existing.data_sources || [existing.source].filter(Boolean);
  const incomingSources = incoming.data_sources || [incoming.source].filter(Boolean);
  merged.data_sources = [...new Set([...existingSources, ...incomingSources])];

  merged.updated_at = new Date().toISOString();
  return merged;
};

/**
 * Generate a property hash and check if it is a known duplicate.
 * @param {object} property - Normalized property
 * @returns {Promise<{ isDuplicate: boolean, hash: string, existingId: string|null }>}
 */
const checkDuplicate = async (property) => {
  const hash = generatePropertyHash(property);

  try {
    const result = await query(
      'SELECT id FROM properties WHERE property_hash = $1 LIMIT 1',
      [hash]
    );
    const isDuplicate = result.rows.length > 0;
    return {
      isDuplicate,
      hash,
      existingId: isDuplicate ? result.rows[0].id : null,
    };
  } catch (err) {
    logger.error('Duplicate check failed', { error: err.message });
    return { isDuplicate: false, hash, existingId: null };
  }
};

module.exports = { generatePropertyHash, findDuplicates, mergeDuplicates, checkDuplicate };
