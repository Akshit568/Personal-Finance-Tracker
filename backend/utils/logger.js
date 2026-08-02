'use strict';

/**
 * Minimal dependency-free logger with levels and timestamps.
 * Keeps output readable in development and structured enough for production.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.NODE_ENV === 'production' ? levels.info : levels.debug;

function format(level, args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, ...args];
}

const logger = {
  error: (...args) => currentLevel >= levels.error && console.error(...format('error', args)),
  warn: (...args) => currentLevel >= levels.warn && console.warn(...format('warn', args)),
  info: (...args) => currentLevel >= levels.info && console.log(...format('info', args)),
  debug: (...args) => currentLevel >= levels.debug && console.log(...format('debug', args)),
};

module.exports = logger;
