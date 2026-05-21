'use strict';

const { checkHealth: dbHealth } = require('../config/database');
const { checkHealth: claudeHealth } = require('../config/anthropic');
const { getUsageStats } = require('../services/claudeEnrichmentService');
const { getStatus: queueStatus } = require('../services/enrichmentQueueService');
const { successResponse } = require('../utils/responseFormatter');
const os = require('os');

/**
 * GET /api/health
 * Full system health check.
 */
const healthCheck = async (req, res) => {
  const [dbOk, claudeOk] = await Promise.all([dbHealth(), claudeHealth()]);

  const memUsed = process.memoryUsage();
  const uptime = process.uptime();
  const freeMemMb = Math.round(os.freemem() / 1024 / 1024);
  const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);

  const services = {
    database: dbOk ? 'healthy' : 'unavailable',
    claude_api: claudeOk ? 'healthy' : 'unavailable',
  };

  const allOk = Object.values(services).every((s) => s === 'healthy');
  const status = allOk ? 'healthy' : 'degraded';

  const body = {
    status,
    version: process.env.npm_package_version || '1.0.0',
    uptime_seconds: Math.round(uptime),
    services,
    enrichment_queue: queueStatus(),
    claude_usage: getUsageStats(),
    memory: {
      heap_used_mb: Math.round(memUsed.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsed.heapTotal / 1024 / 1024),
      rss_mb: Math.round(memUsed.rss / 1024 / 1024),
      system_free_mb: freeMemMb,
      system_total_mb: totalMemMb,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(allOk ? 200 : 503).json(successResponse(body, `System ${status}`));
};

/**
 * GET /api/health/ping
 * Lightweight liveness probe — no external checks.
 */
const ping = (_req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
};

module.exports = { healthCheck, ping };
