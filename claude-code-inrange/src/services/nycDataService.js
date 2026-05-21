'use strict';

const axios = require('axios');
const logger = require('../config/logger');

// NYC Open Data uses the Socrata API (free, no key required for basic use)
const NYC_API_BASE = 'https://data.cityofnewyork.us/resource';
const APP_TOKEN = process.env.NYC_OPEN_DATA_APP_TOKEN || ''; // optional but increases rate limits

const headers = APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {};

// ---------------------------------------------------------------------------
// HPD Violations  (Housing Maintenance Code — landlord violations)
// Dataset: wvxf-dwi5
// ---------------------------------------------------------------------------

/**
 * Fetch open HPD violations for a given address.
 * Class B (hazardous) and Class C (immediately hazardous) are burnt-out signals.
 * @param {string} houseNumber
 * @param {string} streetName
 * @param {string} borough  - MANHATTAN | BROOKLYN | QUEENS | BRONX | STATEN ISLAND
 * @returns {Promise<Array>}
 */
const getHPDViolations = async (houseNumber, streetName, borough) => {
  try {
    const { data } = await axios.get(`${NYC_API_BASE}/wvxf-dwi5.json`, {
      headers,
      params: {
        housenumber: houseNumber,
        streetname: streetName.toUpperCase(),
        borough: borough.toUpperCase(),
        $limit: 100,
        $order: 'inspectiondate DESC',
      },
      timeout: 10000,
    });

    return data.map((v) => ({
      source: 'nyc_hpd',
      violation_id: v.violationid,
      class: v.class,           // A, B, C, I
      status: v.violationstatus,
      description: v.novdescription,
      inspection_date: v.inspectiondate,
      order_number: v.ordernumber,
      apartment: v.apartment,
      story: v.story,
    }));
  } catch (err) {
    logger.error('HPD violations fetch failed', { error: err.message });
    return [];
  }
};

/**
 * Get HPD violation summary for scoring.
 * @param {string} houseNumber
 * @param {string} streetName
 * @param {string} borough
 * @returns {Promise<{ totalViolations: number, classB: number, classC: number, isRepeatOffender: boolean, score: number }>}
 */
const getHPDViolationScore = async (houseNumber, streetName, borough) => {
  const violations = await getHPDViolations(houseNumber, streetName, borough);

  const classB = violations.filter((v) => v.class === 'B').length;
  const classC = violations.filter((v) => v.class === 'C').length;
  const total  = violations.length;

  // Burnt out signal: 3+ violations = repeat offender landlord
  const isRepeatOffender = total >= 3;

  // Score: max 30 pts
  let score = 0;
  score += Math.min(classC * 10, 20); // Class C = immediately hazardous (up to 20 pts)
  score += Math.min(classB * 5, 15);  // Class B = hazardous (up to 15 pts)
  if (isRepeatOffender) score += 10;
  score = Math.min(score, 30);

  return { totalViolations: total, classB, classC, isRepeatOffender, score, violations };
};

// ---------------------------------------------------------------------------
// DOB Violations  (Department of Buildings)
// Dataset: 3h2n-5cm9
// ---------------------------------------------------------------------------

/**
 * Fetch DOB building violations for a property.
 * @param {string} bin - Building Identification Number (or use houseNumber + streetName)
 * @returns {Promise<Array>}
 */
const getDOBViolations = async (bin) => {
  try {
    const { data } = await axios.get(`${NYC_API_BASE}/3h2n-5cm9.json`, {
      headers,
      params: {
        bin,
        $limit: 50,
        $order: 'issue_date DESC',
      },
      timeout: 10000,
    });

    return data.map((v) => ({
      source: 'nyc_dob',
      violation_number: v.isndobbisviol,
      description: v.description,
      issue_date: v.issue_date,
      disposition_date: v.disposition_date,
      disposition_description: v.disposition_description,
      device_number: v.device_number,
    }));
  } catch (err) {
    logger.error('DOB violations fetch failed', { error: err.message });
    return [];
  }
};

// ---------------------------------------------------------------------------
// NYC PLUTO  (Primary Land Use Tax Lot Output — full property data)
// Dataset: 64uk-42ks
// ---------------------------------------------------------------------------

/**
 * Get full property data from PLUTO by BBL (Borough-Block-Lot).
 * @param {string} bbl - e.g. "1000477501"
 * @returns {Promise<object|null>}
 */
const getPLUTOByBBL = async (bbl) => {
  try {
    const { data } = await axios.get(`${NYC_API_BASE}/64uk-42ks.json`, {
      headers,
      params: { bbl, $limit: 1 },
      timeout: 10000,
    });

    if (!data.length) return null;
    const p = data[0];

    return {
      source: 'nyc_pluto',
      bbl: p.bbl,
      address: p.address,
      borough: p.borough,
      block: p.block,
      lot: p.lot,
      zip: p.zipcode,
      owner_name: p.ownername,
      building_class: p.bldgclass,     // e.g. A1=SFR, D4=elevator apt
      land_use: p.landuse,
      residential_units: p.unitsres,
      total_units: p.unitstotal,
      year_built: p.yearbuilt,
      year_altered: p.yearalter1,
      assessed_land: p.assessland,
      assessed_total: p.assesstot,
      lot_area: p.lotarea,
      building_area: p.bldgarea,
      floors: p.numfloors,
    };
  } catch (err) {
    logger.error('PLUTO fetch failed', { error: err.message });
    return null;
  }
};

/**
 * Search PLUTO by address components.
 * @param {string} address - e.g. "123 MAIN ST"
 * @param {string} borough - MN | BK | QN | BX | SI
 * @returns {Promise<Array>}
 */
const searchPLUTO = async (address, borough) => {
  try {
    const { data } = await axios.get(`${NYC_API_BASE}/64uk-42ks.json`, {
      headers,
      params: {
        $where: `address like '%${address.toUpperCase()}%' AND borough='${borough.toUpperCase()}'`,
        $limit: 10,
      },
      timeout: 10000,
    });
    return data;
  } catch (err) {
    logger.error('PLUTO search failed', { error: err.message });
    return [];
  }
};

// ---------------------------------------------------------------------------
// NYC Evictions
// Dataset: 6z8x-wfk4
// ---------------------------------------------------------------------------

/**
 * Get eviction filings for a building/address.
 * Frequent evictions = burnt out landlord signal.
 * @param {string} evictionAddress
 * @param {string} borough
 * @returns {Promise<Array>}
 */
const getEvictions = async (evictionAddress, borough) => {
  try {
    const { data } = await axios.get(`${NYC_API_BASE}/6z8x-wfk4.json`, {
      headers,
      params: {
        $where: `eviction_address like '%${evictionAddress.toUpperCase()}%' AND borough='${borough.toUpperCase()}'`,
        $limit: 50,
        $order: 'executed_date DESC',
      },
      timeout: 10000,
    });

    return data.map((e) => ({
      source: 'nyc_evictions',
      court_index: e.court_index_number,
      address: e.eviction_address,
      apartment: e.eviction_apartment_number,
      executed_date: e.executed_date,
      marshal_first: e.marshal_first_name,
      marshal_last: e.marshal_last_name,
      residential: e.residential_commercial_ind === 'Residential',
    }));
  } catch (err) {
    logger.error('Evictions fetch failed', { error: err.message });
    return [];
  }
};

// ---------------------------------------------------------------------------
// Worst Landlord List (NYC Public Advocate)
// ---------------------------------------------------------------------------

/**
 * Check if an owner appears on NYC's Worst Landlord Watchlist.
 * @param {string} ownerName
 * @returns {Promise<boolean>}
 */
const checkWorstLandlordList = async (ownerName) => {
  try {
    const { data } = await axios.get('https://www.landlordwatchlist.com/api/search', {
      params: { q: ownerName },
      timeout: 5000,
    });
    return !!(data && data.results && data.results.length > 0);
  } catch {
    return false; // Non-critical — fail silently
  }
};

// ---------------------------------------------------------------------------
// Full NYC property enrichment
// ---------------------------------------------------------------------------

/**
 * Run all NYC data checks for a property and return combined burnt-out signals.
 * @param {object} property - Normalized property with address components
 * @returns {Promise<object>}
 */
const enrichWithNYCData = async (property) => {
  const houseNum  = property.house_number || property.address?.split(' ')[0] || '';
  const street    = property.street_name  || property.address?.split(' ').slice(1).join(' ') || '';
  const borough   = property.borough || 'MANHATTAN';
  const bbl       = property.bbl || '';

  const [hpdResult, evictions, pluto] = await Promise.allSettled([
    getHPDViolationScore(houseNum, street, borough),
    getEvictions(street, borough),
    bbl ? getPLUTOByBBL(bbl) : Promise.resolve(null),
  ]);

  const hpd          = hpdResult.value   || { totalViolations: 0, classB: 0, classC: 0, score: 0 };
  const evictionList = evictions.value   || [];
  const plutoData    = pluto.value       || null;

  // Detect out-of-state owner from PLUTO
  const outOfStateOwner = plutoData?.owner_name && property.owner_state &&
    property.owner_state !== 'NY';

  const signals = {
    hpd_violations:      hpd.totalViolations,
    hpd_class_b:         hpd.classB,
    hpd_class_c:         hpd.classC,
    hpd_score:           hpd.score,
    eviction_count:      evictionList.length,
    repeat_offender:     hpd.isRepeatOffender,
    out_of_state_owner:  outOfStateOwner,
    pluto:               plutoData,
    raw_violations:      hpd.violations,
    raw_evictions:       evictionList,
  };

  logger.info('NYC data enrichment complete', {
    address: property.address,
    hpd_violations: hpd.totalViolations,
    evictions: evictionList.length,
  });

  return signals;
};

module.exports = {
  getHPDViolations,
  getHPDViolationScore,
  getDOBViolations,
  getPLUTOByBBL,
  searchPLUTO,
  getEvictions,
  enrichWithNYCData,
};
