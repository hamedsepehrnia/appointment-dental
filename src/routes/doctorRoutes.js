const express = require('express');
const router = express.Router();
const Joi = require('joi');
const doctorController = require('../controllers/doctorController');
const { isAdminOrSecretary, isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const parseFormData = require('../middlewares/parseFormData');
const { csrfProtection } = require('../middlewares/csrf');

// Get all doctors (public)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      clinicId: Joi.string().uuid(),
    }),
    'query'
  ),
  asyncHandler(doctorController.getDoctors)
);

// Get single doctor (public)
router.get('/:id', asyncHandler(doctorController.getDoctor));

// Create doctor (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('profileImage'),
  parseFormData('skills', 'clinicIds', 'workingDays'), // Parse JSON strings to arrays/objects
  validate(
    Joi.object({
      firstName: Joi.string().required().messages({
        'any.required': 'نام الزامی است',
      }),
      lastName: Joi.string().required().messages({
        'any.required': 'نام خانوادگی الزامی است',
      }),
      university: Joi.string().required().messages({
        'any.required': 'دانشگاه الزامی است',
      }),
      biography: Joi.string().allow(''),
      skills: Joi.array().items(Joi.string()),
      medicalLicenseNo: Joi.string().required().messages({
        'any.required': 'شماره نظام پزشکی الزامی است',
      }),
      clinicIds: Joi.array().items(Joi.string().uuid()),
      workingDays: Joi.object({
        saturday: Joi.string().allow('', null).optional(), // شنبه
        sunday: Joi.string().allow('', null).optional(), // یکشنبه
        monday: Joi.string().allow('', null).optional(), // دوشنبه
        tuesday: Joi.string().allow('', null).optional(), // سه‌شنبه
        wednesday: Joi.string().allow('', null).optional(), // چهارشنبه
        thursday: Joi.string().allow('', null).optional(), // پنج‌شنبه
        friday: Joi.string().allow('', null).optional(), // جمعه
      }).optional(),
    })
  ),
  asyncHandler(doctorController.createDoctor)
);

// Update doctor (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('profileImage'),
  parseFormData('skills', 'clinicIds', 'workingDays'), // Parse JSON strings to arrays/objects
  validate(
    Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      university: Joi.string(),
      biography: Joi.string().allow(''),
      skills: Joi.array().items(Joi.string()),
      medicalLicenseNo: Joi.string(),
      clinicIds: Joi.array().items(Joi.string().uuid()),
      workingDays: Joi.object({
        saturday: Joi.string().allow('', null).optional(), // شنبه
        sunday: Joi.string().allow('', null).optional(), // یکشنبه
        monday: Joi.string().allow('', null).optional(), // دوشنبه
        tuesday: Joi.string().allow('', null).optional(), // سه‌شنبه
        wednesday: Joi.string().allow('', null).optional(), // چهارشنبه
        thursday: Joi.string().allow('', null).optional(), // پنج‌شنبه
        friday: Joi.string().allow('', null).optional(), // جمعه
      }).optional(),
    })
  ),
  asyncHandler(doctorController.updateDoctor)
);

// Delete doctor (Admin only)
router.delete('/:id', isAdmin, csrfProtection, asyncHandler(doctorController.deleteDoctor));

module.exports = router;

