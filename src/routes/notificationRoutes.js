const express = require("express");
const router = express.Router();
const Joi = require("joi");
const notificationController = require("../controllers/notificationController");
const { isAdminOrSecretary } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validation");
const asyncHandler = require("../middlewares/asyncHandler");
const { csrfProtection } = require("../middlewares/csrf");

/**
 * @route   GET /api/notifications
 * @desc    لیست نوتیفیکیشن‌ها
 * @access  Admin/Secretary
 */
router.get(
  "/",
  isAdminOrSecretary,
  validate(
    schemas.pagination.keys({
      read: Joi.string().valid("true", "false").optional(),
      type: Joi.string().optional(),
    }),
    "query"
  ),
  asyncHandler(notificationController.getNotifications)
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    تعداد نوتیفیکیشن‌های خوانده نشده
 * @access  Admin/Secretary
 */
router.get(
  "/unread-count",
  isAdminOrSecretary,
  asyncHandler(notificationController.getUnreadCount)
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    خواندن همه نوتیفیکیشن‌ها
 * @access  Admin/Secretary
 */
router.patch(
  "/read-all",
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(notificationController.markAllAsRead)
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    خواندن یک نوتیفیکیشن
 * @access  Admin/Secretary
 */
router.patch(
  "/:id/read",
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(notificationController.markAsRead)
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    حذف نوتیفیکیشن
 * @access  Admin/Secretary
 */
router.delete(
  "/:id",
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(notificationController.deleteNotification)
);

module.exports = router;

