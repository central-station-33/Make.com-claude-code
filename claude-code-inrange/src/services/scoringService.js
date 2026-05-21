'use strict';

const { clamp, round } = require('../utils/numberHelpers');
const { daysUntil, daysSince, parseDate } = require('../utils/dateHelpers');
const logger = require('../config/logger');

// ---------------------------------------------------------------------------
// Distress Score (0–100) – weight 35% of composite
// ---------------------------------------------------------------------------

const DISTRESS_INDICATORS = {
  foreclosure_notice: 25,
  lis_pendens: 20,
  pre_foreclosure: 20,
  tax_lien: 15,
  tax_delinquent: 15,
  probate: 10,
  code_violation: 8,
  hoa_lien: 8,
  bankruptcy: 12,
  divorce: 5,
  vacant: 10,
  condemned: 15,
  water_shutoff: 8,
  utility_shutoff: 6,
};

/**
 * Calculate the distress score for a property.
 * @param {object} property
 * @returns {number} 0–100
 */
const calculateDistressScore = (property) => {
  let score = 0;
  const indicators = property.distress_indicators || [];

  // Base points for each indicator
  for (const indicator of indicators) {
    const key = indicator.toLowerCase().replace(/[\s-]/g, '_');
    score += DISTRESS_INDICATORS[key] || 5;
  }

  // Recency bonus: notice filed in last 30 days
  const noticeDays = daysSince(property.notice_date);
  if (noticeDays !== null && noticeDays <= 30) score += 10;
  else if (noticeDays !== null && noticeDays <= 90) score += 5;

  // Multiple indicators bonus
  if (indicators.length >= 3) score += 15;
  else if (indicators.length >= 2) score += 8;

  return clamp(round(score), 0, 100);
};

// ---------------------------------------------------------------------------
// Deal Quality Score (0–100) – weight 30% of composite
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_POINTS = {
  sfr: 30,
  single_family: 30,
  multifamily: 25,
  duplex: 22,
  triplex: 22,
  fourplex: 22,
  condo: 18,
  townhouse: 20,
  mobile_home: 10,
  land: 8,
  commercial: 15,
};

/**
 * Calculate deal quality score.
 * @param {object} property
 * @returns {number} 0–100
 */
const calculateDealQualityScore = (property) => {
  let score = 0;

  // Property type
  const type = (property.property_type || '').toLowerCase().replace(/[\s-]/g, '_');
  score += PROPERTY_TYPE_POINTS[type] || 10;

  // Equity position
  const arv = property.estimated_arv || property.arv || 0;
  const owed = property.amount_owed || property.mortgage_balance || 0;
  if (arv > 0) {
    const equityPct = ((arv - owed) / arv) * 100;
    if (equityPct >= 50) score += 30;
    else if (equityPct >= 30) score += 20;
    else if (equityPct >= 15) score += 10;
  }

  // Below-market pricing
  const askingPrice = property.asking_price || property.list_price || 0;
  if (arv > 0 && askingPrice > 0) {
    const belowMarket = ((arv - askingPrice) / arv) * 100;
    if (belowMarket >= 30) score += 25;
    else if (belowMarket >= 20) score += 15;
    else if (belowMarket >= 10) score += 8;
  }

  // Location quality proxy: median home value
  const medianValue = property.median_home_value || 0;
  if (medianValue >= 400000) score += 15;
  else if (medianValue >= 200000) score += 10;
  else if (medianValue >= 100000) score += 5;

  return clamp(round(score), 0, 100);
};

// ---------------------------------------------------------------------------
// Contact Likelihood Score (0–100) – weight 20% of composite
// ---------------------------------------------------------------------------

/**
 * Calculate the likelihood that the owner can be contacted.
 * @param {object} property
 * @returns {number} 0–100
 */
const calculateContactLikelihoodScore = (property) => {
  let score = 0;

  if (property.owner_phone) score += 25;
  if (property.owner_email) score += 20;
  if (property.owner_mailing_address) score += 15;

  // Owner type
  const ownerType = (property.owner_type || '').toLowerCase();
  if (ownerType === 'individual' || ownerType === 'person') score += 20;
  else if (ownerType === 'trust') score += 10;
  else if (ownerType === 'llc' || ownerType === 'corporation') score += 5;

  // Out-of-state owner (higher motivation)
  const propState = (property.state || '').toUpperCase();
  const ownerState = (property.owner_state || '').toUpperCase();
  if (propState && ownerState && propState !== ownerState) score += 10;

  // Record completeness
  const fields = ['owner_name', 'owner_phone', 'owner_email', 'owner_mailing_address'];
  const filled = fields.filter((f) => property[f]).length;
  score += filled * 2;

  return clamp(round(score), 0, 100);
};

// ---------------------------------------------------------------------------
// Timeline Urgency Score (0–100) – weight 15% of composite
// ---------------------------------------------------------------------------

/**
 * Calculate urgency based on foreclosure timeline.
 * @param {object} property
 * @returns {number} 0–100
 */
const calculateTimelineUrgencyScore = (property) => {
  let score = 0;

  // Days to auction
  const daysToAuction = daysUntil(property.auction_date);
  if (daysToAuction !== null) {
    if (daysToAuction <= 14) score += 50;
    else if (daysToAuction <= 30) score += 35;
    else if (daysToAuction <= 60) score += 20;
    else if (daysToAuction <= 90) score += 10;
  }

  // Notice recency
  const noticeAge = daysSince(property.notice_date);
  if (noticeAge !== null) {
    if (noticeAge <= 7) score += 25;
    else if (noticeAge <= 30) score += 15;
    else if (noticeAge <= 90) score += 5;
  }

  // Process stage
  const stage = (property.process_stage || property.foreclosure_stage || '').toLowerCase();
  if (stage.includes('auction') || stage.includes('sale')) score += 25;
  else if (stage.includes('notice of sale') || stage.includes('nos')) score += 20;
  else if (stage.includes('default') || stage.includes('nod')) score += 10;
  else if (stage.includes('pre')) score += 5;

  return clamp(round(score), 0, 100);
};

// ---------------------------------------------------------------------------
// Composite Score & Tier
// ---------------------------------------------------------------------------

/**
 * Calculate weighted composite score.
 * Weights: distress 35%, deal quality 30%, contact 20%, timeline 15%.
 * @param {{ distress: number, dealQuality: number, contactLikelihood: number, timelineUrgency: number }} scores
 * @returns {number} 0–100
 */
const assignCompositeScore = (scores) => {
  const { distress = 0, dealQuality = 0, contactLikelihood = 0, timelineUrgency = 0 } = scores;
  const composite =
    distress * 0.35 +
    dealQuality * 0.30 +
    contactLikelihood * 0.20 +
    timelineUrgency * 0.15;
  return clamp(round(composite), 0, 100);
};

/**
 * Assign a priority tier based on composite score.
 * @param {number} score
 * @returns {'Tier 1'|'Tier 2'|'Tier 3'|'Tier 4'}
 */
const assignPriorityTier = (score) => {
  if (score >= 80) return 'Tier 1';
  if (score >= 60) return 'Tier 2';
  if (score >= 40) return 'Tier 3';
  return 'Tier 4';
};

// ---------------------------------------------------------------------------
// Deal Type Identification
// ---------------------------------------------------------------------------

const DEAL_TYPE_MAP = [
  { type: 'Foreclosure', keywords: ['foreclosure_notice', 'lis_pendens', 'pre_foreclosure'] },
  { type: 'Tax Lien', keywords: ['tax_lien', 'tax_delinquent'] },
  { type: 'Probate', keywords: ['probate'] },
  { type: 'Divorce', keywords: ['divorce'] },
  { type: 'Bankruptcy', keywords: ['bankruptcy'] },
  { type: 'Code Violation', keywords: ['code_violation', 'condemned'] },
  { type: 'Vacant Property', keywords: ['vacant'] },
  { type: 'HOA Lien', keywords: ['hoa_lien'] },
];

/**
 * Identify the primary deal type from distress indicators.
 * @param {object} property
 * @returns {string}
 */
const identifyDealType = (property) => {
  const indicators = (property.distress_indicators || []).map((i) =>
    i.toLowerCase().replace(/[\s-]/g, '_')
  );

  for (const { type, keywords } of DEAL_TYPE_MAP) {
    if (keywords.some((kw) => indicators.includes(kw))) return type;
  }

  return 'Other Distress';
};

// ---------------------------------------------------------------------------
// Full Scoring Pipeline
// ---------------------------------------------------------------------------

/**
 * Score a property and return all score components.
 * @param {object} property
 * @returns {object} Full scoring result
 */
const scoreProperty = (property) => {
  const distress = calculateDistressScore(property);
  const dealQuality = calculateDealQualityScore(property);
  const contactLikelihood = calculateContactLikelihoodScore(property);
  const timelineUrgency = calculateTimelineUrgencyScore(property);
  const composite = assignCompositeScore({ distress, dealQuality, contactLikelihood, timelineUrgency });
  const tier = assignPriorityTier(composite);
  const dealType = identifyDealType(property);

  const result = {
    distress_score: distress,
    deal_quality_score: dealQuality,
    contact_likelihood_score: contactLikelihood,
    timeline_urgency_score: timelineUrgency,
    composite_score: composite,
    priority_tier: tier,
    deal_type: dealType,
  };

  logger.debug('Property scored', { address: property.address, ...result });
  return result;
};

module.exports = {
  calculateDistressScore,
  calculateDealQualityScore,
  calculateContactLikelihoodScore,
  calculateTimelineUrgencyScore,
  assignCompositeScore,
  assignPriorityTier,
  identifyDealType,
  scoreProperty,
};
