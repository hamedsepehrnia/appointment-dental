const express = require('express');
const router = express.Router();
const Joi = require('joi');
const clinicController = require('../controllers/clinicController');
const { isAdminOrSecretary, isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');

// Get all clinics (public)
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  asyncHandler(clinicController.getClinics)
);

// Get single clinic (public)
router.get('/:id', asyncHandler(clinicController.getClinic));

// Create clinic (Admin only)
router.post(
  '/',
  isAdmin,
  validate(
    Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'نام کلینیک الزامی است',
      }),
      address: Joi.string().required().messages({
        'any.required': 'آدرس الزامی است',
      }),
      phoneNumber: Joi.string().required().messages({
        'any.required': 'شماره تلفن الزامی است',
      }),
      description: Joi.string().allow(''),
    })
  ),
  asyncHandler(clinicController.createClinic)
);

// Update clinic (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  validate(
    Joi.object({
      name: Joi.string(),
      address: Joi.string(),
      phoneNumber: Joi.string(),
      description: Joi.string().allow(''),
    })
  ),
  asyncHandler(clinicController.updateClinic)
);

// Delete clinic (Admin only)
router.delete('/:id', isAdmin, asyncHandler(clinicController.deleteClinic));

module.exports = router;

