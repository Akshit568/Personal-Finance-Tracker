'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const userService = require('../services/userService');
const { ROLES } = require('../middleware/rbac');

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const role = req.query.role;

  const { data, total } = await userService.list({ page, limit, role });
  const totalPages = Math.ceil(total / limit) || 1;

  return success(res, {
    message: 'Users retrieved',
    data,
    meta: { page, limit, total, totalPages },
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.findById(parseInt(req.params.id, 10));
  if (!user) throw ApiError.notFound('User not found');
  return success(res, { message: 'User retrieved', data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Prevent admins from deleting their own account (would lock themselves out).
  if (id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  // Prevent removing the last remaining admin.
  const target = await userService.findById(id);
  if (!target) throw ApiError.notFound('User not found');
  if (target.role === ROLES.ADMIN) {
    const adminCount = await userService.countByRole(ROLES.ADMIN);
    if (adminCount <= 1) throw ApiError.badRequest('Cannot delete the last admin account');
  }

  await userService.remove(id);
  return success(res, { message: 'User deleted', data: null });
});

const changeRole = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;

  // Prevent demoting the last admin.
  if (role !== ROLES.ADMIN) {
    const target = await userService.findById(id);
    if (!target) throw ApiError.notFound('User not found');
    if (target.role === ROLES.ADMIN) {
      const adminCount = await userService.countByRole(ROLES.ADMIN);
      if (adminCount <= 1) throw ApiError.badRequest('Cannot demote the last admin account');
    }
  }

  const user = await userService.changeRole(id, role);
  return success(res, { message: 'User role updated', data: user });
});

module.exports = { listUsers, getUser, deleteUser, changeRole };
