'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Trust the first proxy (needed for correct client IPs behind nginx/Heroku etc.)
app.set('trust proxy', 1);

/* -------------------------------------------------------------------------- */
/* Security middleware                                                         */
/* -------------------------------------------------------------------------- */
app.use(helmet());

const corsOrigin =
  config.cors.origin === '*'
    ? '*'
    : config.cors.origin.split(',').map((o) => o.trim());
app.use(cors({ origin: corsOrigin, credentials: true }));

/* -------------------------------------------------------------------------- */
/* Body parsing                                                               */
/* -------------------------------------------------------------------------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* -------------------------------------------------------------------------- */
/* Sanitization: strip XSS payloads and prevent HTTP parameter pollution      */
/* -------------------------------------------------------------------------- */
app.use(xss());
app.use(hpp());

/* -------------------------------------------------------------------------- */
/* Rate limiting (applied to the API surface)                                 */
/* -------------------------------------------------------------------------- */
app.use('/api', apiLimiter);

/* -------------------------------------------------------------------------- */
/* Health check                                                               */
/* -------------------------------------------------------------------------- */
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), env: config.env });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Personal Finance Tracker API',
    docs: '/api/docs',
    health: '/health',
  });
});

/* -------------------------------------------------------------------------- */
/* Swagger documentation                                                      */
/* -------------------------------------------------------------------------- */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Finance Tracker API Docs',
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/* -------------------------------------------------------------------------- */
/* API routes                                                                 */
/* -------------------------------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

/* -------------------------------------------------------------------------- */
/* 404 + centralized error handler (must be last)                             */
/* -------------------------------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
