const csrf = require('csrf');
const { AppError } = require('./errorHandler');

const tokens = new csrf();

/**
 * CSRF Protection Middleware
 * Should be used before routes that modify data
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from header
  const token = req.get('X-CSRF-Token') || req.get('x-csrf-token');
  
  if (!token) {
    throw new AppError('CSRF token missing', 403);
  }

  // Get secret from session
  const secret = req.session.csrfSecret;

  if (!secret) {
    throw new AppError('CSRF session missing. Please get a new token.', 403);
  }

  // Verify token
  const isValid = tokens.verify(secret, token);

  if (!isValid) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};

/**
 * Generate CSRF token for response
 */
const generateCsrfToken = (req, res) => {
  // Generate or get existing secret
  let secret = req.session.csrfSecret;
  
  if (!secret) {
    secret = tokens.secretSync();
    req.session.csrfSecret = secret;
  }

  const token = tokens.create(secret);
  return token;
};

module.exports = {
  csrfProtection,
  generateCsrfToken,
};
