const express = require('express');
const router = express.Router();
const Joi = require('joi');
const doctorApplicationController = require('../controllers/doctorApplicationController');
const { isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const uploadDocuments = require('../middlewares/uploadDocuments');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all doctor applications (Admin only)
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
  asyncHandler(doctorApplicationController.getDoctorApplications)
);

// Get doctor applications statistics (Admin only)
router.get(
  '/stats',
  isAdmin,
  asyncHandler(doctorApplicationController.getDoctorApplicationsStats)
);

// Get single doctor application (Admin only)
router.get('/:id', isAdmin, asyncHandler(doctorApplicationController.getDoctorApplication));

// Create doctor application (Public)
router.post(
  '/',
  csrfProtection,
  uploadDocuments.array('documents', 10), // حداکثر ۱۰ فایل
  validate(
    Joi.object({
      firstName: Joi.string().required().messages({
        'any.required': 'نام الزامی است',
      }),
      lastName: Joi.string().required().messages({
        'any.required': 'نام خانوادگی الزامی است',
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
      phoneNumber: Joi.string()
        .pattern(/^(\+98|0)?9\d{9}$/)
        .required()
        .messages({
          'any.required': 'شماره تلفن الزامی است',
          'string.pattern.base': 'شماره تلفن نامعتبر است',
        }),
      doctorInfo: Joi.string().required().min(20).messages({
        'any.required': 'اطلاعات پزشک الزامی است',
        'string.min': 'اطلاعات پزشک باید حداقل ۲۰ کاراکتر باشد',
      }),
    })
  ),
  asyncHandler(doctorApplicationController.createDoctorApplication)
);

// Mark application as read (Admin only)
router.patch(
  '/:id/read',
  isAdmin,
  csrfProtection,
  asyncHandler(doctorApplicationController.markAsRead)
);

// Mark application as unread (Admin only)
router.patch(
  '/:id/unread',
  isAdmin,
  csrfProtection,
  asyncHandler(doctorApplicationController.markAsUnread)
);

// Delete doctor application (Admin only)
router.delete(
  '/:id',
  isAdmin,
  csrfProtection,
  asyncHandler(doctorApplicationController.deleteDoctorApplication)
);

module.exports = router;

