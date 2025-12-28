const express = require('express');
const router = express.Router();
const Joi = require('joi');
const galleryController = require('../controllers/galleryController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all gallery images (published only for public)
router.get(
  '/',
  validate(
    schemas.pagination.keys({
      published: Joi.string().valid('true', 'false'),
    }),
    'query'
  ),
  asyncHandler(galleryController.getGalleryImages)
);

// Get single gallery image (public)
router.get('/:id', asyncHandler(galleryController.getGalleryImage));

// Upload image to gallery (Admin/Secretary)
router.post(
  '/',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('galleryImage'),
  validate(
    Joi.object({
      title: Joi.string().max(200).allow(''),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.string().valid('true', 'false'),
    })
  ),
  asyncHandler(galleryController.uploadImage)
);

// Bulk upload images to gallery (Admin/Secretary)
router.post(
  '/bulk',
  isAdminOrSecretary,
  csrfProtection,
  upload.array('galleryImages', 50), // Allow up to 50 images
  validate(
    Joi.object({
      published: Joi.string().valid('true', 'false'),
    })
  ),
  asyncHandler(galleryController.bulkUploadImages)
);

// Update gallery image (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  csrfProtection,
  upload.single('galleryImage'),
  validate(
    Joi.object({
      title: Joi.string().max(200).allow(''),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.string().valid('true', 'false'),
      removeGalleryImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(galleryController.updateImage)
);

// Delete gallery image (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, csrfProtection, asyncHandler(galleryController.deleteImage));

module.exports = router;

