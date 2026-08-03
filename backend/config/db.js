// 'use strict';

// const { Pool } = require('pg');
// const config = require('./index');
// const logger = require('../utils/logger');

// /**
//  * A single shared PostgreSQL connection pool for the whole application.
//  * All database access goes through query() / getClient() so that every
//  * statement is parameterized and pooled correctly.
//  */
// const pool = new Pool({
//   host: config.db.host,
//   port: config.db.port,
//   user: config.db.user,
//   password: config.db.password,
//   database: config.db.database,
//   max: config.db.max,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 5000,
// });

// pool.on('error', (err) => {
//   // Prevent an idle-client error from crashing the whole process.
//   logger.error('Unexpected PostgreSQL pool error:', err.message);
// });

// /**
//  * Execute a parameterized query.
//  * @param {string} text  SQL text with $1, $2 ... placeholders
//  * @param {Array}  params Values for the placeholders
//  * @returns {Promise<import('pg').QueryResult>}
//  */
// async function query(text, params) {
//   const start = Date.now();
//   const res = await pool.query(text, params);
//   const duration = Date.now() - start;
//   logger.debug(`SQL (${duration}ms, ${res.rowCount} rows): ${text.replace(/\s+/g, ' ').trim()}`);
//   return res;
// }

// /**
//  * Get a dedicated client for transactions (BEGIN/COMMIT/ROLLBACK).
//  * Caller MUST release the client.
//  */
// async function getClient() {
//   const client = await pool.connect();
//   return client;
// }

// /**
//  * Verify connectivity at boot. Throws if the database is unreachable.
//  */
// async function connect() {
//   const client = await pool.connect();
//   try {
//     await client.query('SELECT 1');
//     logger.info(`PostgreSQL connected: ${config.db.host}:${config.db.port}/${config.db.database}`);
//   } finally {
//     client.release();
//   }
// }

// async function disconnect() {
//   await pool.end();
//   logger.info('PostgreSQL pool closed');
// }

// module.exports = { pool, query, getClient, connect, disconnect };
'use strict';

const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL in production (Neon/Vercel)
 * and local DB credentials in development.
 */
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        max: config.db.max,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        max: config.db.max,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Execute a parameterized query.
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug(
    `SQL (${duration}ms, ${res.rowCount} rows): ${text.replace(/\s+/g, ' ').trim()}`
  );
  return res;
}

/**
 * Get a dedicated client for transactions.
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Verify connectivity at boot.
 */
async function connect() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');

    if (process.env.DATABASE_URL) {
      logger.info('PostgreSQL connected (Neon)');
    } else {
      logger.info(
        `PostgreSQL connected: ${config.db.host}:${config.db.port}/${config.db.database}`
      );
    }
  } finally {
    client.release();
  }
}

async function disconnect() {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

module.exports = {
  pool,
  query,
  getClient,
  connect,
  disconnect,
};