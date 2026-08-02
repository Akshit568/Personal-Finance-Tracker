'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

/** Sign a JWT for an authenticated user. */
function sign(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/** Verify a JWT and return its decoded payload (throws on failure). */
function verify(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { sign, verify };
