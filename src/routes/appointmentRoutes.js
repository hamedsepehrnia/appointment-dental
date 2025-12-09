const express = require("express");
const router = express.Router();
const Joi = require("joi");
const appointmentController = require("../controllers/appointmentController");
const { isAuthenticated, isAdminOrSecretary, isAdmin } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validation");
const asyncHandler = require("../middlewares/asyncHandler");
const { csrfProtection } = require("../middlewares/csrf");

// ==================== اسکیماهای اعتبارسنجی ====================

const createAppointmentSchema = Joi.object({
  clinicId: Joi.string().uuid().required().messages({
    "any.required": "انتخاب کلینیک الزامی است",
    "string.guid": "شناسه کلینیک نامعتبر است",
  }),
  doctorId: Joi.string().uuid().allow(null, "").optional().messages({
    "string.guid": "شناسه پزشک نامعتبر است",
  }),
  appointmentDate: Joi.date().iso().required().messages({
    "any.required": "تاریخ و ساعت نوبت الزامی است",
    "date.format": "فرمت تاریخ نامعتبر است",
  }),
  patientName: Joi.string().max(100).allow(null, "").optional().messages({
    "string.max": "نام مراجع نباید بیشتر از ۱۰۰ کاراکتر باشد",
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.max": "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد",
  }),
});

const updateAppointmentSchema = Joi.object({
  appointmentDate: Joi.date().iso().optional().messages({
    "date.format": "فرمت تاریخ نامعتبر است",
  }),
  doctorId: Joi.string().uuid().allow(null, "").optional().messages({
    "string.guid": "شناسه پزشک نامعتبر است",
  }),
  patientName: Joi.string().max(100).allow(null, "").optional().messages({
    "string.max": "نام مراجع نباید بیشتر از ۱۰۰ کاراکتر باشد",
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.max": "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد",
  }),
});

const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().max(300).allow(null, "").optional().messages({
    "string.max": "دلیل لغو نباید بیشتر از ۳۰۰ کاراکتر باشد",
  }),
});

const listAppointmentsSchema = schemas.pagination.keys({
  status: Joi.string().valid("PENDING", "APPROVED_BY_USER", "CANCELED", "FINAL_APPROVED").optional(),
  clinicId: Joi.string().uuid().optional(),
  doctorId: Joi.string().uuid().optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  search: Joi.string().allow("").optional(),
});

// ==================== روت‌ها ====================

/**
 * @route   GET /api/appointments/stats
 * @desc    آمار نوبت‌ها (داشبورد)
 * @access  Admin/Secretary
 */
router.get(
  "/stats",
  isAdminOrSecretary,
  asyncHandler(appointmentController.getAppointmentStats)
);

/**
 * @route   GET /api/appointments/my
 * @desc    نوبت‌های کاربر جاری
 * @access  Authenticated
 */
router.get(
  "/my",
  isAuthenticated,
  validate(
    schemas.pagination.keys({
      status: Joi.string().valid("PENDING", "APPROVED_BY_USER", "CANCELED", "FINAL_APPROVED").optional(),
    }),
    "query"
  ),
  asyncHandler(appointmentController.getMyAppointments)
);

/**
 * @route   GET /api/appointments
 * @desc    لیست همه نوبت‌ها
 * @access  Admin/Secretary
 */
router.get(
  "/",
  isAdminOrSecretary,
  validate(listAppointmentsSchema, "query"),
  asyncHandler(appointmentController.getAppointments)
);

/**
 * @route   GET /api/appointments/:id
 * @desc    دریافت یک نوبت
 * @access  Authenticated (Owner/Admin/Secretary)
 */
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(appointmentController.getAppointment)
);

/**
 * @route   POST /api/appointments
 * @desc    ایجاد نوبت جدید
 * @access  Authenticated
 */
router.post(
  "/",
  isAuthenticated,
  csrfProtection,
  validate(createAppointmentSchema),
  asyncHandler(appointmentController.createAppointment)
);

/**
 * @route   PATCH /api/appointments/:id
 * @desc    به‌روزرسانی نوبت
 * @access  Admin/Secretary
 */
router.patch(
  "/:id",
  isAdminOrSecretary,
  csrfProtection,
  validate(updateAppointmentSchema),
  asyncHandler(appointmentController.updateAppointment)
);

/**
 * @route   PATCH /api/appointments/:id/approve
 * @desc    تأیید نوبت
 * @access  Admin/Secretary
 */
router.patch(
  "/:id/approve",
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(appointmentController.approveAppointment)
);

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    لغو نوبت
 * @access  Authenticated (Owner/Admin/Secretary)
 */
router.patch(
  "/:id/cancel",
  isAuthenticated,
  csrfProtection,
  validate(cancelAppointmentSchema),
  asyncHandler(appointmentController.cancelAppointment)
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    حذف نوبت
 * @access  Admin only
 */
router.delete(
  "/:id",
  isAdmin,
  csrfProtection,
  asyncHandler(appointmentController.deleteAppointment)
);

module.exports = router;

