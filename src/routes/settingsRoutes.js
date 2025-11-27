const express = require('express');
const router = express.Router();
const Joi = require('joi');
const settingsController = require('../controllers/settingsController');
const { isAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');
const upload = require('../middlewares/upload');

// Get all settings (public)
router.get('/', asyncHandler(settingsController.getSettings));

// Get only social media links (public)
router.get('/social-media', asyncHandler(settingsController.getSocialMedia));

// Update all settings (Admin only)
router.patch(
  '/',
  isAdmin,
  csrfProtection,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'aboutUsImage', maxCount: 1 },
    { name: 'aboutUsVideo', maxCount: 1 },
    { name: 'contactUsImage', maxCount: 1 },
    { name: 'contactUsVideo', maxCount: 1 },
  ]),
  validate(
    Joi.object({
      siteName: Joi.string(),
      siteTitle: Joi.string(),
      description: Joi.string().allow(''),
      logo: Joi.string().allow(''),
      email: Joi.string().email().allow(''),
      phoneNumber: Joi.string().allow(''),
      address: Joi.string().allow(''),
      instagram: Joi.string().uri().allow(''),
      telegram: Joi.string().uri().allow(''),
      whatsapp: Joi.string().allow(''),
      twitter: Joi.string().uri().allow(''),
      linkedin: Joi.string().uri().allow(''),
      facebook: Joi.string().uri().allow(''),
      youtube: Joi.string().uri().allow(''),
      workingHours: Joi.string().allow(''),
      aboutUsImage: Joi.string().allow('', null),
      aboutUsVideo: Joi.string().allow('', null),
      aboutUsContent: Joi.string().allow(''),
      contactUsImage: Joi.string().allow('', null),
      contactUsVideo: Joi.string().allow('', null),
      becomeDoctorContent: Joi.string().allow(''),
    })
  ),
  asyncHandler(settingsController.updateSettings)
);

// Update only social media links (Admin only)
router.patch(
  '/social-media',
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      instagram: Joi.string().uri().allow(''),
      telegram: Joi.string().uri().allow(''),
      whatsapp: Joi.string().allow(''),
      twitter: Joi.string().uri().allow(''),
      linkedin: Joi.string().uri().allow(''),
      facebook: Joi.string().uri().allow(''),
      youtube: Joi.string().uri().allow(''),
    })
  ),
  asyncHandler(settingsController.updateSocialMedia)
);

module.exports = router;

