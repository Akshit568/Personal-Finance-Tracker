'use strict';

const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const cache = require('./cacheService');

/**
 * List all categories. Cached in Redis for 1 hour; falls back to PostgreSQL
 * transparently when the cache is empty or Redis is unavailable.
 */
async function list() {
  const cached = await cache.getCategoryList();
  if (cached) return { data: cached, cached: true };

  const { rows } = await db.query(
    `SELECT id, name, type, created_at, updated_at
     FROM categories
     ORDER BY type ASC, name ASC`
  );
  await cache.setCategoryList(rows);
  return { data: rows, cached: false };
}

async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, name, type, created_at, updated_at FROM categories WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ name, type }) {
  const { rows } = await db.query(
    `INSERT INTO categories (name, type) VALUES ($1, $2)
     RETURNING id, name, type, created_at, updated_at`,
    [name, type]
  );
  await cache.invalidateCategories();
  return rows[0];
}

async function update(id, fields) {
  const existing = await findById(id);
  if (!existing) throw ApiError.notFound('Category not found');

  const name = fields.name !== undefined ? fields.name : existing.name;
  const type = fields.type !== undefined ? fields.type : existing.type;

  const { rows } = await db.query(
    `UPDATE categories SET name = $1, type = $2 WHERE id = $3
     RETURNING id, name, type, created_at, updated_at`,
    [name, type, id]
  );
  await cache.invalidateCategories();
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM categories WHERE id = $1`, [id]);
  if (rowCount === 0) throw ApiError.notFound('Category not found');
  await cache.invalidateCategories();
}

module.exports = { list, findById, create, update, remove };
