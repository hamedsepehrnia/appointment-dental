const express = require("express");
const router = express.Router();
const Joi = require("joi");
const syncController = require("../controllers/syncController");
const { validate } = require("../middlewares/validation");
const asyncHandler = require("../middlewares/asyncHandler");

// ==================== اسکیماهای اعتبارسنجی ====================

const syncAppointmentsSchema = Joi.object({
  appointments: Joi.array()
    .items(
      Joi.object({
        // فیلدهای ضروری برای اشغال زمان
        externalId: Joi.string().required().messages({
          "any.required": "شناسه خارجی الزامی است",
        }),
        clinicId: Joi.string().uuid().required().messages({
          "any.required": "شناسه کلینیک الزامی است",
          "string.guid": "شناسه کلینیک نامعتبر است",
        }),
        appointmentDate: Joi.date().iso().required().messages({
          "any.required": "تاریخ و ساعت نوبت الزامی است",
          "date.format": "فرمت تاریخ نامعتبر است",
        }),
        durationMinutes: Joi.number().integer().min(10).max(480).required().messages({
          "any.required": "مدت زمان نوبت الزامی است",
          "number.min": "مدت زمان نوبت حداقل ۱۰ دقیقه است",
          "number.max": "مدت زمان نوبت حداکثر ۸ ساعت است",
        }),
        // فیلدهای اختیاری (برای اطلاعات اضافی)
        doctorId: Joi.string().uuid().allow(null, "").optional().messages({
          "string.guid": "شناسه پزشک نامعتبر است",
        }),
        patientName: Joi.string().max(100).allow(null, "").optional(),
        patientPhone: Joi.string().max(15).allow(null, "").optional(),
        nationalCode: Joi.string().length(10).pattern(/^\d+$/).allow(null, "").optional(),
        notes: Joi.string().max(500).allow(null, "").optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "حداقل یک نوبت باید ارسال شود",
      "any.required": "لیست نوبت‌ها الزامی است",
    }),
});

const deleteAppointmentSchema = Joi.object({
  externalId: Joi.string().required().messages({
    "any.required": "شناسه خارجی الزامی است",
  }),
});

// ==================== Middleware احراز هویت با API Key ====================

const authenticateSyncApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers["x-sync-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API Key الزامی است",
    });
  }

  const prisma = require("../config/database");
  
  // Find API key in the new SyncApiKey model
  const syncApiKey = await prisma.syncApiKey.findUnique({
    where: { apiKey: apiKey },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  });

  if (!syncApiKey) {
    return res.status(401).json({
      success: false,
      error: "API Key نامعتبر است",
    });
  }

  if (!syncApiKey.isActive) {
    return res.status(401).json({
      success: false,
      error: "API Key غیرفعال است",
    });
  }

  // Update last used time
  await prisma.syncApiKey.update({
    where: { id: syncApiKey.id },
    data: { lastUsedAt: new Date() },
  });

  // Attach API key info to request for use in controllers
  req.syncApiKey = {
    id: syncApiKey.id,
    name: syncApiKey.name,
    clinicId: syncApiKey.clinicId,
    clinic: syncApiKey.clinic,
  };

  next();
});

// ==================== روت‌ها ====================

/**
 * @route   POST /api/sync/appointments
 * @desc    سینک نوبت‌های عمل از نرم‌افزار آفلاین
 * @access  API Key Required
 */
router.post(
  "/appointments",
  authenticateSyncApiKey,
  validate(syncAppointmentsSchema),
  asyncHandler(syncController.syncAppointments)
);

/**
 * @route   DELETE /api/sync/appointments
 * @desc    حذف نوبت عمل از سرور
 * @access  API Key Required
 */
router.delete(
  "/appointments",
  authenticateSyncApiKey,
  validate(deleteAppointmentSchema),
  asyncHandler(syncController.deleteAppointment)
);

/**
 * @route   GET /api/sync/status
 * @desc    بررسی وضعیت اتصال و تنظیمات
 * @access  API Key Required
 */
router.get(
  "/status",
  authenticateSyncApiKey,
  asyncHandler(syncController.getStatus)
);

/**
 * @route   GET /api/sync/conflicts
 * @desc    دریافت تداخل‌های موجود
 * @access  API Key Required
 */
router.get(
  "/conflicts",
  authenticateSyncApiKey,
  asyncHandler(syncController.getConflicts)
);

module.exports = router;

