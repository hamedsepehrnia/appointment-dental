const { AppError } = require('./errorHandler');

/**
 * Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    throw new AppError('لطفاً ابتدا وارد شوید', 401);
  }
  next();
};

/**
 * Check user role
 * @param  {...string} roles - Allowed roles
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      throw new AppError('لطفاً ابتدا وارد شوید', 401);
    }

    if (!roles.includes(req.session.userRole)) {
      throw new AppError('شما دسترسی لازم را ندارید', 403);
    }

    next();
  };
};

/**
 * Check if user is admin or secretary
 */
const isAdminOrSecretary = hasRole('ADMIN', 'SECRETARY');

/**
 * Check if user is admin
 */
const isAdmin = hasRole('ADMIN');

/**
 * Check if user is patient
 */
const isPatient = hasRole('PATIENT');

module.exports = {
  isAuthenticated,
  hasRole,
  isAdminOrSecretary,
  isAdmin,
  isPatient,
};

