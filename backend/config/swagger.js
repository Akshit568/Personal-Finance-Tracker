'use strict';

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./index');

/**
 * OpenAPI 3 definition. Reusable schemas and the bearer-auth security scheme
 * live here; per-endpoint documentation is written as JSDoc @swagger blocks in
 * the route files and merged in via the `apis` glob below.
 */
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Personal Finance Tracker API',
    version: '1.0.0',
    description:
      'Production-quality backend for a Personal Finance Tracker. ' +
      'JWT-authenticated, role-based (admin / user / read-only), with Redis caching and analytics.',
    license: { name: 'MIT' },
  },
  servers: [{ url: `http://localhost:${config.port}`, description: 'Local server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the token returned by /api/auth/login (without the "Bearer " prefix).',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          errors: {
            type: 'array',
            items: { type: 'object' },
            description: 'Present for validation errors.',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          role: { type: 'string', enum: ['admin', 'user', 'read-only'], example: 'user' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 3 },
          name: { type: 'string', example: 'Groceries' },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 42 },
          user_id: { type: 'integer', example: 1 },
          category_id: { type: 'integer', nullable: true, example: 3 },
          category_name: { type: 'string', nullable: true, example: 'Groceries' },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          amount: { type: 'number', format: 'float', example: 54.75 },
          description: { type: 'string', nullable: true, example: 'Weekly shop' },
          transaction_date: { type: 'string', format: 'date', example: '2026-07-15' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TransactionInput: {
        type: 'object',
        required: ['type', 'amount', 'transaction_date'],
        properties: {
          category_id: { type: 'integer', nullable: true, example: 3 },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          amount: { type: 'number', format: 'float', example: 54.75 },
          description: { type: 'string', example: 'Weekly shop' },
          transaction_date: { type: 'string', format: 'date', example: '2026-07-15' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Registration, login and current user' },
    { name: 'Transactions', description: 'CRUD, search, filter, sort, paginate (ownership-enforced)' },
    { name: 'Categories', description: 'Category CRUD (cached in Redis)' },
    { name: 'Analytics', description: 'Chart-ready aggregates (cached in Redis)' },
    { name: 'Users', description: 'Admin-only user management' },
  ],
};

const options = {
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

module.exports = swaggerJSDoc(options);
