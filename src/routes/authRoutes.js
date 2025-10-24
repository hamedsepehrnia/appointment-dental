const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const asyncHandler = require('../middlewares/asyncHandler');

// Login with password (Admin/Secretary only)
router.post(
  '/login',
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
      password: Joi.string().required().messages({
        'any.required': 'رمز عبور الزامی است',
      }),
    })
  ),
  asyncHandler(authController.loginWithPassword)
);

// Request OTP
router.post(
  '/request-otp',
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
    })
  ),
  asyncHandler(authController.requestOtp)
);

// Verify OTP and login/register
router.post(
  '/verify-otp',
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
      code: schemas.otpCode,
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
    })
  ),
  asyncHandler(authController.verifyOtp)
);

// Logout
router.post('/logout', isAuthenticated, asyncHandler(authController.logout));

// Get current user
router.get('/me', isAuthenticated, asyncHandler(authController.getCurrentUser));

// Update profile
router.patch(
  '/me',
  isAuthenticated,
  validate(
    Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      nationalCode: schemas.nationalCode,
      address: Joi.string().max(500),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    })
  ),
  asyncHandler(authController.updateProfile)
);

module.exports = router;

