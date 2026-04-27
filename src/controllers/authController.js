const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const smsService = require("../services/smsService");
const {
  generateOtp,
  formatPhoneNumber,
  generateRandomPassword,
  fixNameForSms,
} = require("../utils/helpers");
const { AppError } = require("../middlewares/errorHandler");
const { generateCsrfToken } = require("../middlewares/csrf");
const path = require("path");
const fs = require("fs").promises;

/**
 * Login with password (Admin/Secretary only)
 * Fixes timing attack by always comparing password
 */
const loginWithPassword = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Find user
  const user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
  });

  // Always perform bcrypt comparison to prevent timing attacks
  const dummyHash = "$2a$10$dummy.hash.to.prevent.timing.attack.vulnerability";
  const compareHash = user ? user.password : dummyHash;
  const isPasswordValid = await bcrypt.compare(password, compareHash);

  // Validate user and password after bcrypt comparison
  if (!user || !isPasswordValid) {
    throw new AppError("شماره تلفن یا رمز عبور اشتباه است", 401);
  }

  // Check if user is admin or secretary
  if (user.role === "PATIENT") {
    throw new AppError("این روش ورود فقط برای مدیر و منشی است", 403);
  }

  // Create session
  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.phoneNumber = user.phoneNumber;

  res.json({
    success: true,
    message: "ورود موفقیت‌آمیز بود",
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
 * Request OTP code
 * Prevents OTP spam by checking for recent valid OTPs
 */
const requestOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Check for recent unverified OTP (within last 1 minute)
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: formattedPhone,
      verified: false,
      expiresAt: { gte: new Date() },
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last 1 minute
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const remainingTime = Math.ceil(
      (recentOtp.expiresAt.getTime() - Date.now()) / 1000
    );
    const remainingMinutes = Math.ceil(remainingTime / 60);
    throw new AppError(
      `کد تأیید قبلاً ارسال شده است. لطفاً ${remainingMinutes} دقیقه صبر کنید.`,
      429
    );
  }

  // Generate OTP
  const code = generateOtp();
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || 300);
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);

  // Check if user exists before sending SMS
  const user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
    select: { id: true, firstName: true, lastName: true },
  });

  // Save OTP to database (before sending SMS)
  await prisma.otpCode.create({
    data: {
      phoneNumber: formattedPhone,
      code,
      expiresAt,
    },
  });

  // Send SMS using template-based approach
  const otpTemplateID = parseInt(process.env.MSGWAY_OTP_TEMPLATE_ID || '21385');
  
  let smsResult;
  
  if (otpTemplateID > 0) {
    // Use template-based OTP with only code as parameter
    smsResult = await smsService.sendOtp(
      formattedPhone, 
      code, 
      {
        templateID: otpTemplateID,
        expireTime: expirySeconds
      }
    );
  } else {
    // Fallback: Use simple template
    smsResult = await smsService.sendTemplatedSms(
      formattedPhone,
      parseInt(process.env.MSGWAY_TEMPLATE_ID || '1'),
      {
        params: [code],
        expireTime: expirySeconds
      }
    );
  }

  if (!smsResult.success) {
    console.error('SMS sending failed for OTP:', smsResult.error);

    const smsFailMode = process.env.SMS_FAIL_MODE || 'allow';

    if (smsFailMode === 'strict') {
      throw new AppError("خطا در ارسال پیامک", 500);
    }

    // Return success but indicate SMS not sent
    const responseData = {
      isNewUser: !user,
      expiresIn: expirySeconds,
      smsSent: false,
    };

    if (process.env.NODE_ENV !== 'production' || process.env.SHOW_SMS_ERROR_IN_RESPONSE === 'true') {
      responseData.smsError = smsResult.error;
    }

    return res.json({
      success: true,
      message: "کد تأیید ساخته شد اما ارسال پیامک با خطا مواجه شد. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
      data: responseData,
    });
  }

  res.json({
    success: true,
    message: "کد تایید ارسال شد",
    data: {
      isNewUser: !user,
      expiresIn: expirySeconds,
      smsSent: true,
      referenceID: smsResult.data?.referenceID
    },
  });
};

/**
 * Verify OTP and login/register
 */
const verifyOtp = async (req, res) => {
  const { phoneNumber, code, firstName, lastName, gender } = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Find valid OTP
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: formattedPhone,
      code,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("کد تایید نامعتبر یا منقضی شده است", 400);
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
      throw new AppError("نام و نام خانوادگی برای ثبت نام الزامی است", 400);
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        phoneNumber: formattedPhone,
        firstName,
        lastName,
        password: hashedPassword,
        role: "PATIENT",
        ...(gender && { gender }),
        profileImage: null,
      },
    });

    // Send welcome SMS with account info
    try {
      const welcomeTemplateID = parseInt(process.env.MSGWAY_WELCOME_TEMPLATE_ID || '0');
      if (welcomeTemplateID > 0) {
        await smsService.sendTemplatedSms(formattedPhone, welcomeTemplateID, {
          params: [firstName, lastName, formattedPhone, randomPassword],
        });
      }
    } catch (welcomeError) {
      console.error('Welcome SMS failed:', welcomeError);
      // Don't fail registration if welcome SMS fails
    }
  }

  // Create session
  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.phoneNumber = user.phoneNumber;

  res.json({
    success: true,
    message: user ? "ورود موفقیت‌آمیز بود" : "ثبت نام موفقیت‌آمیز بود",
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
      throw new AppError("خطا در خروج از حساب کاربری", 500);
    }
    res.clearCookie("dental.sid");
    res.json({
      success: true,
      message: "خروج موفقیت‌آمیز بود",
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
      profileImage: true,
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("کاربر یافت نشد", 404);
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

  const currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { profileImage: true },
  });

  if (!currentUser) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (nationalCode !== undefined) updateData.nationalCode = nationalCode || null;
  if (address !== undefined) updateData.address = address || null;
  if (gender) updateData.gender = gender;

  // Handle profile image removal
  if (req.body.removeProfileImage === "true") {
    if (currentUser.profileImage) {
      const imagePath = currentUser.profileImage.startsWith("/")
        ? currentUser.profileImage.slice(1)
        : currentUser.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    updateData.profileImage = null;
  } else if (req.file) {
    // Delete old image if exists
    if (currentUser.profileImage) {
      const imagePath = currentUser.profileImage.startsWith("/")
        ? currentUser.profileImage.slice(1)
        : currentUser.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }
    updateData.profileImage = `/uploads/users/${req.file.filename}`;
  }

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data: updateData,
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      nationalCode: true,
      address: true,
      gender: true,
      profileImage: true,
    },
  });

  res.json({
    success: true,
    message: "پروفایل با موفقیت به‌روزرسانی شد",
    data: { user },
  });
};

/**
 * Get CSRF token
 */
const getCsrfToken = async (req, res) => {
  const token = generateCsrfToken(req, res);

  res.json({
    success: true,
    data: {
      csrfToken: token,
    },
  });
};

module.exports = {
  loginWithPassword,
  requestOtp,
  verifyOtp,
  logout,
  getCurrentUser,
  updateProfile,
  getCsrfToken,
};