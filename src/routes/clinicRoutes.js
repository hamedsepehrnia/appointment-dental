const express = require('express');
const router = express.Router();
const Joi = require('joi');
const clinicController = require('../controllers/clinicController');
const { isAdminOrSecretary, isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');
const upload = require('../middlewares/upload');
const parseFormData = require('../middlewares/parseFormData');

// Get all clinics (public)
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  asyncHandler(clinicController.getClinics)
);

// Get single clinic (public)
router.get('/:id', asyncHandler(clinicController.getClinic));

// Working hours schema (same as doctor's workingDays)
const workingHoursSchema = Joi.object({
  saturday: Joi.string().allow('', null).optional(),   // شنبه
  sunday: Joi.string().allow('', null).optional(),     // یکشنبه
  monday: Joi.string().allow('', null).optional(),     // دوشنبه
  tuesday: Joi.string().allow('', null).optional(),    // سه‌شنبه
  wednesday: Joi.string().allow('', null).optional(),  // چهارشنبه
  thursday: Joi.string().allow('', null).optional(),   // پنج‌شنبه
  friday: Joi.string().allow('', null).optional(),     // جمعه
}).optional();

// Create clinic (Admin only)
router.post(
  '/',
  isAdmin,
  csrfProtection,
  upload.single('image'),
  parseFormData('workingHours'),
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام کلینیک الزامی است',
      }),
      address: Joi.string().required().messages({
        'any.required': 'آدرس الزامی است',
      }),
      phoneNumber: Joi.string().allow(''),
      description: Joi.string().allow(''),
      latitude: Joi.number().min(-90).max(90).allow(null).messages({
        'number.min': 'عرض جغرافیایی باید بین -90 تا 90 باشد',
        'number.max': 'عرض جغرافیایی باید بین -90 تا 90 باشد',
      }),
      longitude: Joi.number().min(-180).max(180).allow(null).messages({
        'number.min': 'طول جغرافیایی باید بین -180 تا 180 باشد',
        'number.max': 'طول جغرافیایی باید بین -180 تا 180 باشد',
      }),
      workingHours: workingHoursSchema,
    })
  ),
  asyncHandler(clinicController.createClinic)
);

// Update clinic (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('image'),
  parseFormData('workingHours'),
  validate(
    Joi.object({
      name: Joi.string(),
      address: Joi.string(),
      phoneNumber: Joi.string(),
      description: Joi.string().allow(''),
      latitude: Joi.number().min(-90).max(90).allow(null).messages({
        'number.min': 'عرض جغرافیایی باید بین -90 تا 90 باشد',
        'number.max': 'عرض جغرافیایی باید بین -90 تا 90 باشد',
      }),
      longitude: Joi.number().min(-180).max(180).allow(null).messages({
        'number.min': 'طول جغرافیایی باید بین -180 تا 180 باشد',
        'number.max': 'طول جغرافیایی باید بین -180 تا 180 باشد',
      }),
      workingHours: workingHoursSchema,
      removeImage: Joi.string().valid('true', 'false').optional(),
    })
  ),
  asyncHandler(clinicController.updateClinic)
);

// Delete clinic (Admin only)
router.delete('/:id', isAdmin, csrfProtection, asyncHandler(clinicController.deleteClinic));

module.exports = router;

