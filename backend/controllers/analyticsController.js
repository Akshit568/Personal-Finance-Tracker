'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const analyticsService = require('../services/analyticsService');

// Analytics are always computed over the authenticated user's own transactions.
function userId(req) {
  return req.user.id;
}

const getSummary = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await analyticsService.summary(userId(req), { year });
  return success(res, { message: 'Analytics summary', data });
});

const getTotals = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.cached(userId(req), 'totals', { startDate, endDate }, () =>
    analyticsService.totals(userId(req), { startDate, endDate })
  );
  return success(res, { message: 'Totals', data });
});

const getMonthlyTrend = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await analyticsService.cached(userId(req), 'monthlyTrend', { year: year || null }, () =>
    analyticsService.monthlyTrend(userId(req), { year })
  );
  return success(res, { message: 'Monthly trend', data });
});

const getYearlyTrend = asyncHandler(async (req, res) => {
  const data = await analyticsService.cached(userId(req), 'yearlyTrend', {}, () =>
    analyticsService.yearlyTrend(userId(req))
  );
  return success(res, { message: 'Yearly trend', data });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  const data = await analyticsService.cached(
    userId(req),
    'categoryBreakdown',
    { type, startDate, endDate },
    () => analyticsService.categoryBreakdown(userId(req), { type, startDate, endDate })
  );
  return success(res, { message: 'Category breakdown', data });
});

const getIncomeVsExpense = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.cached(
    userId(req),
    'incomeVsExpense',
    { startDate, endDate },
    () => analyticsService.incomeVsExpense(userId(req), { startDate, endDate })
  );
  return success(res, { message: 'Income vs expense', data });
});

module.exports = {
  getSummary,
  getTotals,
  getMonthlyTrend,
  getYearlyTrend,
  getCategoryBreakdown,
  getIncomeVsExpense,
};
