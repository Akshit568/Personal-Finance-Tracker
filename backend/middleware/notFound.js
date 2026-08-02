'use strict';

const ApiError = require('../utils/ApiError');

/** Catch-all for unmatched routes -> 404. */
module.exports = function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
