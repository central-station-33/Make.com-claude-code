'use strict';

const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

// Simple in-memory geocoding cache
const cache = new Map();

/**
 * Geocode an address using Google Maps or OpenStreetMap (Nominatim) as fallback.
 * @param {string} address - Full address string
 * @returns {Promise<{ lat: number, lng: number, formatted: string }|null>}
 */
const geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;

  const cacheKey = address.trim().toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Try Google Maps first if API key available
  if (config.geocoding.googleApiKey) {
    try {
      const result = await geocodeWithGoogle(address);
      if (result) {
        cache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      logger.warn('Google geocoding failed, trying Nominatim', { error: err.message });
    }
  }

  // Fallback: OpenStreetMap Nominatim (free, no key required)
  try {
    const result = await geocodeWithNominatim(address);
    if (result) cache.set(cacheKey, result);
    return result;
  } catch (err) {
    logger.error('Geocoding failed for address', { address, error: err.message });
    return null;
  }
};

const geocodeWithGoogle = async (address) => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, {
    params: { address, key: config.geocoding.googleApiKey },
    timeout: 5000,
  });

  if (data.status !== 'OK' || !data.results.length) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formatted: data.results[0].formatted_address };
};

const geocodeWithNominatim = async (address) => {
  const url = 'https://nominatim.openstreetmap.org/search';
  const { data } = await axios.get(url, {
    params: { q: address, format: 'json', limit: 1, countrycodes: 'us' },
    headers: { 'User-Agent': 'InRange-Backend/1.0' },
    timeout: 8000,
  });

  if (!data || !data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    formatted: data[0].display_name,
  };
};

/**
 * Batch geocode an array of properties, respecting rate limits.
 * @param {Array} properties
 * @param {number} [delayMs=200] - Delay between requests
 * @returns {Promise<Array>} Properties with lat/lng added
 */
const batchGeocode = async (properties, delayMs = 200) => {
  const results = [];
  for (const prop of properties) {
    const address = prop.full || prop.address || '';
    const geo = await geocodeAddress(address);
    results.push({ ...prop, ...(geo ? { lat: geo.lat, lng: geo.lng } : {}) });
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
};

module.exports = { geocodeAddress, batchGeocode };
