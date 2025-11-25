const express = require('express');
const router = express.Router();
const Joi = require('joi');
const categoryController = require('../controllers/categoryController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Article Categories Routes

// Get all article categories (public for published, admin/secretary for all)
router.get(
  '/articles',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(categoryController.getArticleCategories)
);

// Get single article category (public)
router.get('/articles/:identifier', asyncHandler(categoryController.getArticleCategory));

// Create article category (Admin/Secretary)
router.post(
  '/articles',
  isAdminOrSecretary,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام دسته‌بندی الزامی است',
      }),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(categoryController.createArticleCategory)
);

// Update article category (Admin/Secretary)
router.patch(
  '/articles/:id',
  isAdminOrSecretary,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string(),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(categoryController.updateArticleCategory)
);

// Delete article category (Admin/Secretary)
router.delete(
  '/articles/:id',
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(categoryController.deleteArticleCategory)
);

// Service Categories Routes

// Get all service categories (public for published, admin/secretary for all)
router.get(
  '/services',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(categoryController.getServiceCategories)
);

// Get single service category (public)
router.get('/services/:identifier', asyncHandler(categoryController.getServiceCategory));

// Create service category (Admin/Secretary)
router.post(
  '/services',
  isAdminOrSecretary,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام دسته‌بندی الزامی است',
      }),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(categoryController.createServiceCategory)
);

// Update service category (Admin/Secretary)
router.patch(
  '/services/:id',
  isAdminOrSecretary,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string(),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(categoryController.updateServiceCategory)
);

// Delete service category (Admin/Secretary)
router.delete(
  '/services/:id',
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(categoryController.deleteServiceCategory)
);

module.exports = router;

