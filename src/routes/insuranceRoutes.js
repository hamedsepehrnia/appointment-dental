const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const insuranceController = require('../controllers/insuranceController');
const { csrfProtection } = require('../middlewares/csrf');

// Public routes
// Get all insurance organizations
router.get(
  '/',
  asyncHandler(insuranceController.getInsuranceOrganizations)
);

// Get single insurance organization
router.get(
  '/:id',
  asyncHandler(insuranceController.getInsuranceOrganization)
);

// Admin routes
// Create insurance organization
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().required().min(2).max(100).messages({
        'any.required': 'نام سازمان بیمه الزامی است',
        'string.min': 'نام باید حداقل ۲ کاراکتر باشد',
        'string.max': 'نام نباید بیشتر از ۱۰۰ کاراکتر باشد',
      }),
      description: Joi.string().max(1000),
      website: Joi.string().uri().allow(''),
      phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).allow(''),
      email: Joi.string().email().allow(''),
      logo: Joi.string().allow(''),
      published: Joi.boolean(),
      order: Joi.number().integer().min(0),
    })
  ),
  asyncHandler(insuranceController.createInsuranceOrganization)
);

// Update insurance organization
router.patch(
  '/:id',
  isAuthenticated,
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().min(2).max(100),
      description: Joi.string().max(1000),
      website: Joi.string().uri().allow(''),
      phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).allow(''),
      email: Joi.string().email().allow(''),
      logo: Joi.string().allow(''),
      published: Joi.boolean(),
      order: Joi.number().integer().min(0),
    })
  ),
  asyncHandler(insuranceController.updateInsuranceOrganization)
);

// Delete insurance organization
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  csrfProtection,
  asyncHandler(insuranceController.deleteInsuranceOrganization)
);

// Toggle published status
router.patch(
  '/:id/toggle-status',
  isAuthenticated,
  isAdmin,
  csrfProtection,
  asyncHandler(insuranceController.toggleInsuranceOrganizationStatus)
);

module.exports = router;
