'use strict';

const { enrichProperty } = require('./claudeEnrichmentService');
const { updatePropertyAnalysis } = require('../database/queries');
const { chunk } = require('../utils/arrayHelpers');
const logger = require('../config/logger');

// In-memory queue (replace with Redis/Bull for production scale)
const queue = [];
let processing = false;

/**
 * Add a property to the enrichment queue.
 * @param {object} property - Scored, normalized property
 */
const enqueue = (property) => {
  queue.push({ property, addedAt: new Date().toISOString(), attempts: 0 });
  logger.info('Property queued for enrichment', { address: property.full || property.address, queueSize: queue.length });
  if (!processing) processQueue();
};

/**
 * Add multiple Tier 1 properties to the enrichment queue.
 * @param {Array} properties
 */
const enqueueTier1 = (properties) => {
  const tier1 = properties.filter((p) => p.priority_tier === 'Tier 1');
  logger.info(`Queuing ${tier1.length} Tier 1 properties for enrichment`);
  tier1.forEach(enqueue);
};

/**
 * Process the enrichment queue in batches of 5, with rate-limit spacing.
 */
const processQueue = async () => {
  if (processing || queue.length === 0) return;
  processing = true;

  logger.info(`Starting enrichment queue processing`, { queueSize: queue.length });

  try {
    while (queue.length > 0) {
      const batch = queue.splice(0, 5);
      await Promise.allSettled(batch.map(processItem));
      // Respect Claude API rate limits
      if (queue.length > 0) await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    processing = false;
    logger.info('Enrichment queue processing complete');
  }
};

const processItem = async ({ property, attempts }) => {
  try {
    const analysis = await enrichProperty(property);
    if (property.id) {
      await updatePropertyAnalysis(property.id, analysis);
    }
    logger.info('Enrichment complete', { id: property.id, address: property.full || property.address });
    return analysis;
  } catch (err) {
    logger.error('Enrichment item failed', { error: err.message, address: property.full });
    // Re-queue with backoff if under max attempts
    if (attempts < 2) {
      setTimeout(() => enqueue({ ...property, attempts: attempts + 1 }), (attempts + 1) * 5000);
    }
  }
};

/**
 * Get queue status.
 * @returns {{ size: number, processing: boolean }}
 */
const getStatus = () => ({ size: queue.length, processing });

module.exports = { enqueue, enqueueTier1, processQueue, getStatus };
