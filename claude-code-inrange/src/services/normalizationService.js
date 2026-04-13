'use strict';

const { parseCurrency } = require('../utils/numberHelpers');
const { cleanName, formatPhone, parseAddress } = require('../utils/stringHelpers');
const { parseDate, formatDate } = require('../utils/dateHelpers');
const logger = require('../config/logger');

/**
 * Normalize address fields.
 * @param {object|string} address - Raw address or object with components
 * @returns {object}
 */
const normalizeAddress = (address) => {
  if (!address) return { street: '', city: '', state: '', zip: '', full: '' };

  if (typeof address === 'string') {
    const parts = parseAddress(address);
    return {
      ...parts,
      full: `${parts.street}, ${parts.city}, ${parts.state} ${parts.zip}`.trim(),
    };
  }

  const street = (address.street || address.address1 || address.street_address || '').toUpperCase().trim();
  const city = (address.city || '').toUpperCase().trim();
  const state = (address.state || '').toUpperCase().trim();
  const zip = (address.zip || address.zipcode || address.postal_code || '').replace(/[^\d-]/g, '').trim();

  return {
    street,
    city,
    state,
    zip,
    full: `${street}, ${city}, ${state} ${zip}`.trim(),
  };
};

/**
 * Normalize financial data fields.
 * @param {object} property
 * @returns {object}
 */
const normalizeFinancials = (property) => {
  const arv = parseCurrency(property.estimated_arv || property.arv);
  const owed = parseCurrency(property.amount_owed || property.mortgage_balance || property.total_debt);
  const askingPrice = parseCurrency(property.asking_price || property.list_price);
  const assessedValue = parseCurrency(property.assessed_value);
  const taxesOwed = parseCurrency(property.taxes_owed || property.tax_amount);

  const equity = arv !== null && owed !== null ? arv - owed : null;
  const equityPct = arv && equity !== null ? Math.round((equity / arv) * 100) : null;
  const belowMarketPct = arv && askingPrice ? Math.round(((arv - askingPrice) / arv) * 100) : null;

  return {
    estimated_arv: arv,
    amount_owed: owed,
    asking_price: askingPrice,
    assessed_value: assessedValue,
    taxes_owed: taxesOwed,
    equity,
    equity_percentage: equityPct,
    below_market_percentage: belowMarketPct,
  };
};

/**
 * Normalize owner information.
 * @param {object} property
 * @returns {object}
 */
const normalizeOwnerInfo = (property) => {
  const name = cleanName(property.owner_name || property.owner || '');
  const phone = formatPhone(property.owner_phone || property.phone || '');
  const email = (property.owner_email || property.email || '').toLowerCase().trim();
  const mailingAddress = normalizeAddress(
    property.owner_mailing_address || property.mailing_address || ''
  );

  // Basic email validation
  const emailValid = email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false;

  return {
    owner_name: name,
    owner_phone: phone,
    owner_email: emailValid ? email : '',
    owner_mailing_address: mailingAddress.full,
    owner_type: (property.owner_type || 'unknown').toLowerCase(),
    owner_state: (property.owner_state || mailingAddress.state || '').toUpperCase(),
  };
};

/**
 * Normalize distress data.
 * @param {object} property
 * @returns {object}
 */
const normalizeDistressData = (property) => {
  const rawIndicators = property.distress_indicators || property.distress_types || [];
  const indicators = rawIndicators
    .map((i) => String(i).toLowerCase().replace(/[\s-]+/g, '_').trim())
    .filter(Boolean);

  const noticeDate = parseDate(property.notice_date || property.filing_date);
  const auctionDate = parseDate(property.auction_date || property.sale_date);
  const recordDate = parseDate(property.record_date);

  return {
    distress_indicators: indicators,
    notice_date: noticeDate ? noticeDate.toISOString() : null,
    auction_date: auctionDate ? auctionDate.toISOString() : null,
    record_date: recordDate ? recordDate.toISOString() : null,
    process_stage: (property.process_stage || property.foreclosure_stage || '').toLowerCase(),
    case_number: property.case_number || property.file_number || '',
  };
};

/**
 * Normalize a full property record.
 * @param {object} raw - Raw property data
 * @returns {object} Normalized property
 */
const normalizeProperty = (raw) => {
  if (!raw) return null;

  const address = normalizeAddress(raw);
  const financials = normalizeFinancials(raw);
  const owner = normalizeOwnerInfo(raw);
  const distress = normalizeDistressData(raw);

  const normalized = {
    // Core identity
    id: raw.id || raw.property_id,
    source: (raw.source || 'unknown').toLowerCase(),

    // Address
    ...address,

    // Property details
    property_type: (raw.property_type || '').toLowerCase().replace(/[\s-]/g, '_'),
    bedrooms: parseInt(raw.bedrooms, 10) || null,
    bathrooms: parseFloat(raw.bathrooms) || null,
    square_footage: parseInt(raw.square_footage || raw.sqft, 10) || null,
    year_built: parseInt(raw.year_built, 10) || null,
    lot_size: raw.lot_size || null,
    county: (raw.county || '').toUpperCase(),
    state: (raw.state || '').toUpperCase(),

    // Financial
    ...financials,

    // Owner
    ...owner,

    // Distress
    ...distress,

    // Meta
    raw_data: raw,
    normalized_at: new Date().toISOString(),
  };

  logger.debug('Property normalized', { address: normalized.full });
  return normalized;
};

module.exports = {
  normalizeAddress,
  normalizeFinancials,
  normalizeOwnerInfo,
  normalizeDistressData,
  normalizeProperty,
};
