const express = require('express');
const router = express.Router();
const Joi = require('joi');
const faqController = require('../controllers/faqController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');

// Get all FAQs (published only for public)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(faqController.getFaqs)
);

// Get single FAQ (public)
router.get('/:id', asyncHandler(faqController.getFaq));

// Create FAQ (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  validate(
    Joi.object({
      question: Joi.string().required().min(10).max(500).messages({
        'any.required': 'سوال الزامی است',
        'string.min': 'سوال باید حداقل ۱۰ کاراکتر باشد',
        'string.max': 'سوال نباید بیشتر از ۵۰۰ کاراکتر باشد',
      }),
      answer: Joi.string().required().min(10).messages({
        'any.required': 'پاسخ الزامی است',
        'string.min': 'پاسخ باید حداقل ۱۰ کاراکتر باشد',
      }),
      order: Joi.number().integer().min(0).default(0),
      published: Joi.boolean().default(true),
    })
  ),
  asyncHandler(faqController.createFaq)
);

// Update FAQ (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  validate(
    Joi.object({
      question: Joi.string().min(10).max(500),
      answer: Joi.string().min(10),
      order: Joi.number().integer().min(0),
      published: Joi.boolean(),
    })
  ),
  asyncHandler(faqController.updateFaq)
);

// Delete FAQ (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, asyncHandler(faqController.deleteFaq));

// Reorder FAQs (Admin/Secretary)
router.post(
  '/reorder',
  isAdminOrSecretary,
  validate(
    Joi.object({
      faqs: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().uuid().required(),
            order: Joi.number().integer().min(0).required(),
          })
        )
        .min(1)
        .required(),
    })
  ),
  asyncHandler(faqController.reorderFaqs)
);

module.exports = router;

