'use strict';

const axios = require('axios');
const logger = require('../config/logger');

// NJ Open Data / NJOGIS endpoints
const NJ_PARCELS_API  = 'https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_and_MOD_IV_Composite/FeatureServer/0/query';
const NJ_TAX_API      = 'https://data.nj.gov/resource';
const RUTGERS_MODIV   = 'https://modiv.rutgers.edu/api';

// ---------------------------------------------------------------------------
// NJ MOD-IV Property Data (via NJOGIS ArcGIS REST API)
// Contains: assessed value, property class, deed info, owner data
// Note: Owner names redacted per Daniel's Law — we use address/parcel data
// ---------------------------------------------------------------------------

/**
 * Search NJ parcels by address.
 * @param {string} address
 * @param {string} municipality - e.g. "NEWARK", "JERSEY CITY"
 * @param {string} county       - e.g. "ESSEX", "HUDSON", "BERGEN"
 * @returns {Promise<Array>}
 */
const searchNJParcels = async (address, municipality, county) => {
  try {
    const where = [
      address      ? `PROPLOCN LIKE '%${address.toUpperCase()}%'`    : null,
      municipality ? `MUNNAME = '${municipality.toUpperCase()}'`      : null,
      county       ? `COUNTY_NAME = '${county.toUpperCase()} COUNTY'` : null,
    ].filter(Boolean).join(' AND ');

    const { data } = await axios.get(NJ_PARCELS_API, {
      params: {
        where: where || '1=1',
        outFields: [
          'PROPLOCN',    // property location/address
          'MUNNAME',     // municipality
          'COUNTY_NAME',
          'PROPCLASS',   // 1=vacant, 2=residential, 4A=commercial, 4B=industrial
          'ASSMNTACRE',  // acreage
          'TAXYR',       // tax year
          'NETPRPTAX',   // net property tax
          'DEDUCTIONS',  // deductions applied
          'SALEDATE',    // last sale date
          'SALEPRICE',   // last sale price
          'SQFT',        // square footage
          'YEARBUILT',
          'ZONING',
        ].join(','),
        f: 'json',
        resultRecordCount: 10,
      },
      timeout: 15000,
    });

    if (!data.features) return [];

    return data.features.map((f) => ({
      source: 'nj_modiv',
      address:      f.attributes.PROPLOCN,
      municipality: f.attributes.MUNNAME,
      county:       f.attributes.COUNTY_NAME,
      property_class: f.attributes.PROPCLASS,
      year_built:   f.attributes.YEARBUILT,
      square_footage: f.attributes.SQFT,
      net_tax:      f.attributes.NETPRPTAX,
      deductions:   f.attributes.DEDUCTIONS,
      last_sale_date:  f.attributes.SALEDATE,
      last_sale_price: f.attributes.SALEPRICE,
      zoning:       f.attributes.ZONING,
      geometry:     f.geometry,
    }));
  } catch (err) {
    logger.error('NJ parcel search failed', { error: err.message });
    return [];
  }
};

/**
 * Get NJ property by parcel ID (Block/Lot/Qualifier).
 * @param {string} block
 * @param {string} lot
 * @param {string} municipality
 * @returns {Promise<object|null>}
 */
const getNJPropertyByBlockLot = async (block, lot, municipality) => {
  try {
    const { data } = await axios.get(NJ_PARCELS_API, {
      params: {
        where: `BLOCK='${block}' AND LOT='${lot}' AND MUNNAME='${municipality.toUpperCase()}'`,
        outFields: '*',
        f: 'json',
        resultRecordCount: 1,
      },
      timeout: 10000,
    });

    const feature = data.features?.[0];
    return feature ? { source: 'nj_modiv', ...feature.attributes } : null;
  } catch (err) {
    logger.error('NJ block/lot fetch failed', { error: err.message });
    return null;
  }
};

// ---------------------------------------------------------------------------
// NJ Tax Delinquency (NJ Transparency Portal)
// ---------------------------------------------------------------------------

/**
 * Get NJ property tax delinquency data.
 * High taxes + delinquency = burnt out landlord signal.
 * @param {string} municipality
 * @param {string} county
 * @returns {Promise<Array>} Top delinquent properties
 */
const getNJTaxDelinquency = async (municipality, county) => {
  try {
    const { data } = await axios.get(`${NJ_TAX_API}/8cgs-38vv.json`, {
      params: {
        municipality: municipality?.toUpperCase(),
        county: county?.toUpperCase(),
        $where: 'delinquent_amount > 5000',
        $limit: 100,
        $order: 'delinquent_amount DESC',
      },
      timeout: 10000,
    });

    return (data || []).map((r) => ({
      source: 'nj_tax_delinquency',
      address:       r.property_location,
      municipality:  r.municipality,
      county:        r.county,
      delinquent_amount: parseFloat(r.delinquent_amount || 0),
      tax_year:      r.tax_year,
      block:         r.block,
      lot:           r.lot,
    }));
  } catch (err) {
    logger.error('NJ tax delinquency fetch failed', { error: err.message });
    return [];
  }
};

// ---------------------------------------------------------------------------
// NJ Code Violations (via individual municipality open data portals)
// Major NJ cities with open data APIs
// ---------------------------------------------------------------------------

const NJ_CITY_VIOLATION_APIS = {
  'NEWARK':      'https://data.newarkde.gov/resource/violations.json',
  'JERSEY CITY': 'https://data.jerseycitynj.gov/resource/violations.json',
  'TRENTON':     'https://data.trentonnj.gov/resource/violations.json',
};

/**
 * Get code violations for a NJ municipality.
 * Falls back to NJOGIS parcel data for municipalities without open data portals.
 * @param {string} address
 * @param {string} municipality
 * @returns {Promise<Array>}
 */
const getNJCodeViolations = async (address, municipality) => {
  const apiUrl = NJ_CITY_VIOLATION_APIS[municipality?.toUpperCase()];

  if (!apiUrl) {
    logger.debug('No open data portal for municipality', { municipality });
    return [];
  }

  try {
    const { data } = await axios.get(apiUrl, {
      params: {
        $where: `address like '%${address.toUpperCase()}%'`,
        $limit: 50,
        $order: 'violation_date DESC',
      },
      timeout: 10000,
    });

    return (data || []).map((v) => ({
      source: 'nj_code_violations',
      address: v.address,
      violation_type: v.violation_type || v.description,
      violation_date: v.violation_date,
      status: v.status,
      municipality,
    }));
  } catch (err) {
    logger.error('NJ code violations fetch failed', { municipality, error: err.message });
    return [];
  }
};

// ---------------------------------------------------------------------------
// NJ Long-Term Ownership Detection
// Uses last sale date from MOD-IV to flag properties owned 10+ years
// ---------------------------------------------------------------------------

/**
 * Calculate years owned from last sale date.
 * @param {string|null} saleDate
 * @returns {{ yearsOwned: number|null, isLongTermOwner: boolean }}
 */
const calcYearsOwned = (saleDate) => {
  if (!saleDate) return { yearsOwned: null, isLongTermOwner: false };
  const sale = new Date(saleDate);
  if (isNaN(sale.getTime())) return { yearsOwned: null, isLongTermOwner: false };
  const years = (Date.now() - sale.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return {
    yearsOwned: Math.round(years),
    isLongTermOwner: years >= 10,
  };
};

// ---------------------------------------------------------------------------
// Full NJ property enrichment
// ---------------------------------------------------------------------------

/**
 * Run all NJ data checks for a property.
 * @param {object} property - Normalized property
 * @returns {Promise<object>}
 */
const enrichWithNJData = async (property) => {
  const address      = property.street || property.address || '';
  const municipality = property.city   || '';
  const county       = property.county || '';

  const [parcels, delinquency, violations] = await Promise.allSettled([
    searchNJParcels(address, municipality, county),
    getNJTaxDelinquency(municipality, county),
    getNJCodeViolations(address, municipality),
  ]);

  const parcelData     = parcels.value?.[0]    || null;
  const delinquencyList = delinquency.value    || [];
  const violationList  = violations.value      || [];

  const { yearsOwned, isLongTermOwner } = calcYearsOwned(parcelData?.last_sale_date);

  const isDelinquent = delinquencyList.some(
    (d) => d.address?.toUpperCase().includes(address.toUpperCase())
  );

  const signals = {
    parcel_data:       parcelData,
    years_owned:       yearsOwned,
    is_long_term_owner: isLongTermOwner,
    is_tax_delinquent: isDelinquent,
    delinquent_amount: isDelinquent
      ? delinquencyList.find((d) => d.address?.includes(address))?.delinquent_amount
      : 0,
    code_violations:       violationList.length,
    raw_violations:        violationList,
    property_class:        parcelData?.property_class,
    last_sale_date:        parcelData?.last_sale_date,
    last_sale_price:       parcelData?.last_sale_price,
  };

  logger.info('NJ data enrichment complete', {
    address,
    years_owned: yearsOwned,
    is_delinquent: isDelinquent,
    violations: violationList.length,
  });

  return signals;
};

module.exports = {
  searchNJParcels,
  getNJPropertyByBlockLot,
  getNJTaxDelinquency,
  getNJCodeViolations,
  calcYearsOwned,
  enrichWithNJData,
};
