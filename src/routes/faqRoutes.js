const express = require('express');
const router = express.Router();
const Joi = require('joi');
const faqController = require('../controllers/faqController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all FAQs
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  asyncHandler(faqController.getFaqs)
);

// Get single FAQ (public)
router.get('/:id', asyncHandler(faqController.getFaq));

// Create FAQ (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
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
    })
  ),
  asyncHandler(faqController.createFaq)
);

// Update FAQ (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  validate(
    Joi.object({
      question: Joi.string().min(10).max(500),
      answer: Joi.string().min(10),
      order: Joi.number().integer().min(0),
    })
  ),
  asyncHandler(faqController.updateFaq)
);

// Delete FAQ (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(faqController.deleteFaq));

module.exports = router;

