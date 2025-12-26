/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

