'use strict';

const { query } = require('../config/database');
const { checkHealth: dbHealth } = require('../config/database');
const { checkHealth: claudeHealth } = require('../config/anthropic');
const { daysSince } = require('../utils/dateHelpers');
const logger = require('../config/logger');

/**
 * Detect properties with invalid scores (outside 0–100).
 * @returns {Promise<Array>} Issues found
 */
const detectInvalidScores = async () => {
  const issues = [];
  try {
    const result = await query(
      `SELECT id, address, city, state, composite_score, distress_score, deal_quality_score
       FROM properties
       WHERE composite_score < 0 OR composite_score > 100
          OR distress_score < 0 OR distress_score > 100
          OR deal_quality_score < 0 OR deal_quality_score > 100
       LIMIT 100`
    );
    if (result.rows.length > 0) {
      issues.push({
        type: 'invalid_scores',
        severity: 'high',
        count: result.rows.length,
        message: `${result.rows.length} properties have out-of-range scores`,
        affected: result.rows.map((r) => r.id),
      });
    }
  } catch (err) {
    issues.push({ type: 'db_query_error', severity: 'critical', message: err.message });
  }
  return issues;
};

/**
 * Detect Tier 1 properties with no contact information.
 * @returns {Promise<Array>}
 */
const detectMissingContactInfo = async () => {
  const issues = [];
  try {
    const result = await query(
      `SELECT id, address, city, state
       FROM properties
       WHERE priority_tier = 'Tier 1'
         AND (owner_phone IS NULL OR owner_phone = '')
         AND (owner_email IS NULL OR owner_email = '')
         AND (owner_mailing_address IS NULL OR owner_mailing_address = '')
       LIMIT 100`
    );
    if (result.rows.length > 0) {
      issues.push({
        type: 'missing_contact_info',
        severity: 'medium',
        count: result.rows.length,
        message: `${result.rows.length} Tier 1 properties have no contact information`,
        affected: result.rows.map((r) => r.id),
      });
    }
  } catch (err) {
    issues.push({ type: 'db_query_error', severity: 'critical', message: err.message });
  }
  return issues;
};

/**
 * Detect stale data — properties not updated in 24+ hours.
 * @returns {Promise<Array>}
 */
const detectDataStaleness = async () => {
  const issues = [];
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM properties
       WHERE updated_at < NOW() - INTERVAL '24 hours'`
    );
    const staleCount = parseInt(result.rows[0]?.count || 0, 10);
    if (staleCount > 0) {
      issues.push({
        type: 'stale_data',
        severity: 'medium',
        count: staleCount,
        message: `${staleCount} properties have not been updated in 24+ hours`,
      });
    }
  } catch (err) {
    issues.push({ type: 'db_query_error', severity: 'critical', message: err.message });
  }
  return issues;
};

/**
 * Detect database connectivity and performance issues.
 * @returns {Promise<Array>}
 */
const detectDatabaseIssues = async () => {
  const issues = [];
  const healthy = await dbHealth();
  if (!healthy) {
    issues.push({
      type: 'database_down',
      severity: 'critical',
      message: 'Database is unreachable',
    });
  }
  return issues;
};

/**
 * Detect Claude API availability issues.
 * @returns {Promise<Array>}
 */
const detectAPIFailures = async () => {
  const issues = [];
  const healthy = await claudeHealth();
  if (!healthy) {
    issues.push({
      type: 'claude_api_unavailable',
      severity: 'high',
      message: 'Claude API is unavailable — AI enrichment will be degraded',
    });
  }
  return issues;
};

/**
 * Detect likely duplicate properties in the database.
 * @returns {Promise<Array>}
 */
const detectDuplicateProperties = async () => {
  const issues = [];
  try {
    const result = await query(
      `SELECT property_hash, COUNT(*) as count
       FROM properties
       GROUP BY property_hash
       HAVING COUNT(*) > 1
       LIMIT 50`
    );
    if (result.rows.length > 0) {
      const totalDups = result.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
      issues.push({
        type: 'duplicate_properties',
        severity: 'low',
        count: result.rows.length,
        message: `${result.rows.length} duplicate hash groups found (${totalDups} total records)`,
      });
    }
  } catch (err) {
    issues.push({ type: 'db_query_error', severity: 'medium', message: err.message });
  }
  return issues;
};

/**
 * Detect Tier 1 properties awaiting AI enrichment.
 * @returns {Promise<Array>}
 */
const detectUnenrichedTier1 = async () => {
  const issues = [];
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM properties
       WHERE priority_tier = 'Tier 1'
         AND (ai_analysis IS NULL OR ai_enriched_at IS NULL)`
    );
    const count = parseInt(result.rows[0]?.count || 0, 10);
    if (count > 0) {
      issues.push({
        type: 'unenriched_tier1',
        severity: 'medium',
        count,
        message: `${count} Tier 1 properties have not been AI-enriched yet`,
      });
    }
  } catch (err) {
    issues.push({ type: 'db_query_error', severity: 'medium', message: err.message });
  }
  return issues;
};

/**
 * Run all issue detection checks and return a consolidated health report.
 * @returns {Promise<object>}
 */
const generateHealthReport = async () => {
  const startedAt = new Date().toISOString();

  const [
    invalidScores,
    missingContact,
    staleness,
    dbIssues,
    apiIssues,
    duplicates,
    unenriched,
  ] = await Promise.allSettled([
    detectInvalidScores(),
    detectMissingContactInfo(),
    detectDataStaleness(),
    detectDatabaseIssues(),
    detectAPIFailures(),
    detectDuplicateProperties(),
    detectUnenrichedTier1(),
  ]);

  const allIssues = [
    ...(invalidScores.value || []),
    ...(missingContact.value || []),
    ...(staleness.value || []),
    ...(dbIssues.value || []),
    ...(apiIssues.value || []),
    ...(duplicates.value || []),
    ...(unenriched.value || []),
  ];

  const bySeverity = {
    critical: allIssues.filter((i) => i.severity === 'critical'),
    high: allIssues.filter((i) => i.severity === 'high'),
    medium: allIssues.filter((i) => i.severity === 'medium'),
    low: allIssues.filter((i) => i.severity === 'low'),
  };

  const overallStatus =
    bySeverity.critical.length > 0
      ? 'critical'
      : bySeverity.high.length > 0
      ? 'degraded'
      : bySeverity.medium.length > 0
      ? 'warning'
      : 'healthy';

  logger.info('Health report generated', {
    status: overallStatus,
    totalIssues: allIssues.length,
  });

  return {
    status: overallStatus,
    generated_at: startedAt,
    total_issues: allIssues.length,
    issues_by_severity: {
      critical: bySeverity.critical.length,
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
      low: bySeverity.low.length,
    },
    issues: allIssues,
  };
};

module.exports = {
  detectInvalidScores,
  detectMissingContactInfo,
  detectDataStaleness,
  detectDatabaseIssues,
  detectAPIFailures,
  detectDuplicateProperties,
  detectUnenrichedTier1,
  generateHealthReport,
};
