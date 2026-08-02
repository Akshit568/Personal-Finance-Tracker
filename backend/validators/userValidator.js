'use strict';

const { body, param, query } = require('express-validator');

const idRule = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('role').optional().isIn(['admin', 'user', 'read-only']).withMessage('invalid role filter'),
];

const changeRoleRules = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  body('role')
    .isIn(['admin', 'user', 'read-only'])
    .withMessage("role must be 'admin', 'user' or 'read-only'"),
];

module.exports = { idRule, listRules, changeRoleRules };
