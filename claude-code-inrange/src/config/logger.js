const config = require('./env');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[config.logging.level] ?? LEVELS.info;

const timestamp = () => new Date().toISOString();

const format = (level, message, meta = {}) => {
  const entry = { timestamp: timestamp(), level, message, ...meta };
  return JSON.stringify(entry);
};

const logger = {
  debug: (message, meta) => {
    if (currentLevel <= LEVELS.debug) console.debug(format('debug', message, meta));
  },
  info: (message, meta) => {
    if (currentLevel <= LEVELS.info) console.info(format('info', message, meta));
  },
  warn: (message, meta) => {
    if (currentLevel <= LEVELS.warn) console.warn(format('warn', message, meta));
  },
  error: (message, meta) => {
    if (currentLevel <= LEVELS.error) console.error(format('error', message, meta));
  },
};

module.exports = logger;
