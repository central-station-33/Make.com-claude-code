'use strict';

const { enrichWithNYCData } = require('./nycDataService');
const { enrichWithNJData }  = require('./njDataService');
const { checkFloodRisk }    = require('./femaFloodService');
const { clamp, round }      = require('../utils/numberHelpers');
const logger                = require('../config/logger');

// ---------------------------------------------------------------------------
// Individual signal scorers
// ---------------------------------------------------------------------------

/**
 * Score based on HPD/code violations (0–25 pts).
 * @param {object} signals
 * @returns {number}
 */
const scoreViolations = (signals) => {
  let score = 0;
  const violations = signals.hpd_violations || signals.code_violations || 0;
  const classC     = signals.hpd_class_c || 0;

  if (classC >= 3)    score += 25;
  else if (classC > 0) score += 15;
  else if (violations >= 5) score += 15;
  else if (violations >= 2) score += 8;
  else if (violations >= 1) score += 4;

  return score;
};

/**
 * Score based on ownership duration (0–20 pts).
 * Long-term owners are more likely to be fatigued.
 * @param {object} signals
 * @returns {number}
 */
const scoreOwnershipDuration = (signals) => {
  const years = signals.years_owned;
  if (years === null || years === undefined) return 0;
  if (years >= 20) return 20;
  if (years >= 15) return 15;
  if (years >= 10) return 10;
  if (years >= 7)  return 5;
  return 0;
};

/**
 * Score based on out-of-state / absentee ownership (0–15 pts).
 * @param {object} property
 * @param {object} signals
 * @returns {number}
 */
const scoreAbsenteeOwner = (property, signals) => {
  let score = 0;
  const propState  = (property.state || '').toUpperCase();
  const ownerState = (property.owner_state || '').toUpperCase();

  if (ownerState && propState && ownerState !== propState) score += 15;
  else if (signals.out_of_state_owner) score += 15;
  else if (!property.owner_mailing_address) score += 5; // unknown = possibly absentee

  return score;
};

/**
 * Score based on tax delinquency (0–20 pts).
 * @param {object} signals
 * @returns {number}
 */
const scoreTaxDelinquency = (signals) => {
  if (!signals.is_tax_delinquent) return 0;
  const amount = signals.delinquent_amount || 0;
  if (amount >= 50000) return 20;
  if (amount >= 20000) return 15;
  if (amount >= 5000)  return 10;
  return 5;
};

/**
 * Score based on eviction history (0–10 pts).
 * Multiple evictions = problem landlord / burnt out.
 * @param {object} signals
 * @returns {number}
 */
const scoreEvictions = (signals) => {
  const count = signals.eviction_count || 0;
  if (count >= 5) return 10;
  if (count >= 3) return 7;
  if (count >= 1) return 4;
  return 0;
};

/**
 * Score based on FEMA flood zone (0–10 pts).
 * High flood risk = expensive insurance = motivated to sell.
 * @param {object} floodData
 * @returns {number}
 */
const scoreFloodRisk = (floodData) => {
  if (!floodData) return 0;
  if (floodData.risk === 'extreme') return 10;
  if (floodData.risk === 'high')    return 7;
  if (floodData.in_sfha)            return 5;
  return 0;
};

/**
 * Score based on property class / rental type (0–10 pts).
 * Rental properties (landlords) are higher priority than owner-occupied.
 * @param {object} property
 * @param {object} signals
 * @returns {number}
 */
const scoreRentalProperty = (property, signals) => {
  const propClass = signals.property_class || '';
  const propType  = (property.property_type || '').toLowerCase();

  // NJ property class 2 = residential, 4A = commercial
  // NYC building classes: D=elevator apts, C=walk-up apts, etc.
  const isRental =
    propType.includes('multi')    ||
    propType.includes('duplex')   ||
    propType.includes('triplex')  ||
    propType.includes('apartment') ||
    propType.includes('rental')   ||
    ['2', '4A', '4B'].includes(propClass) ||
    (signals.pluto?.residential_units > 1);

  return isRental ? 10 : 0;
};

// ---------------------------------------------------------------------------
// Main burnt out landlord scorer
// ---------------------------------------------------------------------------

/**
 * Calculate the burnt out landlord score (0–100).
 * Aggregates all signals from public data sources.
 * @param {object} property   - Normalized property
 * @param {object} signals    - Combined NYC/NJ enrichment signals
 * @param {object} floodData  - FEMA flood zone result
 * @returns {number} 0–100
 */
const calculateBurntOutLandlordScore = (property, signals = {}, floodData = null) => {
  const violations   = scoreViolations(signals);          // 0–25
  const ownershipAge = scoreOwnershipDuration(signals);   // 0–20
  const absentee     = scoreAbsenteeOwner(property, signals); // 0–15
  const taxDelinq    = scoreTaxDelinquency(signals);      // 0–20
  const evictions    = scoreEvictions(signals);           // 0–10
  const flood        = scoreFloodRisk(floodData);         // 0–10
  const rental       = scoreRentalProperty(property, signals); // 0–10

  const total = violations + ownershipAge + absentee + taxDelinq + evictions + flood + rental;

  const score = clamp(round(total), 0, 100);

  logger.debug('Burnt out landlord score', {
    address: property.address,
    score,
    breakdown: { violations, ownershipAge, absentee, taxDelinq, evictions, flood, rental },
  });

  return score;
};

// ---------------------------------------------------------------------------
// Detect burnt out signals list (for display in Retool / Claude prompt)
// ---------------------------------------------------------------------------

/**
 * Return a human-readable list of burnt out signals detected.
 * @param {object} property
 * @param {object} signals
 * @param {object} floodData
 * @returns {string[]}
 */
const detectBurntOutSignals = (property, signals = {}, floodData = null) => {
  const found = [];

  if ((signals.hpd_violations || 0) >= 3)   found.push(`${signals.hpd_violations} HPD violations (repeat offender)`);
  if ((signals.hpd_class_c || 0) > 0)       found.push(`${signals.hpd_class_c} immediately hazardous (Class C) violations`);
  if ((signals.years_owned || 0) >= 10)      found.push(`Long-term owner (${signals.years_owned} years)`);
  if (signals.out_of_state_owner)            found.push('Out-of-state / absentee owner');
  if (signals.is_tax_delinquent)             found.push(`Tax delinquent ($${signals.delinquent_amount?.toLocaleString() || '?'})`);
  if ((signals.eviction_count || 0) >= 2)   found.push(`${signals.eviction_count} eviction filings`);
  if (floodData?.risk === 'high' || floodData?.risk === 'extreme') found.push(`Flood zone ${floodData.zone} (${floodData.label})`);
  if ((signals.code_violations || 0) >= 2)  found.push(`${signals.code_violations} code violations`);
  if (signals.repeat_offender)               found.push('Repeat code violator');

  return found;
};

// ---------------------------------------------------------------------------
// Full enrichment pipeline for a single property
// ---------------------------------------------------------------------------

/**
 * Run the full burnt out landlord enrichment pipeline.
 * Detects state (NY or NJ) and runs appropriate scrapers.
 * @param {object} property - Normalized property with state field
 * @returns {Promise<object>}
 */
const enrichBurntOutLandlord = async (property) => {
  const state = (property.state || '').toUpperCase();

  let signals   = {};
  let floodData = null;

  // Run state-specific enrichment + flood check in parallel
  const [stateResult, floodResult] = await Promise.allSettled([
    state === 'NY' ? enrichWithNYCData(property) : enrichWithNJData(property),
    checkFloodRisk(property.full || property.address, property.lat, property.lng),
  ]);

  signals   = stateResult.value  || {};
  floodData = floodResult.value  || null;

  const score   = calculateBurntOutLandlordScore(property, signals, floodData);
  const found = detectBurntOutSignals(property, signals, floodData);

  const result = {
    burnt_out_landlord_score: score,
    burnt_out_signals: found,
    is_burnt_out_landlord: score >= 40,
    flood_data: floodData,
    enrichment_signals: signals,
    deal_type_override: score >= 60 ? 'Burnt Out Landlord' : null,
    enriched_at: new Date().toISOString(),
  };

  logger.info('Burnt out landlord enrichment complete', {
    address: property.address,
    score,
    signals: found.length,
    is_burnt_out: result.is_burnt_out_landlord,
  });

  return result;
};

module.exports = {
  calculateBurntOutLandlordScore,
  detectBurntOutSignals,
  enrichBurntOutLandlord,
  scoreViolations,
  scoreOwnershipDuration,
  scoreAbsenteeOwner,
  scoreTaxDelinquency,
  scoreEvictions,
  scoreFloodRisk,
};
