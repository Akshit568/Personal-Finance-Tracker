'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after a chain of express-validator rules. If any failed, it aggregates
 * them into a single 400 ApiError; otherwise it passes control on.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  return next(ApiError.badRequest('Validation failed', errors));
}

module.exports = validate;
