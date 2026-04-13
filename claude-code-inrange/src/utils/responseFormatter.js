'use strict';

/**
 * Standard success response envelope.
 * @param {*} data
 * @param {string} [message]
 * @param {object} [meta] - Pagination or other metadata
 * @returns {object}
 */
const successResponse = (data, message = 'Success', meta = {}) => ({
  success: true,
  message,
  data,
  meta,
  timestamp: new Date().toISOString(),
});

/**
 * Standard error response envelope.
 * @param {string} message
 * @param {*} [errors]
 * @param {number} [statusCode]
 * @returns {object}
 */
const errorResponse = (message, errors = null, statusCode = 500) => ({
  success: false,
  message,
  errors,
  statusCode,
  timestamp: new Date().toISOString(),
});

/**
 * Paginated response envelope.
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
const paginatedResponse = (items, total, page, limit) =>
  successResponse(items, 'Success', {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });

module.exports = { successResponse, errorResponse, paginatedResponse };
