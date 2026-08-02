'use strict';

const userService = require('./userService');
const password = require('../utils/password');
const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

/** Register a new account and return { token, user }. */
async function register({ name, email, role, password: plainPassword }) {
  const existing = await userService.findByEmailWithHash(email);
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await password.hash(plainPassword);
  const user = await userService.create({
    name,
    email,
    passwordHash,
    role: role || 'user',
  });

  const token = jwt.sign({ id: user.id, role: user.role });
  return { token, user };
}

/** Authenticate credentials and return { token, user }. */
async function login({ email, password: plainPassword }) {
  const record = await userService.findByEmailWithHash(email);
  // Use the same error for missing user and wrong password to avoid leaking
  // which emails are registered.
  if (!record) throw ApiError.unauthorized('Invalid email or password');

  const ok = await password.compare(plainPassword, record.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const token = jwt.sign({ id: record.id, role: record.role });
  const user = {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
  return { token, user };
}

module.exports = { register, login };
