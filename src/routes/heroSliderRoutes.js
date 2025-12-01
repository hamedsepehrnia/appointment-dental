const express = require('express');
const router = express.Router();
const Joi = require('joi');
const heroSliderController = require('../controllers/heroSliderController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');
const parseFormData = require('../middlewares/parseFormData');

// Get all hero sliders (published only for public)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false').allow(''),
    }),
    'query'
  ),
  asyncHandler(heroSliderController.getHeroSliders)
);

// Get single hero slider (public)
router.get('/:id', asyncHandler(heroSliderController.getHeroSlider));

// Create hero slider (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('heroSliderImage'),
  parseFormData('order', 'published'),
  validate(
    Joi.object({
      title: Joi.string().max(200).allow(''),
      description: Joi.string().allow(''),
      buttonText: Joi.string().max(100).allow(''),
      buttonLink: Joi.string().allow(''),
      order: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error('Invalid number');
          return num;
        })
      ).allow(null, ''),
      published: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false').custom((value) => value === 'true')
      ),
    })
  ),
  asyncHandler(heroSliderController.createHeroSlider)
);

// Update hero slider (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('heroSliderImage'),
  parseFormData('order', 'published'),
  validate(
    Joi.object({
      title: Joi.string().max(200).allow(''),
      description: Joi.string().allow(''),
      buttonText: Joi.string().max(100).allow(''),
      buttonLink: Joi.string().allow(''),
      order: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error('Invalid number');
          return num;
        })
      ).allow(null, ''),
      published: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false').custom((value) => value === 'true')
      ),
      removeHeroSliderImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(heroSliderController.updateHeroSlider)
);

// Delete hero slider (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(heroSliderController.deleteHeroSlider));

module.exports = router;

