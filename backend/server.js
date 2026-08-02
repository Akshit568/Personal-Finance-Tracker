'use strict';

const app = require('./app');
const config = require('./config');
const db = require('./config/db');
const redis = require('./config/redis');
const logger = require('./utils/logger');

let server;

async function start() {
  // PostgreSQL is required — fail fast with a helpful message if it is down.
  try {
    await db.connect();
  } catch (err) {
    logger.error('Could not connect to PostgreSQL. Is it running and configured in .env?');
    logger.error(err.message);
    process.exit(1);
  }

  // Redis is optional — the app degrades gracefully if it is unavailable.
  await redis.connect();

  server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on http://localhost:${config.port}`);
    logger.info(`Swagger docs available at http://localhost:${config.port}/api/docs`);
  });
}

/* -------------------------------------------------------------------------- */
/* Graceful shutdown                                                          */
/* -------------------------------------------------------------------------- */
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await db.disconnect().catch(() => {});
      await redis.disconnect().catch(() => {});
      process.exit(0);
    });
    // Force-exit if connections do not close in time.
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

start();
