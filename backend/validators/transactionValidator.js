'use strict';

const { body, param, query } = require('express-validator');

const createRules = [
  body('type').isIn(['income', 'expense']).withMessage("type must be 'income' or 'expense'"),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('amount must be a number greater than 0'),
  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('category_id must be a positive integer'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 1000 })
    .withMessage('description must be at most 1000 characters'),
  body('transaction_date')
    .notEmpty()
    .withMessage('transaction_date is required')
    .isISO8601()
    .withMessage('transaction_date must be a valid date (YYYY-MM-DD)'),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  body('type').optional().isIn(['income', 'expense']).withMessage("type must be 'income' or 'expense'"),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('amount must be a number greater than 0'),
  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('category_id must be a positive integer'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 1000 })
    .withMessage('description must be at most 1000 characters'),
  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('transaction_date must be a valid date (YYYY-MM-DD)'),
];

const idRule = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('type').optional().isIn(['income', 'expense']).withMessage("type must be 'income' or 'expense'"),
  query('category_id').optional().isInt({ min: 1 }).withMessage('category_id must be a positive integer'),
  query('startDate').optional().isISO8601().withMessage('startDate must be YYYY-MM-DD'),
  query('endDate').optional().isISO8601().withMessage('endDate must be YYYY-MM-DD'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be >= 0'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be >= 0'),
  query('sortBy')
    .optional()
    .isIn(['transaction_date', 'amount', 'created_at', 'type'])
    .withMessage('sortBy must be one of transaction_date, amount, created_at, type'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage("order must be 'asc' or 'desc'"),
];

module.exports = { createRules, updateRules, idRule, listRules };
