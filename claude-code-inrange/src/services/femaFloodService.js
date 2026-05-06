'use strict';

const axios = require('axios');
const logger = require('../config/logger');

// FEMA National Flood Hazard Layer — free, no API key required
const FEMA_API_BASE = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer';

// FEMA flood zone codes
const FLOOD_ZONE_RISK = {
  'A':   { risk: 'high',    label: 'High Risk - No BFE',          score: 25 },
  'AE':  { risk: 'high',    label: 'High Risk - BFE Determined',  score: 25 },
  'AH':  { risk: 'high',    label: 'High Risk - Ponding',         score: 25 },
  'AO':  { risk: 'high',    label: 'High Risk - Sheet Flow',      score: 25 },
  'A99': { risk: 'high',    label: 'High Risk - Protected Area',  score: 20 },
  'VE':  { risk: 'extreme', label: 'Coastal High Hazard',         score: 30 },
  'V':   { risk: 'extreme', label: 'Coastal High Hazard',         score: 30 },
  'X':   { risk: 'low',     label: 'Minimal/Moderate Risk',       score: 0  },
  'B':   { risk: 'low',     label: 'Moderate Risk',               score: 5  },
  'C':   { risk: 'low',     label: 'Minimal Risk',                score: 0  },
  'D':   { risk: 'undetermined', label: 'Undetermined Risk',      score: 5  },
};

/**
 * Get FEMA flood zone for a lat/lng coordinate.
 * High flood risk = expensive insurance burden = burnt out landlord signal.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object|null>}
 */
const getFloodZone = async (lat, lng) => {
  if (!lat || !lng) return null;

  try {
    // Layer 28 = Flood Hazard Zones
    const { data } = await axios.get(`${FEMA_API_BASE}/28/query`, {
      params: {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: 4326,
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STUDY_TYP',
        returnGeometry: false,
        f: 'json',
      },
      timeout: 10000,
    });

    const feature = data.features?.[0];
    if (!feature) return { zone: 'X', risk: 'low', label: 'Minimal Risk', score: 0 };

    const zone     = feature.attributes.FLD_ZONE;
    const zoneInfo = FLOOD_ZONE_RISK[zone] || { risk: 'unknown', label: zone, score: 5 };
    const inSFHA   = feature.attributes.SFHA_TF === 'T'; // Special Flood Hazard Area

    return {
      zone,
      risk:    zoneInfo.risk,
      label:   zoneInfo.label,
      score:   zoneInfo.score,
      in_sfha: inSFHA,
      subtype: feature.attributes.ZONE_SUBTY,
    };
  } catch (err) {
    logger.error('FEMA flood zone fetch failed', { lat, lng, error: err.message });
    return null;
  }
};

/**
 * Check FEMA flood zone by address using geocoding then flood lookup.
 * @param {string} fullAddress
 * @param {number} [lat]
 * @param {number} [lng]
 * @returns {Promise<object|null>}
 */
const checkFloodRisk = async (fullAddress, lat, lng) => {
  // If we already have coordinates, use them directly
  if (lat && lng) return getFloodZone(lat, lng);

  // Otherwise geocode first
  try {
    const { geocodeAddress } = require('./geocodingService');
    const geo = await geocodeAddress(fullAddress);
    if (!geo) return null;
    return getFloodZone(geo.lat, geo.lng);
  } catch (err) {
    logger.error('Flood risk check failed', { address: fullAddress, error: err.message });
    return null;
  }
};

/**
 * Get NFIP (National Flood Insurance Program) claims for a community.
 * Properties with multiple flood claims = high insurance burden = motivated seller.
 * @param {string} stateCode  - 'NY' or 'NJ'
 * @param {string} county
 * @returns {Promise<object>}
 */
const getNFIPStats = async (stateCode, county) => {
  try {
    // FEMA OpenFEMA API — free, public
    const { data } = await axios.get('https://www.fema.gov/api/open/v1/fimaNfipPolicies', {
      params: {
        $filter: `state eq '${stateCode}' and countyCode eq '${county}'`,
        $select: 'policyCount,totalInsuranceInForce,totalPremiumsWritten,countyCode',
        $top: 1,
        $format: 'json',
      },
      timeout: 10000,
    });

    const record = data?.FimaNfipPolicies?.[0];
    if (!record) return null;

    return {
      source: 'fema_nfip',
      county,
      state: stateCode,
      policy_count:        parseInt(record.policyCount || 0, 10),
      insurance_in_force:  parseFloat(record.totalInsuranceInForce || 0),
      total_premiums:      parseFloat(record.totalPremiumsWritten || 0),
      avg_premium:         record.policyCount > 0
        ? Math.round(record.totalPremiumsWritten / record.policyCount)
        : 0,
    };
  } catch (err) {
    logger.error('NFIP stats fetch failed', { error: err.message });
    return null;
  }
};

module.exports = { getFloodZone, checkFloodRisk, getNFIPStats, FLOOD_ZONE_RISK };
