'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const categoryService = require('../services/categoryService');

const listCategories = asyncHandler(async (req, res) => {
  const { data, cached } = await categoryService.list();
  return success(res, {
    message: 'Categories retrieved',
    data,
    meta: { count: data.length, cached },
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.findById(parseInt(req.params.id, 10));
  if (!category) throw ApiError.notFound('Category not found');
  return success(res, { message: 'Category retrieved', data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const category = await categoryService.create({ name, type });
  return success(res, { statusCode: 201, message: 'Category created', data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(parseInt(req.params.id, 10), req.body);
  return success(res, { message: 'Category updated', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(parseInt(req.params.id, 10));
  return success(res, { message: 'Category deleted', data: null });
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
