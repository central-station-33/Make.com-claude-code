const { Pool } = require('pg');
const config = require('./env');
const logger = require('./logger');

let pool = null;

const getPool = () => {
  if (pool) return pool;

  const poolConfig = config.db.url
    ? {
        connectionString: config.db.url,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      };

  pool = new Pool({
    ...poolConfig,
    max: config.db.poolMax,
    idleTimeoutMillis: config.db.idleTimeout,
    connectionTimeoutMillis: config.db.connectTimeout,
  });

  pool.on('connect', () => logger.debug('Database pool: new connection'));
  pool.on('error', (err) => logger.error('Database pool error', { error: err.message }));

  return pool;
};

/**
 * Execute a query with optional retry logic.
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('Query failed', { error: err.message, query: text });
    throw err;
  }
};

/**
 * Check database connectivity.
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
  try {
    await getPool().query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

/**
 * Gracefully close all connections.
 */
const close = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
};

module.exports = { query, checkHealth, close, getPool };
