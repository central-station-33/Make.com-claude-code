require('dotenv').config();

const required = (name) => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
};

const optional = (name, defaultValue = undefined) => process.env[name] || defaultValue;

const config = {
  server: {
    port: parseInt(optional('PORT', '3000'), 10),
    env: optional('NODE_ENV', 'development'),
    isProd: optional('NODE_ENV') === 'production',
  },
  db: {
    url: optional('DATABASE_URL'),
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'inrange'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    ssl: optional('DB_SSL', 'false') === 'true',
    poolMax: parseInt(optional('DB_POOL_MAX', '10'), 10),
    idleTimeout: parseInt(optional('DB_POOL_IDLE_TIMEOUT', '30000'), 10),
    connectTimeout: parseInt(optional('DB_POOL_CONNECT_TIMEOUT', '2000'), 10),
  },
  anthropic: {
    apiKey: optional('ANTHROPIC_API_KEY', ''),
    model: optional('CLAUDE_MODEL', 'claude-sonnet-4-6'),
    maxTokens: parseInt(optional('CLAUDE_MAX_TOKENS', '4096'), 10),
  },
  security: {
    webhookSecret: optional('WEBHOOK_SECRET', ''),
    apiKey: optional('API_KEY', ''),
  },
  retool: {
    domain: optional('RETOOL_DOMAIN', ''),
  },
  geocoding: {
    googleApiKey: optional('GOOGLE_MAPS_API_KEY', ''),
  },
  logging: {
    level: optional('LOG_LEVEL', 'info'),
  },
};

module.exports = config;
