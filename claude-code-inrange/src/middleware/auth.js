const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Verify API key for Retool / internal requests.
 */
const apiKeyAuth = (req, res, next) => {
  if (!config.security.apiKey) return next();

  const key = req.headers['x-api-key'];
  if (!key || key !== config.security.apiKey) {
    logger.warn('Invalid API key', { requestId: req.requestId, ip: req.ip });
    return res.status(401).json(errorResponse('Unauthorized', null, 401));
  }
  next();
};

/**
 * Verify HMAC-SHA256 signature for Make.com webhooks.
 * Make.com sends the signature in the X-Make-Signature header.
 */
const webhookSignatureVerifier = (req, res, next) => {
  if (!config.security.webhookSecret) return next();

  const signature = req.headers['x-make-signature'] || req.headers['x-webhook-signature'];
  if (!signature) {
    logger.warn('Missing webhook signature', { requestId: req.requestId });
    return res.status(401).json(errorResponse('Missing webhook signature', null, 401));
  }

  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', config.security.webhookSecret)
    .update(body)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );

  if (!isValid) {
    logger.warn('Invalid webhook signature', { requestId: req.requestId });
    return res.status(401).json(errorResponse('Invalid webhook signature', null, 401));
  }

  next();
};

/**
 * Rate limiter — simple in-memory token bucket per IP.
 * For production, replace with Redis-backed rate limiting.
 */
const buckets = new Map();
const rateLimiter = (maxRequests = 100, windowMs = 60000) => (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(ip, bucket);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > maxRequests) {
    logger.warn('Rate limit exceeded', { ip, requestId: req.requestId });
    return res.status(429).json(errorResponse('Too many requests', null, 429));
  }

  next();
};

module.exports = { apiKeyAuth, webhookSignatureVerifier, rateLimiter };
