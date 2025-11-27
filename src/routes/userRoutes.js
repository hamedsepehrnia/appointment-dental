const express = require('express');
const router = express.Router();
const Joi = require('joi');
const userController = require('../controllers/userController');
const { isAdmin } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');
const { csrfProtection } = require('../middlewares/csrf');

// Get all users (Admin only)
router.get(
  '/',
  isAdmin,
  validate(
    schemas.pagination.keys({
      role: Joi.string().valid('ADMIN', 'SECRETARY', 'PATIENT'),
      search: Joi.string().allow(''),
      clinicId: Joi.string().uuid(),
    }),
    'query'
  ),
  asyncHandler(userController.getUsers)
);

// Get single user by ID (Admin only)
router.get(
  '/:id',
  isAdmin,
  validate(
    Joi.object({
      id: schemas.id,
    }),
    'params'
  ),
  asyncHandler(userController.getUser)
);

// Create user (Admin only)
router.post(
  '/',
  isAdmin,
  csrfProtection,
  upload.single('profileImage'),
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
      firstName: Joi.string().required().min(2).max(50).messages({
        'any.required': 'نام الزامی است',
        'string.min': 'نام باید حداقل ۲ کاراکتر باشد',
        'string.max': 'نام باید حداکثر ۵۰ کاراکتر باشد',
      }),
      lastName: Joi.string().required().min(2).max(50).messages({
        'any.required': 'نام خانوادگی الزامی است',
        'string.min': 'نام خانوادگی باید حداقل ۲ کاراکتر باشد',
        'string.max': 'نام خانوادگی باید حداکثر ۵۰ کاراکتر باشد',
      }),
      password: Joi.string().required().min(8).messages({
        'any.required': 'رمز عبور الزامی است',
        'string.min': 'رمز عبور باید حداقل ۸ کاراکتر باشد',
      }),
      role: Joi.string().valid('ADMIN', 'SECRETARY', 'PATIENT').default('PATIENT'),
      nationalCode: schemas.nationalCode.optional().allow(null).allow(''),
      address: Joi.string().max(500).allow(''),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
      clinicId: Joi.string().uuid().allow(null).allow(''),
    })
  ),
  asyncHandler(userController.createUser)
);

// Update user (Admin only)
router.patch(
  '/:id',
  isAdmin,
  csrfProtection,
  upload.single('profileImage'),
  validate(
    Joi.object({
      id: schemas.id,
    }),
    'params'
  ),
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber.optional(),
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      password: Joi.string().min(8),
      role: Joi.string().valid('ADMIN', 'SECRETARY', 'PATIENT'),
      nationalCode: schemas.nationalCode.optional().allow(null).allow(''),
      address: Joi.string().max(500).allow(''),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
      clinicId: Joi.string().uuid().allow(null).allow(''),
    })
  ),
  asyncHandler(userController.updateUser)
);

// Delete user (Admin only)
router.delete(
  '/:id',
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      id: schemas.id,
    }),
    'params'
  ),
  asyncHandler(userController.deleteUser)
);

module.exports = router;

