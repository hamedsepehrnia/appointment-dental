const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const logController = require('../controllers/logController');

/**
 * @route   GET /api/logs
 * @desc    دریافت لاگ‌های اخیر (فقط Admin)
 * @access  Admin
 * @query   type - نوع لاگ (error, combined, exceptions, rejections)
 * @query   lines - تعداد خطوط (پیش‌فرض: 100)
 */
router.get(
  '/',
  isAdmin,
  asyncHandler(logController.getLogs)
);

/**
 * @route   GET /api/logs/info
 * @desc    دریافت اطلاعات فایل‌های لاگ (فقط Admin)
 * @access  Admin
 */
router.get(
  '/info',
  isAdmin,
  asyncHandler(logController.getLogInfo)
);

module.exports = router;

