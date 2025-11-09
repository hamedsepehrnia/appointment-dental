const express = require('express');
const router = express.Router();
const Joi = require('joi');
const contactController = require('../controllers/contactController');
const { isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all contact messages (Admin only)
router.get(
  '/',
  isAdmin,
  validate(
    schemas.pagination.keys({
      read: Joi.string().valid('true', 'false'),
      search: Joi.string(),
    }),
    'query'
  ),
  asyncHandler(contactController.getContactMessages)
);

// Get contact messages statistics (Admin only)
router.get(
  '/stats',
  isAdmin,
  asyncHandler(contactController.getContactMessagesStats)
);

// Get single contact message (Admin only)
router.get('/:id', isAdmin, asyncHandler(contactController.getContactMessage));

// Create contact message (Public)
router.post(
  '/',
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام الزامی است',
      }),
      email: Joi.string().allow('', null).optional().custom((value, helpers) => {
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return helpers.error('string.email');
          }
        }
        return value;
      }).messages({
        'string.email': 'فرمت ایمیل معتبر نیست',
      }),
      clinicId: Joi.string()
        .uuid({ version: 'uuidv4' })
        .allow('', null)
        .optional()
        .messages({
          'string.guid': 'کلینیک انتخاب شده معتبر نیست',
        }),
      phoneNumber: Joi.string().allow('', null),
      subject: Joi.string().allow('', null),
      message: Joi.string().required().min(10).messages({
        'any.required': 'پیام الزامی است',
        'string.min': 'پیام باید حداقل ۱۰ کاراکتر باشد',
      }),
    })
  ),
  asyncHandler(contactController.createContactMessage)
);

// Mark message as read (Admin only)
router.patch(
  '/:id/read',
  isAdmin,
  csrfProtection,
  asyncHandler(contactController.markAsRead)
);

// Mark message as unread (Admin only)
router.patch(
  '/:id/unread',
  isAdmin,
  csrfProtection,
  asyncHandler(contactController.markAsUnread)
);

// Delete contact message (Admin only)
router.delete(
  '/:id',
  isAdmin,
  csrfProtection,
  asyncHandler(contactController.deleteContactMessage)
);

module.exports = router;

