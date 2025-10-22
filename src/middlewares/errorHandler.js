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
  let statusCode = err.statusCode || 500;
  let message = err.message || 'خطای سرور';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'این مقدار قبلاً ثبت شده است';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'رکورد مورد نظر یافت نشد';
  } else if (err.code?.startsWith('P')) {
    statusCode = 400;
    message = 'خطا در عملیات دیتابیس';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'حجم فایل بیش از حد مجاز است';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'تعداد فایل‌ها بیش از حد مجاز است';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر مورد نظر یافت نشد',
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
};

