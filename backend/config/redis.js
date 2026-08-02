'use strict';

const { createClient } = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Redis wrapper designed to DEGRADE GRACEFULLY.
 *
 * If Redis is unreachable at boot or drops mid-flight, `isReady` becomes false
 * and every cache helper becomes a no-op that returns null, so callers simply
 * fall back to PostgreSQL instead of crashing.
 */
let client = null;
let isReady = false;

function buildUrl() {
  const auth = config.redis.password ? `:${encodeURIComponent(config.redis.password)}@` : '';
  return `redis://${auth}${config.redis.host}:${config.redis.port}`;
}

async function connect() {
  client = createClient({
    url: buildUrl(),
    socket: {
      // Give up reconnecting after a few tries instead of looping forever.
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          logger.warn('Redis: giving up reconnect attempts; running without cache.');
          return false;
        }
        return Math.min(retries * 200, 2000);
      },
    },
  });

  client.on('error', (err) => {
    if (isReady) logger.warn('Redis error:', err.message);
    isReady = false;
  });
  client.on('ready', () => {
    isReady = true;
    logger.info(`Redis connected: ${config.redis.host}:${config.redis.port}`);
  });
  client.on('end', () => {
    isReady = false;
  });

  try {
    await client.connect();
  } catch (err) {
    isReady = false;
    logger.warn(`Redis unavailable (${err.message}); continuing without cache.`);
  }
}

function ready() {
  return isReady && client;
}

/** Get and JSON-parse a cached value, or null on miss / when Redis is down. */
async function get(key) {
  if (!ready()) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn(`Redis GET failed (${key}): ${err.message}`);
    return null;
  }
}

/** JSON-stringify and cache a value with a TTL (seconds). No-op when down. */
async function set(key, value, ttlSeconds) {
  if (!ready()) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    logger.warn(`Redis SET failed (${key}): ${err.message}`);
  }
}

/** Delete one or more explicit keys. No-op when down. */
async function del(keys) {
  if (!ready()) return;
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return;
  try {
    await client.del(list);
  } catch (err) {
    logger.warn(`Redis DEL failed: ${err.message}`);
  }
}

/** Delete every key matching a glob pattern (used for cache invalidation). */
async function delByPattern(pattern) {
  if (!ready()) return;
  try {
    const found = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      found.push(key);
    }
    if (found.length) await client.del(found);
  } catch (err) {
    logger.warn(`Redis pattern delete failed (${pattern}): ${err.message}`);
  }
}

async function disconnect() {
  if (client && client.isOpen) {
    await client.quit();
    logger.info('Redis connection closed');
  }
}

module.exports = { connect, disconnect, ready, get, set, del, delByPattern };
