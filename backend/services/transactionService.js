'use strict';

const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const cache = require('./cacheService');
const { ROLES } = require('../middleware/rbac');

// Whitelist of sortable columns — prevents SQL injection via the sortBy param
// (column identifiers cannot be parameterized).
const SORTABLE = new Set(['transaction_date', 'amount', 'created_at', 'type']);

const SELECT_BASE = `
  SELECT t.id, t.user_id, t.category_id, c.name AS category_name,
         t.type, t.amount::float AS amount, t.description,
         t.transaction_date, t.created_at, t.updated_at
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
`;

/**
 * Build a parameterized WHERE clause from filters.
 * Non-admin requesters are always constrained to their own rows.
 */
function buildFilters(requester, filters, params) {
  const clauses = [];

  // Ownership enforcement.
  if (requester.role !== ROLES.ADMIN) {
    params.push(requester.id);
    clauses.push(`t.user_id = $${params.length}`);
  } else if (filters.user_id) {
    // Admins may optionally scope to a specific user.
    params.push(filters.user_id);
    clauses.push(`t.user_id = $${params.length}`);
  }

  if (filters.type) {
    params.push(filters.type);
    clauses.push(`t.type = $${params.length}`);
  }
  if (filters.category_id) {
    params.push(filters.category_id);
    clauses.push(`t.category_id = $${params.length}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(`t.transaction_date >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(`t.transaction_date <= $${params.length}`);
  }
  if (filters.minAmount !== undefined) {
    params.push(filters.minAmount);
    clauses.push(`t.amount >= $${params.length}`);
  }
  if (filters.maxAmount !== undefined) {
    params.push(filters.maxAmount);
    clauses.push(`t.amount <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    clauses.push(`t.description ILIKE $${params.length}`);
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

/**
 * List transactions with filtering, search, sorting and pagination.
 * @returns {Promise<{ data: Array, total: number }>}
 */
async function list(requester, { page = 1, limit = 20, sortBy = 'transaction_date', order = 'desc', ...filters }) {
  const params = [];
  const where = buildFilters(requester, filters, params);

  // Count (reuse the same filter params).
  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM transactions t ${where}`,
    params
  );
  const total = countRes.rows[0].total;

  const sortColumn = SORTABLE.has(sortBy) ? sortBy : 'transaction_date';
  const sortOrder = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const { rows } = await db.query(
    `${SELECT_BASE} ${where}
     ORDER BY t.${sortColumn} ${sortOrder}, t.id ${sortOrder}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return { data: rows, total };
}

/** Fetch a single transaction, enforcing ownership for non-admins. */
async function findById(requester, id) {
  const { rows } = await db.query(`${SELECT_BASE} WHERE t.id = $1`, [id]);
  const tx = rows[0];
  if (!tx) throw ApiError.notFound('Transaction not found');
  if (requester.role !== ROLES.ADMIN && tx.user_id !== requester.id) {
    // Do not reveal existence of other users' rows.
    throw ApiError.notFound('Transaction not found');
  }
  return tx;
}

/** Ensure a referenced category exists (nice error before hitting the FK). */
async function assertCategoryExists(categoryId) {
  if (categoryId === undefined || categoryId === null) return;
  const { rows } = await db.query(`SELECT id FROM categories WHERE id = $1`, [categoryId]);
  if (rows.length === 0) throw ApiError.badRequest(`Category ${categoryId} does not exist`);
}

async function create(requester, payload) {
  await assertCategoryExists(payload.category_id);

  const { rows } = await db.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      requester.id,
      payload.category_id ?? null,
      payload.type,
      payload.amount,
      payload.description ?? null,
      payload.transaction_date,
    ]
  );

  await cache.invalidateAnalytics(requester.id);
  return findById(requester, rows[0].id);
}

async function update(requester, id, payload) {
  // Loads + ownership check (throws 404 if not owner / not found).
  const existing = await findById(requester, id);

  if (payload.category_id !== undefined) {
    await assertCategoryExists(payload.category_id);
  }

  const merged = {
    category_id: payload.category_id !== undefined ? payload.category_id : existing.category_id,
    type: payload.type !== undefined ? payload.type : existing.type,
    amount: payload.amount !== undefined ? payload.amount : existing.amount,
    description: payload.description !== undefined ? payload.description : existing.description,
    transaction_date:
      payload.transaction_date !== undefined ? payload.transaction_date : existing.transaction_date,
  };

  await db.query(
    `UPDATE transactions
     SET category_id = $1, type = $2, amount = $3, description = $4, transaction_date = $5
     WHERE id = $6`,
    [merged.category_id, merged.type, merged.amount, merged.description, merged.transaction_date, id]
  );

  // Invalidate the owner's analytics (owner may differ from requester if admin).
  await cache.invalidateAnalytics(existing.user_id);
  return findById(requester, id);
}

async function remove(requester, id) {
  // Ownership check first.
  const existing = await findById(requester, id);
  await db.query(`DELETE FROM transactions WHERE id = $1`, [id]);
  await cache.invalidateAnalytics(existing.user_id);
}

module.exports = { list, findById, create, update, remove };
