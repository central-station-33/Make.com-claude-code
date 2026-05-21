const logger = require('../config/logger');
const { v4: uuidv4 } = require('crypto').webcrypto ? require('crypto') : { v4: () => Math.random().toString(36).slice(2) };

/**
 * Attach a unique request ID and log each incoming request/response.
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
};

module.exports = requestLogger;
