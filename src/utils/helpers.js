/**
 * Generate random OTP code
 * @param {number} length - Length of OTP code (default: 5)
 * @returns {string} - Random OTP code
 */
const generateOtp = (length = 5) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Generate random password
 * @param {number} length - Length of password (default: 12)
 * @returns {string} - Random password
 */
const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

/**
 * Create slug from string (Persian and English support)
 * @param {string} text - Input text
 * @returns {string} - Slugified text
 */
const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Format phone number to standard format
 * @param {string} phoneNumber - Input phone number
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '98' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('09')) {
    cleaned = '98' + cleaned.substring(1);
  }
  
  return cleaned;
};

/**
 * Validate Iranian national code
 * @param {string} nationalCode - 10-digit Iranian national ID
 * @returns {boolean} - true if valid, false otherwise
 */
const validateNationalCode = (nationalCode) => {
  if (!/^\d{10}$/.test(nationalCode)) return false;

  const invalidCodes = [
    '0000000000', '1111111111', '2222222222',
    '3333333333', '4444444444', '5555555555',
    '6666666666', '7777777777', '8888888888',
    '9999999999',
  ];
  if (invalidCodes.includes(nationalCode)) return false;

  const check = Number(nationalCode[9]);
  const sum = [...nationalCode.slice(0, 9)]
    .reduce((acc, digit, i) => acc + Number(digit) * (10 - i), 0);

  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};


/**
 * Paginate results
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Skip and take values for Prisma
 */
const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

/**
 * Create pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  generateOtp,
  generateRandomPassword,
  createSlug,
  formatPhoneNumber,
  validateNationalCode,
  paginate,
  createPaginationMeta,
};

