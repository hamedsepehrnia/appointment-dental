const express = require('express');
const router = express.Router();
const Joi = require('joi');
const articleController = require('../controllers/articleController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');

// Get all articles (public for published, admin/secretary for all)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
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
  upload.single('coverImage'),
  validate(
    Joi.object({
      title: Joi.string().required().messages({
        'any.required': 'عنوان الزامی است',
      }),
      content: Joi.string().required().messages({
        'any.required': 'محتوا الزامی است',
      }),
      excerpt: Joi.string().allow(''),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(articleController.createArticle)
);

// Update article (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  upload.single('coverImage'),
  validate(
    Joi.object({
      title: Joi.string(),
      content: Joi.string(),
      excerpt: Joi.string().allow(''),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(articleController.updateArticle)
);

// Delete article (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, asyncHandler(articleController.deleteArticle));

module.exports = router;

