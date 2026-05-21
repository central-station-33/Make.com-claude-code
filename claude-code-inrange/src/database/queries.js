'use strict';

const { query } = require('../config/database');
const logger = require('../config/logger');

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

/**
 * Insert a raw property record.
 * @param {object} data - Raw property payload
 * @returns {Promise<object>} Inserted row
 */
const insertRawProperty = async (data) => {
  const result = await query(
    `INSERT INTO raw_properties (
       source, raw_data, received_at, property_hash
     ) VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (property_hash) DO UPDATE
       SET raw_data = EXCLUDED.raw_data,
           received_at = NOW()
     RETURNING id`,
    [data.source || 'unknown', JSON.stringify(data), data.property_hash || '']
  );
  return result.rows[0];
};

/**
 * Upsert a scored & normalized property.
 * @param {object} data - Normalized + scored property
 * @returns {Promise<object>} Upserted row
 */
const upsertScoredProperty = async (data) => {
  const result = await query(
    `INSERT INTO properties (
       property_hash, source, address, city, state, zip, county,
       property_type, bedrooms, bathrooms, square_footage, year_built,
       estimated_arv, amount_owed, asking_price, equity, equity_percentage,
       below_market_percentage, assessed_value, taxes_owed,
       owner_name, owner_phone, owner_email, owner_mailing_address,
       owner_type, owner_state,
       distress_indicators, notice_date, auction_date, process_stage, case_number,
       distress_score, deal_quality_score, contact_likelihood_score,
       timeline_urgency_score, composite_score, priority_tier, deal_type,
       data_sources, lat, lng,
       created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
       $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
       $39,$40,$41,NOW(),NOW()
     )
     ON CONFLICT (property_hash) DO UPDATE SET
       source                    = EXCLUDED.source,
       address                   = EXCLUDED.address,
       city                      = EXCLUDED.city,
       state                     = EXCLUDED.state,
       zip                       = EXCLUDED.zip,
       county                    = EXCLUDED.county,
       property_type             = EXCLUDED.property_type,
       estimated_arv             = COALESCE(EXCLUDED.estimated_arv, properties.estimated_arv),
       amount_owed               = COALESCE(EXCLUDED.amount_owed, properties.amount_owed),
       equity                    = COALESCE(EXCLUDED.equity, properties.equity),
       distress_indicators       = EXCLUDED.distress_indicators,
       composite_score           = EXCLUDED.composite_score,
       distress_score            = EXCLUDED.distress_score,
       deal_quality_score        = EXCLUDED.deal_quality_score,
       contact_likelihood_score  = EXCLUDED.contact_likelihood_score,
       timeline_urgency_score    = EXCLUDED.timeline_urgency_score,
       priority_tier             = EXCLUDED.priority_tier,
       deal_type                 = EXCLUDED.deal_type,
       data_sources              = EXCLUDED.data_sources,
       updated_at                = NOW()
     RETURNING id, property_hash, priority_tier, composite_score`,
    [
      data.property_hash, data.source, data.street || data.address, data.city, data.state, data.zip, data.county,
      data.property_type, data.bedrooms, data.bathrooms, data.square_footage, data.year_built,
      data.estimated_arv, data.amount_owed, data.asking_price, data.equity, data.equity_percentage,
      data.below_market_percentage, data.assessed_value, data.taxes_owed,
      data.owner_name, data.owner_phone, data.owner_email, data.owner_mailing_address,
      data.owner_type, data.owner_state,
      JSON.stringify(data.distress_indicators || []), data.notice_date, data.auction_date,
      data.process_stage, data.case_number,
      data.distress_score, data.deal_quality_score, data.contact_likelihood_score,
      data.timeline_urgency_score, data.composite_score, data.priority_tier, data.deal_type,
      JSON.stringify(data.data_sources || [data.source]),
      data.lat, data.lng,
    ]
  );
  return result.rows[0];
};

/**
 * Update a property's AI analysis fields.
 * @param {string} propertyId
 * @param {object} analysis - Claude enrichment result
 * @returns {Promise<boolean>}
 */
const updatePropertyAnalysis = async (propertyId, analysis) => {
  const result = await query(
    `UPDATE properties
     SET ai_analysis      = $2,
         ai_enriched_at   = NOW(),
         updated_at       = NOW()
     WHERE id = $1`,
    [propertyId, JSON.stringify(analysis)]
  );
  return result.rowCount > 0;
};

// ---------------------------------------------------------------------------
// Contact & Deal Activity
// ---------------------------------------------------------------------------

/**
 * Log a contact attempt for a property.
 * @param {object} data
 * @returns {Promise<object>}
 */
const logContactActivity = async (data) => {
  const result = await query(
    `INSERT INTO contact_activities (
       property_id, contact_method, contact_date, outcome,
       notes, agent_id, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id`,
    [data.property_id, data.contact_method, data.contact_date || new Date(), data.outcome, data.notes, data.agent_id]
  );
  return result.rows[0];
};

/**
 * Log a deal status update.
 * @param {object} data
 * @returns {Promise<object>}
 */
const logDealStatus = async (data) => {
  const result = await query(
    `INSERT INTO deals (
       property_id, status, deal_type, offer_price, contract_price,
       close_date, profit_estimate, notes, agent_id, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (property_id) DO UPDATE SET
       status          = EXCLUDED.status,
       contract_price  = COALESCE(EXCLUDED.contract_price, deals.contract_price),
       close_date      = COALESCE(EXCLUDED.close_date, deals.close_date),
       profit_estimate = COALESCE(EXCLUDED.profit_estimate, deals.profit_estimate),
       notes           = COALESCE(EXCLUDED.notes, deals.notes),
       updated_at      = NOW()
     RETURNING id`,
    [
      data.property_id, data.status, data.deal_type, data.offer_price, data.contract_price,
      data.close_date, data.profit_estimate, data.notes, data.agent_id,
    ]
  );
  return result.rows[0];
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Find a property by its ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const findPropertyById = async (id) => {
  const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Find properties matching the given filters.
 * @param {object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ rows: Array, total: number }>}
 */
const findProperties = async (filters = {}, page = 1, limit = 50) => {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (filters.state) { conditions.push(`state = $${idx++}`); params.push(filters.state.toUpperCase()); }
  if (filters.county) { conditions.push(`county ILIKE $${idx++}`); params.push(`%${filters.county}%`); }
  if (filters.priority_tier) { conditions.push(`priority_tier = $${idx++}`); params.push(filters.priority_tier); }
  if (filters.deal_type) { conditions.push(`deal_type = $${idx++}`); params.push(filters.deal_type); }
  if (filters.min_score != null) { conditions.push(`composite_score >= $${idx++}`); params.push(filters.min_score); }
  if (filters.max_score != null) { conditions.push(`composite_score <= $${idx++}`); params.push(filters.max_score); }
  if (filters.search) {
    conditions.push(`(address ILIKE $${idx} OR owner_name ILIKE $${idx})`);
    params.push(`%${filters.search}%`); idx++;
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT * FROM properties WHERE ${where} ORDER BY composite_score DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) as total FROM properties WHERE ${where}`, params),
  ]);

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0]?.total || 0, 10),
  };
};

/**
 * Get aggregate statistics for the dashboard.
 * @returns {Promise<object>}
 */
const getPropertyStats = async () => {
  const result = await query(
    `SELECT
       COUNT(*) as total_properties,
       COUNT(*) FILTER (WHERE priority_tier = 'Tier 1') as tier1_count,
       COUNT(*) FILTER (WHERE priority_tier = 'Tier 2') as tier2_count,
       COUNT(*) FILTER (WHERE priority_tier = 'Tier 3') as tier3_count,
       COUNT(*) FILTER (WHERE priority_tier = 'Tier 4') as tier4_count,
       AVG(composite_score)::numeric(5,2) as avg_composite_score,
       COUNT(*) FILTER (WHERE ai_enriched_at IS NOT NULL) as enriched_count,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as new_today,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
     FROM properties`
  );
  return result.rows[0] || {};
};

/**
 * Update enrichment status for a property.
 * @param {string} propertyId
 * @param {'pending'|'processing'|'complete'|'failed'} status
 * @returns {Promise<boolean>}
 */
const updateEnrichmentStatus = async (propertyId, status) => {
  const result = await query(
    `UPDATE properties SET enrichment_status = $2, updated_at = NOW() WHERE id = $1`,
    [propertyId, status]
  );
  return result.rowCount > 0;
};

/**
 * Log notification delivery status from Make.com.
 * @param {object} data
 * @returns {Promise<object>}
 */
const logNotificationStatus = async (data) => {
  const result = await query(
    `INSERT INTO notification_log (
       property_id, notification_type, recipient, status,
       error_message, sent_at, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id`,
    [
      data.property_id, data.notification_type, data.recipient,
      data.status, data.error_message, data.sent_at || new Date(),
    ]
  );
  return result.rows[0];
};

module.exports = {
  insertRawProperty,
  upsertScoredProperty,
  updatePropertyAnalysis,
  logContactActivity,
  logDealStatus,
  findPropertyById,
  findProperties,
  getPropertyStats,
  updateEnrichmentStatus,
  logNotificationStatus,
};
