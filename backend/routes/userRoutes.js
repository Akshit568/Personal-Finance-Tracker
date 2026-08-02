'use strict';

const express = require('express');
const controller = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { idRule, listRules, changeRoleRules } = require('../validators/userValidator');

const router = express.Router();

// All user-management routes are admin-only.
router.use(authenticate, requireRole(ROLES.ADMIN));

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (admin only)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - { in: query, name: role, schema: { type: string, enum: [admin, user, read-only] } }
 *     responses:
 *       200: { description: A paginated list of users }
 *       403: { description: Admin only }
 */
router.get('/', listRules, validate, controller.listUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: The user }
 *       404: { description: Not found }
 */
router.get('/:id', idRule, validate, controller.getUser);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Change a user's role (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, user, read-only] }
 *     responses:
 *       200: { description: Role updated }
 *       400: { description: Cannot demote the last admin }
 *       404: { description: Not found }
 */
router.patch('/:id/role', changeRoleRules, validate, controller.changeRole);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Cannot delete self or the last admin }
 *       404: { description: Not found }
 */
router.delete('/:id', idRule, validate, controller.deleteUser);

module.exports = router;
