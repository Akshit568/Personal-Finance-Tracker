'use strict';

const { body, param } = require('express-validator');

const createRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ max: 80 })
    .withMessage('name must be at most 80 characters'),
  body('type').isIn(['income', 'expense']).withMessage("type must be 'income' or 'expense'"),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty')
    .isLength({ max: 80 })
    .withMessage('name must be at most 80 characters'),
  body('type').optional().isIn(['income', 'expense']).withMessage("type must be 'income' or 'expense'"),
];

const idRule = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

module.exports = { createRules, updateRules, idRule };
