const logger = require('../utils/logger');

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Log unhandled errors in async handlers
    logger.error('Unhandled error in async handler', {
      url: req.originalUrl || req.url,
      method: req.method,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code
      }
    });
    next(err);
  });
};

module.exports = asyncHandler;

