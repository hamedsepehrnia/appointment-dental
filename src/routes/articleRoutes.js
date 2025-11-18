const express = require('express');
const router = express.Router();
const Joi = require('joi');
const articleController = require('../controllers/articleController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');
const parseFormData = require('../middlewares/parseFormData');

// Get all articles (public for published, admin/secretary for all)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
      search: Joi.string().allow(''),
      categoryId: Joi.string().uuid(),
      categorySlug: Joi.string().allow(''),
    }),
    'query'
  ),
  asyncHandler(articleController.getArticles)
);

// Get single article (public)
router.get('/:identifier', asyncHandler(articleController.getArticle));

// Create article (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('coverImage'),
  parseFormData('categoryIds', 'published'),
  validate(
    Joi.object({
      title: Joi.string().required().messages({
        'any.required': 'عنوان الزامی است',
      }),
      content: Joi.string().required().messages({
        'any.required': 'محتوا الزامی است',
      }),
      excerpt: Joi.string().allow(''),
      author: Joi.string().allow(''),
      published: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false').custom((value) => value === 'true')
      ),
      categoryIds: Joi.alternatives().try(
        Joi.array().items(Joi.string().uuid()),
        Joi.string().uuid().custom((value, helpers) => {
          // Convert single UUID to array
          return [value];
        }, 'Convert UUID to array')
      ).allow(null, '').custom((value, helpers) => {
        // If it's null or empty, return null
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          return null;
        }
        // If it's already an array, validate each item
        if (Array.isArray(value)) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          for (const item of value) {
            if (!uuidRegex.test(item)) {
              return helpers.error('any.invalid');
            }
          }
          return value;
        }
        // If it's a single UUID string, convert to array
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) {
          return [value];
        }
        return helpers.error('any.invalid');
      }, 'Validate and normalize categoryIds'),
    })
  ),
  asyncHandler(articleController.createArticle)
);

// Update article (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('coverImage'),
  parseFormData('categoryIds', 'published'),
  validate(
    Joi.object({
      title: Joi.string(),
      content: Joi.string(),
      excerpt: Joi.string().allow(''),
      author: Joi.string().allow(''),
      published: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false').custom((value) => value === 'true')
      ),
      categoryIds: Joi.alternatives().try(
        Joi.array().items(Joi.string().uuid()),
        Joi.string().uuid().custom((value, helpers) => {
          // Convert single UUID to array
          return [value];
        }, 'Convert UUID to array')
      ).allow(null, '').custom((value, helpers) => {
        // If it's null or empty, return null
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          return null;
        }
        // If it's already an array, validate each item
        if (Array.isArray(value)) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          for (const item of value) {
            if (!uuidRegex.test(item)) {
              return helpers.error('any.invalid');
            }
          }
          return value;
        }
        // If it's a single UUID string, convert to array
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) {
          return [value];
        }
        return helpers.error('any.invalid');
      }, 'Validate and normalize categoryIds'),
    })
  ),
  asyncHandler(articleController.updateArticle)
);

// Delete article (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(articleController.deleteArticle));

module.exports = router;

