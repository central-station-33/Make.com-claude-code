'use strict';

const {
  findPropertyById,
  findProperties,
  getPropertyStats,
  logContactActivity,
  logDealStatus,
} = require('../database/queries');
const { scoreProperty } = require('../services/scoringService');
const { normalizeProperty } = require('../services/normalizationService');
const { enqueue } = require('../services/enrichmentQueueService');
const {
  validate,
  propertyFilterSchema,
  contactActivitySchema,
  dealSchema,
} = require('../validators/propertyValidator');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');
const logger = require('../config/logger');

// ---------------------------------------------------------------------------
// GET /api/properties
// ---------------------------------------------------------------------------
const getProperties = async (req, res, next) => {
  try {
    const filters = validate(req.query, propertyFilterSchema);
    const { page, limit, ...rest } = filters;

    const { rows, total } = await findProperties(rest, page, limit);

    res.status(200).json(paginatedResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/properties/:id
// ---------------------------------------------------------------------------
const getPropertyById = async (req, res, next) => {
  try {
    const property = await findPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json(errorResponse('Property not found', null, 404));
    }
    res.status(200).json(successResponse(property));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/stats
// ---------------------------------------------------------------------------
const getStats = async (req, res, next) => {
  try {
    const stats = await getPropertyStats();
    res.status(200).json(successResponse(stats));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/search
// ---------------------------------------------------------------------------
const searchProperties = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json(errorResponse('Search query must be at least 2 characters', null, 400));
    }

    const { rows, total } = await findProperties({ search: q.trim() }, parseInt(page, 10), parseInt(limit, 10));
    res.status(200).json(paginatedResponse(rows, total, parseInt(page, 10), parseInt(limit, 10)));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/contact-activity
// ---------------------------------------------------------------------------
const logContact = async (req, res, next) => {
  try {
    const validated = validate(req.body, contactActivitySchema);
    const row = await logContactActivity(validated);
    logger.info('Contact activity logged', { requestId: req.requestId, propertyId: validated.property_id });
    res.status(201).json(successResponse(row, 'Contact activity logged'));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/deals
// ---------------------------------------------------------------------------
const createDeal = async (req, res, next) => {
  try {
    const validated = validate(req.body, dealSchema);
    const row = await logDealStatus(validated);
    logger.info('Deal logged', { requestId: req.requestId, propertyId: validated.property_id });
    res.status(201).json(successResponse(row, 'Deal status logged'));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/enrich  (on-demand enrichment from Retool)
// ---------------------------------------------------------------------------
const triggerEnrichment = async (req, res, next) => {
  try {
    const { property_id } = req.body;
    if (!property_id) {
      return res.status(400).json(errorResponse('property_id is required', null, 400));
    }

    const property = await findPropertyById(property_id);
    if (!property) {
      return res.status(404).json(errorResponse('Property not found', null, 404));
    }

    enqueue(property);
    res.status(202).json(successResponse({ property_id, queued: true }, 'Property queued for enrichment'));
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/score  (on-demand scoring)
// ---------------------------------------------------------------------------
const scoreOnDemand = async (req, res, next) => {
  try {
    const normalized = normalizeProperty(req.body);
    const scores = scoreProperty(normalized);
    res.status(200).json(successResponse({ ...normalized, ...scores }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getStats,
  searchProperties,
  logContact,
  createDeal,
  triggerEnrichment,
  scoreOnDemand,
};
