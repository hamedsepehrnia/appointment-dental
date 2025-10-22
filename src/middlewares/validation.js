const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new AppError(errorMessage, 400);
    }

    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Phone number validation (Iranian format)
  phoneNumber: Joi.string()
    .pattern(/^(\+98|0)?9\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'شماره تلفن نامعتبر است',
      'any.required': 'شماره تلفن الزامی است',
    }),

  // OTP code validation
  otpCode: Joi.string()
    .length(5)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': 'کد تایید باید ۵ رقم باشد',
      'string.pattern.base': 'کد تایید فقط باید شامل اعداد باشد',
      'any.required': 'کد تایید الزامی است',
    }),

  // National code validation
  nationalCode: Joi.string()
    .length(10)
    .pattern(/^\d+$/)
    .messages({
      'string.length': 'کد ملی باید ۱۰ رقم باشد',
      'string.pattern.base': 'کد ملی فقط باید شامل اعداد باشد',
    }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  // ID validation (UUID)
  id: Joi.string().uuid().required().messages({
    'string.guid': 'شناسه نامعتبر است',
    'any.required': 'شناسه الزامی است',
  }),
};

module.exports = {
  validate,
  schemas,
};

