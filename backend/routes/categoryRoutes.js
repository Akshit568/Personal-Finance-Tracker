'use strict';

const express = require('express');
const controller = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createRules, updateRules, idRule } = require('../validators/categoryValidator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories (cached in Redis for 1 hour)
 *     responses:
 *       200: { description: Category list }
 *       401: { description: Unauthorized }
 */
router.get('/', controller.listCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by id
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: The category }
 *       404: { description: Not found }
 */
router.get('/:id', idRule, validate, controller.getCategory);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string, example: Subscriptions }
 *               type: { type: string, enum: [income, expense], example: expense }
 *     responses:
 *       201: { description: Created }
 *       403: { description: Admin only }
 *       409: { description: Category already exists }
 */
router.post('/', requireRole(ROLES.ADMIN), createRules, validate, controller.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [income, expense] }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Admin only }
 *       404: { description: Not found }
 */
router.put('/:id', requireRole(ROLES.ADMIN), updateRules, validate, controller.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Admin only }
 *       404: { description: Not found }
 */
router.delete('/:id', requireRole(ROLES.ADMIN), idRule, validate, controller.deleteCategory);

module.exports = router;
