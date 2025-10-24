const express = require('express');
const router = express.Router();
const Joi = require('joi');
const galleryController = require('../controllers/galleryController');
const { isAdminOrSecretary } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');

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

// Update gallery image (Admin/Secretary)
router.patch(
  '/:id',
  isAdminOrSecretary,
  upload.single('galleryImage'),
  validate(
    Joi.object({
      title: Joi.string().max(200).allow(''),
      description: Joi.string().allow(''),
      order: Joi.number().integer().min(0),
      published: Joi.string().valid('true', 'false'),
    })
  ),
  asyncHandler(galleryController.updateImage)
);

// Delete gallery image (Admin/Secretary)
router.delete('/:id', isAdminOrSecretary, asyncHandler(galleryController.deleteImage));

// Reorder gallery images (Admin/Secretary)
router.post(
  '/reorder',
  isAdminOrSecretary,
  validate(
    Joi.object({
      images: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().uuid().required(),
            order: Joi.number().integer().min(0).required(),
          })
        )
        .min(1)
        .required(),
    })
  ),
  asyncHandler(galleryController.reorderImages)
);

module.exports = router;

