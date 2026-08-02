'use strict';

/**
 * Uniform success envelope so every endpoint returns the same shape:
 *   { success: true, message, data, meta? }
 */
function success(res, { statusCode = 200, message = 'OK', data = null, meta = undefined }) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { success };
