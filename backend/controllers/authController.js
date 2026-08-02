'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.register({ name, email, password, role });
  return success(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return success(res, { message: 'Login successful', data: result });
});

const me = asyncHandler(async (req, res) => {
  return success(res, { message: 'Current user', data: { user: req.user } });
});

module.exports = { register, login, me };
