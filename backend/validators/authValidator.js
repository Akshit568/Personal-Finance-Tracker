'use strict';

const { body } = require('express-validator');

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be 2-120 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be 6-72 characters'),
  // Role is optional at registration; only 'user' or 'read-only' allowed here.
  // Admins are created via seed or promoted by an existing admin.
  body('role')
    .optional()
    .isIn(['user', 'read-only'])
    .withMessage("Role must be 'user' or 'read-only'"),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
