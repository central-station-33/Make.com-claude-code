'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');

const config = require('./config/env');
const logger = require('./config/logger');
const { close: closeDb } = require('./config/database');

const requestLogger = require('./middleware/requestLogger');
const { validationErrorHandler, globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/auth');

const healthRoutes = require('./routes/health');
const webhookRoutes = require('./routes/webhooks');
const propertyRoutes = require('./routes/properties');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

// Trust proxy headers (Render.com, load balancers)
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: (origin, cb) => {
    // Allow Retool domain, no-origin (server-to-server), and localhost in dev
    const allowed = [
      config.retool.domain,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);

    if (!origin || allowed.includes(origin) || !config.server.isProd) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Request-Id', 'X-Make-Signature'],
  credentials: true,
}));

app.use(compression());

// Parse JSON bodies — 5 MB limit to handle bulk webhook payloads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiter: 200 req/min
app.use(rateLimiter(200, 60000));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/properties', propertyRoutes);

// Convenience aliases expected by Retool
app.use('/api/stats',            propertyRoutes);
app.use('/api/search',           propertyRoutes);
app.use('/api/contact-activity', propertyRoutes);
app.use('/api/deals',            propertyRoutes);
app.use('/api/enrich',           propertyRoutes);
app.use('/api/score',            propertyRoutes);

// Root info
app.get('/', (_req, res) =>
  res.json({ service: 'InRange Backend', version: '1.0.0', status: 'running' })
);

// ---------------------------------------------------------------------------
// Error handling (must be last)
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(validationErrorHandler);
app.use(globalErrorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.info(`InRange backend running`, {
    port: PORT,
    env: config.server.env,
    pid: process.pid,
  });
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await closeDb();
    logger.info('Server closed');
    process.exit(0);
  });

  // Force exit after 15 s
  setTimeout(() => {
    logger.error('Forced exit after timeout');
    process.exit(1);
  }, 15000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

module.exports = app; // for testing
