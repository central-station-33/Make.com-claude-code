const Anthropic = require('@anthropic-ai/sdk');
const config = require('./env');
const logger = require('./logger');

let client = null;

/**
 * Get or create the Anthropic client singleton.
 * @returns {Anthropic}
 */
const getClient = () => {
  if (client) return client;

  if (!config.anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not configured — AI enrichment will be unavailable');
    return null;
  }

  client = new Anthropic({ apiKey: config.anthropic.apiKey });
  logger.info('Anthropic client initialized', { model: config.anthropic.model });
  return client;
};

/**
 * Check Claude API availability.
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
  const c = getClient();
  if (!c) return false;
  try {
    await c.messages.create({
      model: config.anthropic.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return true;
  } catch {
    return false;
  }
};

module.exports = { getClient, checkHealth };
