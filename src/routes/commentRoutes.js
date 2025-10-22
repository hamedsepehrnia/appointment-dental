const express = require('express');
const router = express.Router();
const Joi = require('joi');
const commentController = require('../controllers/commentController');
const { isAuthenticated, isPatient } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');

// Get comments for a doctor (public)
router.get(
  '/doctor/:doctorId',
  validate(schemas.pagination, 'query'),
  asyncHandler(commentController.getDoctorComments)
);

// Create comment (Patient only)
router.post(
  '/doctor/:doctorId',
  isPatient,
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
  asyncHandler(commentController.createComment)
);

// Update comment (Owner only)
router.patch(
  '/:id',
  isAuthenticated,
  validate(
    Joi.object({
      content: Joi.string().min(10).max(1000),
      rating: Joi.number().integer().min(1).max(5),
    })
  ),
  asyncHandler(commentController.updateComment)
);

// Delete comment (Owner or Admin)
router.delete('/:id', isAuthenticated, asyncHandler(commentController.deleteComment));

module.exports = router;

