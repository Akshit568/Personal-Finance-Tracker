'use strict';

require('dotenv').config();

/**
 * Centralized, validated configuration loaded from environment variables.
 * Falls back to sensible development defaults so the app never crashes on a
 * missing optional variable.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  cors: {
    // "*" or a comma-separated allow-list
    origin: process.env.CORS_ORIGIN || '*',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance_tracker',
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: {
      analytics: parseInt(process.env.CACHE_TTL_ANALYTICS, 10) || 900, // 15 min
      categories: parseInt(process.env.CACHE_TTL_CATEGORIES, 10) || 3600, // 1 hour
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};

module.exports = config;
