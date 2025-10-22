const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const smsService = require('../services/smsService');
const { generateOtp, formatPhoneNumber, generateRandomPassword } = require('../utils/helpers');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Request OTP code
 */
const requestOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Generate OTP
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);

  // Save OTP to database
  await prisma.otpCode.create({
    data: {
      phoneNumber: formattedPhone,
      code,
      expiresAt,
    },
  });

  // Send SMS
  const smsResult = await smsService.sendOtp(formattedPhone, code);

  if (!smsResult.success) {
    throw new AppError('خطا در ارسال پیامک', 500);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
    select: { id: true, firstName: true, lastName: true },
  });

  res.json({
    success: true,
    message: 'کد تایید ارسال شد',
    data: {
      isNewUser: !user,
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60, // seconds
    },
  });
};

/**
 * Verify OTP and login/register
 */
const verifyOtp = async (req, res) => {
  const { phoneNumber, code, firstName, lastName } = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Find valid OTP
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: formattedPhone,
      code,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new AppError('کد تایید نامعتبر یا منقضی شده است', 400);
  }

  // Mark OTP as verified
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
  });

  // If new user, create account
  if (!user) {
    if (!firstName || !lastName) {
      throw new AppError('نام و نام خانوادگی برای ثبت نام الزامی است', 400);
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        phoneNumber: formattedPhone,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'PATIENT',
      },
    });
  }

  // Create session
  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.phoneNumber = user.phoneNumber;

  res.json({
    success: true,
    message: user ? 'ورود موفقیت‌آمیز بود' : 'ثبت نام موفقیت‌آمیز بود',
    data: {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
};

/**
 * Logout
 */
const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      throw new AppError('خطا در خروج از حساب کاربری', 500);
    }
    res.clearCookie('dental.sid');
    res.json({
      success: true,
      message: 'خروج موفقیت‌آمیز بود',
    });
  });
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      nationalCode: true,
      address: true,
      gender: true,
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('کاربر یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  const { firstName, lastName, nationalCode, address, gender } = req.body;

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(nationalCode && { nationalCode }),
      ...(address && { address }),
      ...(gender && { gender }),
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      nationalCode: true,
      address: true,
      gender: true,
    },
  });

  res.json({
    success: true,
    message: 'پروفایل با موفقیت به‌روزرسانی شد',
    data: { user },
  });
};

module.exports = {
  requestOtp,
  verifyOtp,
  logout,
  getCurrentUser,
  updateProfile,
};

