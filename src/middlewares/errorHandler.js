const logger = require('../utils/logger');

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Always log the error first (even if response was already sent)
  // This ensures we capture ALL errors, even if they're not properly handled
  try {
    logger.logError(err, req);
  } catch (logError) {
    // If logging itself fails, at least log to console
    console.error('Failed to log error:', logError);
    console.error('Original error:', err);
  }

  // If response was already sent, don't try to send again
  if (res.headersSent) {
    logger.warn('Error occurred but response was already sent', {
      url: req.originalUrl || req.url,
      method: req.method,
      error: err.message
    });
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "خطای ناشناخته پیش آمد";

  // Prisma errors
  if (err.code === "P2002") {
    statusCode = 409;
    message = "این مقدار قبلاً ثبت شده است";
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "رکورد مورد نظر یافت نشد";
  } else if (err.code?.startsWith("P")) {
    statusCode = 400;
    message = "خطا در عملیات دیتابیس";
    // Log Prisma error details
    logger.error('Prisma Error Details', {
      code: err.code,
      meta: err.meta,
      message: err.message
    });
  }

  // Database connection errors
  if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
    statusCode = 503;
    message = "خطا در اتصال به دیتابیس";
    logger.error('Database Connection Error', {
      code: err.code,
      message: err.message
    });
  }

  // Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "حجم فایل بیش از حد مجاز است";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "تعداد فایل‌ها بیش از حد مجاز است";
    }
  }

  // Joi validation errors
  if (err.isJoi || err.name === "ValidationError") {
    statusCode = 400;
    if (err.details && Array.isArray(err.details)) {
      message = err.details.map(d => d.message).join(', ');
    }
  }

  // Rate limit errors (429)
  if (statusCode === 429) {
    // Keep the original rate limit message
  }

  // Prepare response
  const response = {
    success: false,
    message,
  };

  // Only show stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.error = {
      name: err.name,
      code: err.code,
      message: err.message
    };
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "مسیر مورد نظر یافت نشد",
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
};
