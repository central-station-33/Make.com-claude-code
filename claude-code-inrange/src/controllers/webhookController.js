'use strict';

const { normalizeProperty } = require('../services/normalizationService');
const { scoreProperty } = require('../services/scoringService');
const { checkDuplicate } = require('../services/deduplicationService');
const { enqueueTier1 } = require('../services/enrichmentQueueService');
const { insertRawProperty, upsertScoredProperty } = require('../database/queries');
const {
  validate,
  rawPropertySchema,
  scoredPropertySchema,
  notificationStatusSchema,
} = require('../validators/propertyValidator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logNotificationStatus } = require('../database/queries');
const logger = require('../config/logger');

// ---------------------------------------------------------------------------
// POST /api/webhooks/ingest-raw-properties
// ---------------------------------------------------------------------------
const ingestRawProperties = async (req, res, next) => {
  try {
    const payload = req.body;

    // Handle both single object and array
    const rawItems = Array.isArray(payload) ? payload : [payload];
    const results = { inserted: 0, duplicates: 0, errors: [] };

    for (const item of rawItems) {
      try {
        const validated = validate(item, rawPropertySchema);
        const normalized = normalizeProperty(validated);
        const { isDuplicate, hash } = await checkDuplicate(normalized);
        normalized.property_hash = hash;

        if (!isDuplicate) {
          await insertRawProperty(normalized);
          results.inserted++;
        } else {
          results.duplicates++;
        }
      } catch (err) {
        results.errors.push({ item: item?.address || 'unknown', error: err.message });
      }
    }

    logger.info('Raw property ingestion complete', {
      requestId: req.requestId,
      total: rawItems.length,
      ...results,
    });

    res.status(200).json(
      successResponse(results, `Ingested ${results.inserted} properties (${results.duplicates} duplicates, ${results.errors.length} errors)`)
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/receive-scored-properties
// ---------------------------------------------------------------------------
const receiveScoredProperties = async (req, res, next) => {
  try {
    const payload = req.body;
    const rawItems = Array.isArray(payload) ? payload : [payload];
    const results = { upserted: 0, tier1Queued: 0, errors: [] };
    const tier1Properties = [];

    for (const item of rawItems) {
      try {
        const validated = validate(item, scoredPropertySchema);
        const normalized = normalizeProperty(validated);

        // Merge incoming scores (trust Make.com) or re-score
        const scores = {
          distress_score: validated.distress_score,
          deal_quality_score: validated.deal_quality_score,
          contact_likelihood_score: validated.contact_likelihood_score,
          timeline_urgency_score: validated.timeline_urgency_score,
          composite_score: validated.composite_score,
          priority_tier: validated.priority_tier,
          deal_type: validated.deal_type,
        };

        const property = { ...normalized, ...scores };
        const { hash } = await checkDuplicate(property);
        property.property_hash = hash;

        const row = await upsertScoredProperty(property);
        property.id = row?.id;
        results.upserted++;

        if (property.priority_tier === 'Tier 1') {
          tier1Properties.push(property);
          results.tier1Queued++;
        }
      } catch (err) {
        results.errors.push({ item: item?.address || 'unknown', error: err.message });
      }
    }

    // Trigger AI enrichment for Tier 1 in background
    if (tier1Properties.length > 0) {
      enqueueTier1(tier1Properties);
    }

    logger.info('Scored property ingestion complete', { requestId: req.requestId, ...results });

    res.status(200).json(
      successResponse(results, `Processed ${results.upserted} properties, ${results.tier1Queued} queued for enrichment`)
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/notification-status
// ---------------------------------------------------------------------------
const notificationStatus = async (req, res, next) => {
  try {
    const validated = validate(req.body, notificationStatusSchema);
    const row = await logNotificationStatus(validated);

    if (validated.status === 'failed' || validated.status === 'bounced') {
      logger.warn('Notification delivery failure', {
        requestId: req.requestId,
        type: validated.notification_type,
        recipient: validated.recipient,
        status: validated.status,
        error: validated.error_message,
      });
    }

    res.status(200).json(successResponse({ id: row?.id, status: validated.status }, 'Notification status logged'));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/detect-issues
// ---------------------------------------------------------------------------
const detectIssues = async (req, res, next) => {
  try {
    const { generateHealthReport } = require('../services/issueDetectionService');
    const report = await generateHealthReport();

    res.status(200).json(successResponse(report, `Health check: ${report.status}`));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/ai-enrichment-trigger
// ---------------------------------------------------------------------------
const aiEnrichmentTrigger = async (req, res, next) => {
  try {
    const { property_ids, tier } = req.body;
    const { findPropertyById, findProperties } = require('../database/queries');
    const { enqueue } = require('../services/enrichmentQueueService');

    let properties = [];

    if (property_ids && Array.isArray(property_ids)) {
      properties = (await Promise.all(property_ids.map(findPropertyById))).filter(Boolean);
    } else if (tier) {
      const result = await findProperties({ priority_tier: tier, enrichment_status: 'pending' }, 1, 200);
      properties = result.rows;
    }

    properties.forEach(enqueue);

    res.status(200).json(
      successResponse({ queued: properties.length }, `${properties.length} properties queued for AI enrichment`)
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/burnt-out-landlord-scan
// ---------------------------------------------------------------------------
const burntOutLandlordScan = async (req, res, next) => {
  try {
    const { enrichBurntOutLandlord } = require('../services/burntOutLandlordService');
    const { upsertScoredProperty, findPropertyById } = require('../database/queries');

    const payload = req.body;
    const items   = Array.isArray(payload) ? payload : [payload];
    const results = { processed: 0, burnt_out_found: 0, errors: [] };
    const burntOut = [];

    for (const item of items) {
      try {
        // Accept either a full property object or just a property_id
        let property = item;
        if (item.property_id && !item.address) {
          property = await findPropertyById(item.property_id);
          if (!property) throw new Error(`Property ${item.property_id} not found`);
        }

        const normalized = normalizeProperty(property);
        const enrichment = await enrichBurntOutLandlord(normalized);

        // Merge burnt out score into property scores
        if (property.id || property.property_id) {
          const id = property.id || property.property_id;
          await upsertScoredProperty({
            ...normalized,
            burnt_out_landlord_score: enrichment.burnt_out_landlord_score,
            burnt_out_signals: enrichment.burnt_out_signals,
            deal_type: enrichment.deal_type_override || normalized.deal_type,
            property_hash: normalized.property_hash || require('../utils/cryptoHelpers').generatePropertyHash(normalized),
          });
        }

        results.processed++;
        if (enrichment.is_burnt_out_landlord) {
          results.burnt_out_found++;
          burntOut.push({
            address: normalized.full || normalized.address,
            score: enrichment.burnt_out_landlord_score,
            signals: enrichment.burnt_out_signals,
          });
        }
      } catch (err) {
        results.errors.push({ item: item?.address || item?.property_id || 'unknown', error: err.message });
      }
    }

    logger.info('Burnt out landlord scan complete', { requestId: req.requestId, ...results });

    res.status(200).json(
      successResponse(
        { ...results, burnt_out_properties: burntOut },
        `Scanned ${results.processed} properties — ${results.burnt_out_found} burnt out landlords found`
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ingestRawProperties,
  receiveScoredProperties,
  notificationStatus,
  detectIssues,
  aiEnrichmentTrigger,
  burntOutLandlordScan,
};
