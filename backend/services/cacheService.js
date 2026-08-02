'use strict';

const redis = require('../config/redis');
const config = require('../config');

/**
 * Thin caching layer with a stable key scheme and targeted invalidation.
 * Every method is safe to call even when Redis is down (see config/redis.js).
 *
 * Key scheme:
 *   categories:list                 -> full category list (TTL 1h)
 *   analytics:<userId>:<name>:<sig> -> a computed analytics payload (TTL 15m)
 */
const KEYS = {
  categoryList: 'categories:list',
  categoryPattern: 'categories:*',
  analytics: (userId, name, signature) => `analytics:${userId}:${name}:${signature}`,
  analyticsUserPattern: (userId) => `analytics:${userId}:*`,
};

/* ----------------------------- Categories -------------------------------- */
async function getCategoryList() {
  return redis.get(KEYS.categoryList);
}
async function setCategoryList(data) {
  return redis.set(KEYS.categoryList, data, config.redis.ttl.categories);
}
async function invalidateCategories() {
  return redis.delByPattern(KEYS.categoryPattern);
}

/* ------------------------------ Analytics -------------------------------- */
async function getAnalytics(userId, name, signature) {
  return redis.get(KEYS.analytics(userId, name, signature));
}
async function setAnalytics(userId, name, signature, data) {
  return redis.set(KEYS.analytics(userId, name, signature), data, config.redis.ttl.analytics);
}
async function invalidateAnalytics(userId) {
  return redis.delByPattern(KEYS.analyticsUserPattern(userId));
}

module.exports = {
  KEYS,
  getCategoryList,
  setCategoryList,
  invalidateCategories,
  getAnalytics,
  setAnalytics,
  invalidateAnalytics,
};
