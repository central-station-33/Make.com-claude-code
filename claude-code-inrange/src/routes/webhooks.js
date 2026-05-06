'use strict';

const { Router } = require('express');
const {
  ingestRawProperties,
  receiveScoredProperties,
  notificationStatus,
  detectIssues,
  aiEnrichmentTrigger,
  burntOutLandlordScan,
} = require('../controllers/webhookController');
const { webhookSignatureVerifier } = require('../middleware/auth');

const router = Router();

// Optionally verify HMAC signature on all webhook routes
router.use(webhookSignatureVerifier);

/**
 * @route  POST /api/webhooks/ingest-raw-properties
 * @desc   Receive raw property data from Make.com Workflow 1
 */
router.post('/ingest-raw-properties', ingestRawProperties);

/**
 * @route  POST /api/webhooks/receive-scored-properties
 * @desc   Receive scored properties from Make.com Workflow 2
 */
router.post('/receive-scored-properties', receiveScoredProperties);

/**
 * @route  POST /api/webhooks/notification-status
 * @desc   Receive notification delivery callbacks from Make.com Workflow 3
 */
router.post('/notification-status', notificationStatus);

/**
 * @route  POST /api/webhooks/detect-issues
 * @desc   Trigger issue detection & return health report
 */
router.post('/detect-issues', detectIssues);

/**
 * @route  POST /api/webhooks/ai-enrichment-trigger
 * @desc   Trigger AI enrichment for specific properties or a tier
 */
router.post('/ai-enrichment-trigger', aiEnrichmentTrigger);

/**
 * @route  POST /api/webhooks/burnt-out-landlord-scan
 * @desc   Run burnt out landlord detection for NY/NJ properties
 *         Uses NYC Open Data, NJ MOD-IV, FEMA flood data — all free
 */
router.post('/burnt-out-landlord-scan', burntOutLandlordScan);

module.exports = router;
