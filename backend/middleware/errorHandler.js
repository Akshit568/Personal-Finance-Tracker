'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Centralized error handler. Translates thrown errors — including known
 * PostgreSQL error codes — into a consistent JSON envelope.
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  // Map common PostgreSQL error codes to friendly HTTP responses.
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'A record with these values already exists';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Referenced record does not exist';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = `Missing required field: ${err.column || 'unknown'}`;
        break;
      case '22P02': // invalid_text_representation
        statusCode = 400;
        message = 'Invalid input syntax for one of the provided values';
        break;
      case '23514': // check_violation
        statusCode = 400;
        message = 'A value violates a database constraint';
        break;
      default:
        break;
    }
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err.stack || err.message);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  // Expose stack traces only in development to aid debugging.
  if (config.env === 'development' && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
