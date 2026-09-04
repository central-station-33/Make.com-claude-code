'use strict';

const { Router } = require('express');
const {
  getProperties,
  getPropertyById,
  getStats,
  searchProperties,
  logContact,
  createDeal,
  triggerEnrichment,
  scoreOnDemand,
} = require('../controllers/propertyController');
const { apiKeyAuth } = require('../middleware/auth');

const router = Router();

// All property API routes require API key authentication
router.use(apiKeyAuth);

/**
 * @route  GET /api/properties
 * @desc   Fetch properties with optional filters and pagination
 * @query  state, county, priority_tier, deal_type, min_score, max_score, search, page, limit
 */
router.get('/', getProperties);

/**
 * @route  GET /api/search
 * @desc   Full-text search properties
 */
router.get('/search', searchProperties);

/**
 * @route  GET /api/stats
 * @desc   Dashboard aggregate statistics
 */
router.get('/stats', getStats);

/**
 * @route  GET /api/properties/:id
 * @desc   Fetch single property by UUID
 */
router.get('/:id', getPropertyById);

/**
 * @route  POST /api/contact-activity
 * @desc   Log a contact attempt (called from Retool)
 */
router.post('/contact-activity', logContact);

/**
 * @route  POST /api/deals
 * @desc   Log or update a deal status (called from Retool)
 */
router.post('/deals', createDeal);

/**
 * @route  POST /api/enrich
 * @desc   Trigger on-demand AI enrichment for a property
 */
router.post('/enrich', triggerEnrichment);

/**
 * @route  POST /api/score
 * @desc   Score a property payload on-demand (no DB write)
 */
router.post('/score', scoreOnDemand);

module.exports = router;
