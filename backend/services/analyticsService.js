'use strict';

const db = require('../config/db');
const cache = require('./cacheService');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Deterministic cache signature for a set of parameters. */
function sig(params) {
  return Buffer.from(JSON.stringify(params)).toString('base64');
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/* Totals: income / expense / balance                                         */
/* -------------------------------------------------------------------------- */
async function totals(userId, { startDate, endDate } = {}) {
  const params = [userId];
  let dateClause = '';
  if (startDate) {
    params.push(startDate);
    dateClause += ` AND transaction_date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    dateClause += ` AND transaction_date <= $${params.length}`;
  }

  const { rows } = await db.query(
    `SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense,
        COUNT(*)::int AS count
     FROM transactions
     WHERE user_id = $1 ${dateClause}`,
    params
  );

  const income = round2(rows[0].income);
  const expense = round2(rows[0].expense);
  return {
    totalIncome: income,
    totalExpense: expense,
    balance: round2(income - expense),
    transactionCount: rows[0].count,
  };
}

/* -------------------------------------------------------------------------- */
/* Monthly trend for a given year                                             */
/* -------------------------------------------------------------------------- */
async function monthlyTrend(userId, { year } = {}) {
  const targetYear = year || new Date().getFullYear();
  const { rows } = await db.query(
    `SELECT EXTRACT(MONTH FROM transaction_date)::int AS month,
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense
     FROM transactions
     WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
     GROUP BY month
     ORDER BY month`,
    [userId, targetYear]
  );

  const byMonth = new Map(rows.map((r) => [r.month, r]));
  const data = MONTH_LABELS.map((label, idx) => {
    const r = byMonth.get(idx + 1);
    const income = round2(r ? r.income : 0);
    const expense = round2(r ? r.expense : 0);
    return { month: label, monthNumber: idx + 1, income, expense, balance: round2(income - expense) };
  });

  return {
    year: targetYear,
    data, // Recharts-friendly array
    chart: {
      labels: MONTH_LABELS,
      datasets: [
        { label: 'Income', data: data.map((d) => d.income) },
        { label: 'Expense', data: data.map((d) => d.expense) },
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Yearly trend (all years present in the data)                               */
/* -------------------------------------------------------------------------- */
async function yearlyTrend(userId) {
  const { rows } = await db.query(
    `SELECT EXTRACT(YEAR FROM transaction_date)::int AS year,
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense
     FROM transactions
     WHERE user_id = $1
     GROUP BY year
     ORDER BY year`,
    [userId]
  );

  const data = rows.map((r) => ({
    year: r.year,
    income: round2(r.income),
    expense: round2(r.expense),
    balance: round2(r.income - r.expense),
  }));

  return {
    data,
    chart: {
      labels: data.map((d) => String(d.year)),
      datasets: [
        { label: 'Income', data: data.map((d) => d.income) },
        { label: 'Expense', data: data.map((d) => d.expense) },
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Category breakdown (per type, with percentages)                            */
/* -------------------------------------------------------------------------- */
async function categoryBreakdown(userId, { type, startDate, endDate } = {}) {
  const params = [userId];
  let clause = '';
  if (type) {
    params.push(type);
    clause += ` AND t.type = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    clause += ` AND t.transaction_date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    clause += ` AND t.transaction_date <= $${params.length}`;
  }

  const { rows } = await db.query(
    `SELECT t.category_id,
            COALESCE(c.name, 'Uncategorized') AS category,
            t.type,
            COALESCE(SUM(t.amount), 0)::float AS total,
            COUNT(*)::int AS count
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 ${clause}
     GROUP BY t.category_id, c.name, t.type
     ORDER BY total DESC`,
    params
  );

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const data = rows.map((r) => ({
    category_id: r.category_id,
    category: r.category,
    type: r.type,
    total: round2(r.total),
    count: r.count,
    percentage: grandTotal > 0 ? round2((r.total / grandTotal) * 100) : 0,
  }));

  return {
    data,
    chart: {
      labels: data.map((d) => d.category),
      datasets: [{ label: 'Amount', data: data.map((d) => d.total) }],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Income vs Expense (single comparison)                                      */
/* -------------------------------------------------------------------------- */
async function incomeVsExpense(userId, { startDate, endDate } = {}) {
  const t = await totals(userId, { startDate, endDate });
  return {
    data: [
      { name: 'Income', value: t.totalIncome },
      { name: 'Expense', value: t.totalExpense },
    ],
    chart: {
      labels: ['Income', 'Expense'],
      datasets: [{ label: 'Amount', data: [t.totalIncome, t.totalExpense] }],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Composite summary (everything at once) — cached                            */
/* -------------------------------------------------------------------------- */
async function summary(userId, { year } = {}) {
  const signature = sig({ year: year || null });
  const cached = await cache.getAnalytics(userId, 'summary', signature);
  if (cached) return { ...cached, cached: true };

  const [t, monthly, yearly, breakdown, ive] = await Promise.all([
    totals(userId),
    monthlyTrend(userId, { year }),
    yearlyTrend(userId),
    categoryBreakdown(userId, { type: 'expense' }),
    incomeVsExpense(userId),
  ]);

  const payload = {
    totals: t,
    monthlyTrend: monthly,
    yearlyTrend: yearly,
    categoryBreakdown: breakdown,
    incomeVsExpense: ive,
  };

  await cache.setAnalytics(userId, 'summary', signature, payload);
  return { ...payload, cached: false };
}

/**
 * Generic cached wrapper for the individual analytics endpoints so that they
 * also benefit from the 15-minute cache and graceful fallback.
 */
async function cached(userId, name, params, producer) {
  const signature = sig(params || {});
  const hit = await cache.getAnalytics(userId, name, signature);
  if (hit) return { ...hit, cached: true };
  const result = await producer();
  await cache.setAnalytics(userId, name, signature, result);
  return { ...result, cached: false };
}

module.exports = {
  totals,
  monthlyTrend,
  yearlyTrend,
  categoryBreakdown,
  incomeVsExpense,
  summary,
  cached,
};
