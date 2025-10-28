const crypto = require('crypto');

/**
 * Generate CSRF token
 */
const generateCsrfToken = (req, res, next) => {
  if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/health')) {
    return next();
  }

  // Generate token if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make token available in response
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

/**
 * Validate CSRF token
 * Only for non-GET requests and non-auth endpoints
 */
const validateCsrfToken = (req, res, next) => {
  // Skip for GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Skip for auth endpoints (OTP, login, etc.)
  if (
    req.path.includes('/auth/request-otp') ||
    req.path.includes('/auth/verify-otp') ||
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/logout')
  ) {
    return next();
  }

  // Skip for Swagger endpoints
  if (req.path.includes('/api-docs') || req.path.includes('/swagger')) {
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body.csrfToken;
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed. Please refresh the page.',
    });
  }

  next();
};

/**
 * Get CSRF token endpoint
 */
const getCsrfToken = (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.json({
    success: true,
    data: {
      csrfToken: req.session.csrfToken,
    },
  });
};

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  getCsrfToken,
};

