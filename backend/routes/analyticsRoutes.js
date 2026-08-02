'use strict';

const express = require('express');
const controller = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: All analytics in one chart-ready payload (cached 15 min)
 *     description: >
 *       Combines totals, monthly trend, yearly trend, category breakdown and
 *       income-vs-expense. Every section includes both a Recharts-friendly
 *       `data` array and a Chart.js-friendly `chart` object.
 *     parameters:
 *       - { in: query, name: year, schema: { type: integer }, description: Year for the monthly trend (defaults to current year) }
 *     responses:
 *       200: { description: Analytics summary }
 *       401: { description: Unauthorized }
 */
router.get('/summary', controller.getSummary);

/**
 * @swagger
 * /api/analytics/totals:
 *   get:
 *     tags: [Analytics]
 *     summary: Total income, total expense and balance
 *     parameters:
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: Totals }
 */
router.get('/totals', controller.getTotals);

/**
 * @swagger
 * /api/analytics/monthly-trend:
 *   get:
 *     tags: [Analytics]
 *     summary: Monthly income/expense trend for a year
 *     parameters:
 *       - { in: query, name: year, schema: { type: integer } }
 *     responses:
 *       200: { description: Monthly trend }
 */
router.get('/monthly-trend', controller.getMonthlyTrend);

/**
 * @swagger
 * /api/analytics/yearly-trend:
 *   get:
 *     tags: [Analytics]
 *     summary: Yearly income/expense trend
 *     responses:
 *       200: { description: Yearly trend }
 */
router.get('/yearly-trend', controller.getYearlyTrend);

/**
 * @swagger
 * /api/analytics/category-breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Spending/earning grouped by category (with percentages)
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [income, expense] } }
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: Category breakdown }
 */
router.get('/category-breakdown', controller.getCategoryBreakdown);

/**
 * @swagger
 * /api/analytics/income-vs-expense:
 *   get:
 *     tags: [Analytics]
 *     summary: Income vs expense comparison
 *     parameters:
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: Income vs expense }
 */
router.get('/income-vs-expense', controller.getIncomeVsExpense);

module.exports = router;
