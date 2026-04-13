const logger = require('../config/logger');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Joi validation error handler.
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err && err.isJoi) {
    return res.status(400).json(
      errorResponse('Validation failed', err.details.map((d) => d.message), 400)
    );
  }
  next(err);
};

/**
 * Global error handler — catches all unhandled errors.
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: message,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json(errorResponse(message, null, statusCode));
};

/**
 * 404 handler for unknown routes.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.url}`, null, 404));
};

module.exports = { validationErrorHandler, globalErrorHandler, notFoundHandler };
