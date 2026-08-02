'use strict';

const express = require('express');
const controller = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createRules,
  updateRules,
  idRule,
  listRules,
} = require('../validators/transactionValidator');

const router = express.Router();

// Every transaction route requires authentication.
router.use(authenticate);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions (search, filter, sort, paginate)
 *     description: >
 *       Returns the authenticated user's own transactions. Admins receive all
 *       transactions and may scope to a user with `user_id`.
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [transaction_date, amount, created_at, type], default: transaction_date } }
 *       - { in: query, name: order, schema: { type: string, enum: [asc, desc], default: desc } }
 *       - { in: query, name: type, schema: { type: string, enum: [income, expense] } }
 *       - { in: query, name: category_id, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string }, description: Matches the description (case-insensitive) }
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *       - { in: query, name: minAmount, schema: { type: number } }
 *       - { in: query, name: maxAmount, schema: { type: number } }
 *       - { in: query, name: user_id, schema: { type: integer }, description: Admin-only filter }
 *     responses:
 *       200:
 *         description: A paginated list of transactions
 *       401: { description: Unauthorized }
 */
router.get('/', listRules, validate, controller.listTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a single transaction (ownership enforced)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: The transaction }
 *       404: { description: Not found }
 */
router.get('/:id', idRule, validate, controller.getTransaction);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
 *     description: Requires admin or user role (read-only accounts are rejected).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       403: { description: Read-only accounts cannot modify data }
 */
router.post('/', requireWriteAccess, createRules, validate, controller.createTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Update a transaction (ownership enforced)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Read-only accounts cannot modify data }
 *       404: { description: Not found }
 */
router.put('/:id', requireWriteAccess, updateRules, validate, controller.updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction (ownership enforced)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Read-only accounts cannot modify data }
 *       404: { description: Not found }
 */
router.delete('/:id', requireWriteAccess, idRule, validate, controller.deleteTransaction);

module.exports = router;
