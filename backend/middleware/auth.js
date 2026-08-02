'use strict';

const jwtUtil = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

/**
 * Authentication middleware.
 * Expects an `Authorization: Bearer <token>` header, verifies the JWT, and
 * re-loads the user from the database so that deleted users or changed roles
 * take effect immediately. The user is attached to `req.user`.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required: missing Bearer token');
  }

  const token = header.slice(7).trim();
  if (!token) throw ApiError.unauthorized('Authentication required: empty token');

  let decoded;
  try {
    decoded = jwtUtil.verify(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired, please log in again');
    }
    throw ApiError.unauthorized('Invalid authentication token');
  }

  const user = await userService.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user; // { id, name, email, role, created_at }
  next();
});

module.exports = { authenticate };
