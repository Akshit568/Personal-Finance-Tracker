'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const transactionService = require('../services/transactionService');

/** Parse and normalize list/query parameters. */
function parseListParams(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return {
    page,
    limit,
    sortBy: query.sortBy || 'transaction_date',
    order: query.order || 'desc',
    type: query.type,
    category_id: query.category_id ? parseInt(query.category_id, 10) : undefined,
    user_id: query.user_id ? parseInt(query.user_id, 10) : undefined,
    startDate: query.startDate,
    endDate: query.endDate,
    minAmount: query.minAmount !== undefined ? parseFloat(query.minAmount) : undefined,
    maxAmount: query.maxAmount !== undefined ? parseFloat(query.maxAmount) : undefined,
    search: query.search,
  };
}

const listTransactions = asyncHandler(async (req, res) => {
  const params = parseListParams(req.query);
  const { data, total } = await transactionService.list(req.user, params);

  const totalPages = Math.ceil(total / params.limit) || 1;
  return success(res, {
    message: 'Transactions retrieved',
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
      sortBy: params.sortBy,
      order: params.order.toLowerCase(),
    },
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const tx = await transactionService.findById(req.user, parseInt(req.params.id, 10));
  return success(res, { message: 'Transaction retrieved', data: tx });
});

const createTransaction = asyncHandler(async (req, res) => {
  const tx = await transactionService.create(req.user, req.body);
  return success(res, { statusCode: 201, message: 'Transaction created', data: tx });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await transactionService.update(req.user, parseInt(req.params.id, 10), req.body);
  return success(res, { message: 'Transaction updated', data: tx });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.remove(req.user, parseInt(req.params.id, 10));
  return success(res, { message: 'Transaction deleted', data: null });
});

module.exports = {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
