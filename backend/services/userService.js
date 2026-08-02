'use strict';

const db = require('../config/db');
const ApiError = require('../utils/ApiError');

// Columns that are always safe to return (never the password hash).
const PUBLIC_COLUMNS = 'id, name, email, role, created_at, updated_at';

/** Find a user by id (public columns only). */
async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/** Find a user by email INCLUDING the password hash (for login). */
async function findByEmailWithHash(email) {
  const { rows } = await db.query(
    `SELECT id, name, email, role, password_hash, created_at, updated_at
     FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return rows[0] || null;
}

/** Create a user. Returns the public representation. */
async function create({ name, email, passwordHash, role = 'user' }) {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

/**
 * List users with pagination and optional role filter (admin only).
 * Returns { data, total }.
 */
async function list({ page = 1, limit = 20, role }) {
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';

  if (role) {
    params.push(role);
    where = `WHERE role = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params);
  const total = countRes.rows[0].total;

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return { data: rows, total };
}

/** Delete a user by id. Throws 404 if not found. */
async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM users WHERE id = $1`, [id]);
  if (rowCount === 0) throw ApiError.notFound('User not found');
}

/** Change a user's role. Returns the updated public user. Throws 404 if absent. */
async function changeRole(id, role) {
  const { rows } = await db.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${PUBLIC_COLUMNS}`,
    [role, id]
  );
  if (rows.length === 0) throw ApiError.notFound('User not found');
  return rows[0];
}

/** Count users by role (used to protect against deleting the last admin). */
async function countByRole(role) {
  const { rows } = await db.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = $1`, [role]);
  return rows[0].total;
}

module.exports = {
  findById,
  findByEmailWithHash,
  create,
  list,
  remove,
  changeRole,
  countByRole,
};
