'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/** Hash a plaintext password. */
async function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash. */
async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };
