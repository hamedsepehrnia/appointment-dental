const express = require('express');
const router = express.Router();
const Joi = require('joi');
const serviceController = require('../controllers/serviceController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all services (public)
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  asyncHandler(serviceController.getServices)
);

// Get single service (public)
router.get('/:identifier', asyncHandler(serviceController.getService));

// Create service (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('coverImage'),
  validate(
    Joi.object({
      title: Joi.string().required().messages({
        'any.required': 'عنوان الزامی است',
      }),
      description: Joi.string().required().messages({
        'any.required': 'توضیحات الزامی است',
      }),
      beforeTreatmentTips: Joi.string().allow(''),
      afterTreatmentTips: Joi.string().allow(''),
      price: Joi.number().integer().min(0),
      durationMinutes: Joi.number().integer().min(0),
    })
  ),
  asyncHandler(serviceController.createService)
);

// Update service (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('coverImage'),
  validate(
    Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      beforeTreatmentTips: Joi.string().allow(''),
      afterTreatmentTips: Joi.string().allow(''),
      price: Joi.number().integer().min(0),
      durationMinutes: Joi.number().integer().min(0),
    })
  ),
  asyncHandler(serviceController.updateService)
);

// Delete service (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(serviceController.deleteService));

module.exports = router;

