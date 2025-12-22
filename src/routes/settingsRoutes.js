const express = require("express");
const router = express.Router();
const Joi = require("joi");
const settingsController = require("../controllers/settingsController");
const { isAdmin } = require("../middlewares/auth");
const { validate } = require("../middlewares/validation");
const asyncHandler = require("../middlewares/asyncHandler");
const { csrfProtection } = require("../middlewares/csrf");
const upload = require("../middlewares/upload");

// Get all settings (public)
router.get("/", asyncHandler(settingsController.getSettings));

// Get only social media links (public)
router.get("/social-media", asyncHandler(settingsController.getSocialMedia));

// Update all settings (Admin only)
router.patch(
  "/",
  isAdmin,
  csrfProtection,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "aboutUsImage", maxCount: 1 },
    { name: "aboutUsVideo", maxCount: 1 },
    { name: "contactUsImage", maxCount: 1 },
    { name: "contactUsVideo", maxCount: 1 },
  ]),
  validate(
    Joi.object({
      siteName: Joi.string(),
      siteTitle: Joi.string(),
      description: Joi.string().allow(""),
      logo: Joi.string().allow(""),
      email: Joi.string().email().allow(""),
      phoneNumber: Joi.string().allow(""),
      address: Joi.string().allow(""),
      instagram: Joi.string().uri().allow(""),
      telegram: Joi.string().uri().allow(""),
      whatsapp: Joi.string().allow(""),
      twitter: Joi.string().uri().allow(""),
      linkedin: Joi.string().uri().allow(""),
      facebook: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
      workingHours: Joi.string().allow(""),
      aboutUsImage: Joi.string().allow("", null),
      aboutUsVideo: Joi.string().allow("", null),
      aboutUsContent: Joi.string().allow(""),
      contactUsImage: Joi.string().allow("", null),
      contactUsVideo: Joi.string().allow("", null),
      becomeDoctorContent: Joi.string().allow(""),
      removeLogo: Joi.string().valid("true", "false").optional(),
      removeAboutUsImage: Joi.string().valid("true", "false").optional(),
      removeContactUsImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(settingsController.updateSettings)
);

// Update only social media links (Admin only)
router.patch(
  "/social-media",
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      instagram: Joi.string().uri().allow(""),
      telegram: Joi.string().uri().allow(""),
      whatsapp: Joi.string().allow(""),
      twitter: Joi.string().uri().allow(""),
      linkedin: Joi.string().uri().allow(""),
      facebook: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
    })
  ),
  asyncHandler(settingsController.updateSocialMedia)
);

// ==================== تنظیمات نوبت‌دهی ====================

// Get appointment settings (Admin only)
router.get(
  "/appointments",
  isAdmin,
  asyncHandler(settingsController.getAppointmentSettings)
);

// Update appointment settings (Admin only)
router.patch(
  "/appointments",
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      appointmentMode: Joi.string().valid("SIMPLE", "ADVANCED").optional(),
      maxAppointmentsPerHour: Joi.number().integer().min(1).max(100).optional(),
    })
  ),
  asyncHandler(settingsController.updateAppointmentSettings)
);

// ==================== مدیریت کلیدهای API سینک ====================

// Create new Sync API Key (Admin only)
router.post(
  "/appointments/api-keys",
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        "any.required": "نام کلید API الزامی است",
        "string.min": "نام کلید API نمی‌تواند خالی باشد",
      }),
      clinicId: Joi.string().uuid().allow(null, "").optional().messages({
        "string.guid": "شناسه کلینیک نامعتبر است",
      }),
    })
  ),
  asyncHandler(settingsController.createSyncApiKey)
);

// Delete Sync API Key (Admin only)
router.delete(
  "/appointments/api-keys/:id",
  isAdmin,
  csrfProtection,
  asyncHandler(settingsController.deleteSyncApiKey)
);

// Toggle Sync API Key active status (Admin only)
router.patch(
  "/appointments/api-keys/:id/toggle",
  isAdmin,
  csrfProtection,
  asyncHandler(settingsController.toggleSyncApiKey)
);

// ==================== تنظیمات نوتیفیکیشن ====================

// Get notification settings (Admin only)
router.get(
  "/notifications",
  isAdmin,
  asyncHandler(settingsController.getNotificationSettings)
);

// Update notification settings (Admin only)
router.patch(
  "/notifications",
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      method: Joi.string().valid("SMS", "EITAA", "BOTH").optional().messages({
        "any.only": "روش ارسال باید یکی از SMS، EITAA یا BOTH باشد",
      }),
      eitaaApiToken: Joi.string().allow(null, "").optional(),
    })
  ),
  asyncHandler(settingsController.updateNotificationSettings)
);

// Test Eitaa connection (Admin only)
router.post(
  "/notifications/test-eitaa",
  isAdmin,
  csrfProtection,
  validate(
    Joi.object({
      token: Joi.string().required().messages({
        "any.required": "توکن API ایتا الزامی است",
      }),
      chatId: Joi.string().required().messages({
        "any.required": "شناسه کانال/گروه ایتا الزامی است",
      }),
    })
  ),
  asyncHandler(settingsController.testEitaaConnection)
);

module.exports = router;
