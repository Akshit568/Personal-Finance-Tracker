'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Role-based access control.
 *
 * Roles:
 *   - admin      : full access to everything
 *   - user       : CRUD on their OWN transactions; read categories/analytics
 *   - read-only   : read-only access (no create/update/delete anywhere)
 *
 * Ownership (a `user` may only touch their own rows) is enforced in the
 * transaction service via the authenticated user id. This middleware handles
 * the coarse-grained role gate.
 */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  READ_ONLY: 'read-only',
});

/**
 * Allow the request only if the authenticated user's role is in `allowedRoles`.
 * @param {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied: requires one of [${allowedRoles.join(', ')}], you are '${req.user.role}'`
        )
      );
    }
    next();
  };
}

/** Convenience gate: block read-only users from any write operation. */
function requireWriteAccess(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role === ROLES.READ_ONLY) {
    return next(ApiError.forbidden('Read-only accounts cannot modify data'));
  }
  next();
}

module.exports = { ROLES, requireRole, requireWriteAccess };
