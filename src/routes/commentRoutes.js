const express = require('express');
const router = express.Router();
const Joi = require('joi');
const commentController = require('../controllers/commentController');
const { isAuthenticated, isPatient, isAdmin, isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Admin routes - Get all comments by type
router.get(
  '/all/doctors',
  isAuthenticated,
  isAdminOrSecretary,
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(commentController.getAllDoctorComments)
);

router.get(
  '/all/articles',
  isAuthenticated,
  isAdminOrSecretary,
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(commentController.getAllArticleComments)
);

router.get(
  '/all/services',
  isAuthenticated,
  isAdminOrSecretary,
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(commentController.getAllServiceComments)
);

// Toggle comment published status (Admin only)
router.patch(
  '/:id/toggle-status',
  isAuthenticated,
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(commentController.toggleCommentStatus)
);

// Get comments for a doctor (public)
router.get(
  '/doctor/:doctorId',
  validate(schemas.pagination, 'query'),
  asyncHandler(commentController.getDoctorComments)
);

// Create comment for doctor (Authenticated users)
router.post(
  '/doctor/:doctorId',
  isAuthenticated,
  csrfProtection,
  validate(
    Joi.object({
      content: Joi.string().required().min(10).max(1000).messages({
        'any.required': 'متن نظر الزامی است',
        'string.min': 'نظر باید حداقل ۱۰ کاراکتر باشد',
        'string.max': 'نظر نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
      }),
      rating: Joi.number().integer().min(1).max(5),
    })
  ),
  asyncHandler(commentController.createDoctorComment)
);

// Article comments routes
// Get comments for an article
router.get(
  '/article/:articleId',
  validate(schemas.pagination, 'query'),
  asyncHandler(commentController.getArticleComments)
);

// Create comment for article (Authenticated users)
router.post(
  '/article/:articleId',
  isAuthenticated,
  csrfProtection,
  validate(
    Joi.object({
      content: Joi.string().required().min(10).max(1000).messages({
        'any.required': 'متن نظر الزامی است',
        'string.min': 'نظر باید حداقل ۱۰ کاراکتر باشد',
        'string.max': 'نظر نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
      }),
      rating: Joi.number().integer().min(1).max(5),
    })
  ),
  asyncHandler(commentController.createArticleComment)
);

// Service comments routes
// Get comments for a service
router.get(
  '/service/:serviceId',
  validate(schemas.pagination, 'query'),
  asyncHandler(commentController.getServiceComments)
);

// Create comment for service (Authenticated users)
router.post(
  '/service/:serviceId',
  isAuthenticated,
  csrfProtection,
  validate(
    Joi.object({
      content: Joi.string().required().min(10).max(1000).messages({
        'any.required': 'متن نظر الزامی است',
        'string.min': 'نظر باید حداقل ۱۰ کاراکتر باشد',
        'string.max': 'نظر نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
      }),
      rating: Joi.number().integer().min(1).max(5),
    })
  ),
  asyncHandler(commentController.createServiceComment)
);

// Update comment (Owner or Admin)
router.patch(
  '/:id',
  isAuthenticated,
  csrfProtection,
  validate(
    Joi.object({
      content: Joi.string().min(10).max(1000),
      rating: Joi.number().integer().min(1).max(5),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(commentController.updateComment)
);

// Delete comment (Owner or Admin)
router.delete('/:id', isAuthenticated, csrfProtection, asyncHandler(commentController.deleteComment));

module.exports = router;

