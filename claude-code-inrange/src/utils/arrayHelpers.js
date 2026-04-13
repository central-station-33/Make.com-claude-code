'use strict';

/**
 * Remove duplicate values from an array.
 * @param {Array} arr
 * @param {string} [key] - Object key to deduplicate by
 * @returns {Array}
 */
const deduplicate = (arr, key) => {
  if (!Array.isArray(arr)) return [];
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

/**
 * Group array items by a key.
 * @param {Array} arr
 * @param {string|Function} keyFn
 * @returns {object}
 */
const groupBy = (arr, keyFn) => {
  if (!Array.isArray(arr)) return {};
  const fn = typeof keyFn === 'function' ? keyFn : (item) => item[keyFn];
  return arr.reduce((acc, item) => {
    const key = fn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

/**
 * Chunk an array into smaller arrays of a given size.
 * @param {Array} arr
 * @param {number} size
 * @returns {Array[]}
 */
const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

module.exports = { deduplicate, groupBy, chunk };
