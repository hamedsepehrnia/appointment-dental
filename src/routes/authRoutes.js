const express = require("express");
const router = express.Router();
const Joi = require("joi");
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validation");
const asyncHandler = require("../middlewares/asyncHandler");
const { csrfProtection } = require("../middlewares/csrf");
const upload = require("../middlewares/upload");

// Login with password (Admin/Secretary only)
router.post(
  "/login",
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
      password: Joi.string().required().min(8).messages({
        "any.required": "رمز عبور الزامی است",
        "string.min": "رمز عبور باید حداقل ۸ کاراکتر باشد",
      }),
    })
  ),
  asyncHandler(authController.loginWithPassword)
);

// Get CSRF Token (requires authentication)
router.get(
  "/csrf-token",
  isAuthenticated,
  asyncHandler(authController.getCsrfToken)
);

// Request OTP
router.post(
  "/request-otp",
  validate(
    Joi.object({
      phoneNumber: schemas.phoneNumber,
    })
  ),
  asyncHandler(authController.requestOtp)
);

// Verify OTP and login/register
router.post(
  "/verify-otp",
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
router.post(
  "/logout",
  isAuthenticated,
  csrfProtection,
  asyncHandler(authController.logout)
);

// Get current user
router.get("/me", isAuthenticated, asyncHandler(authController.getCurrentUser));

// Update profile
router.patch(
  "/me",
  isAuthenticated,
  csrfProtection,
  upload.single("profileImage"),
  validate(
    Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      nationalCode: schemas.nationalCode.optional().allow(null).allow(""),
      address: Joi.string().max(500).allow("").allow(null).optional(),
      gender: Joi.string().valid("MALE", "FEMALE", "OTHER"),
      removeProfileImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(authController.updateProfile)
);

module.exports = router;
