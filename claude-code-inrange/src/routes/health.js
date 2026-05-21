'use strict';

const { Router } = require('express');
const { healthCheck, ping } = require('../controllers/healthController');

const router = Router();

/**
 * @route  GET /api/health
 * @desc   Full system health check (DB + Claude API + memory)
 */
router.get('/', healthCheck);

/**
 * @route  GET /api/health/ping
 * @desc   Lightweight liveness probe
 */
router.get('/ping', ping);

module.exports = router;
