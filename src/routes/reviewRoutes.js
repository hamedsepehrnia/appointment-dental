const express = require('express');
const router = express.Router();
const Joi = require('joi');
const reviewController = require('../controllers/reviewController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');
const parseFormData = require('../middlewares/parseFormData');

// Get all reviews (public - but only published ones for non-admin users)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      search: Joi.string().allow(''),
      published: Joi.string().valid('true', 'false').allow(''),
    }),
    'query'
  ),
  asyncHandler(reviewController.getReviews)
);

// Get single review (public)
router.get('/:id', asyncHandler(reviewController.getReview));

// Create review (public - users can submit reviews)
router.post(
  '/',
  csrfProtection,
  upload.single('profileImage'),
  parseFormData('rating', 'order'),
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام الزامی است',
      }),
      content: Joi.string().required().messages({
        'any.required': 'متن نظر الزامی است',
      }),
      rating: Joi.alternatives().try(
        Joi.number().integer().min(1).max(5),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > 5) {
            throw new Error('امتیاز باید بین 1 تا 5 باشد');
          }
          return num;
        })
      ).required().messages({
        'any.required': 'امتیاز الزامی است',
      }),
      order: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error('Invalid number');
          return num;
        })
      ).allow(null, ''),
    })
  ),
  asyncHandler(reviewController.createReview)
);

// Update review (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('profileImage'),
  parseFormData('rating', 'order', 'published'),
  validate(
    Joi.object({
      name: Joi.string(),
      content: Joi.string(),
      rating: Joi.alternatives().try(
        Joi.number().integer().min(1).max(5),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > 5) {
            throw new Error('امتیاز باید بین 1 تا 5 باشد');
          }
          return num;
        })
      ),
      published: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false').custom((value) => value === 'true')
      ),
      order: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error('Invalid number');
          return num;
        })
      ).allow(null, ''),
      removeProfileImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(reviewController.updateReview)
);

// Delete review (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(reviewController.deleteReview));

module.exports = router;

