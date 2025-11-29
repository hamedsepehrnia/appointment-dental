const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const smsService = require("../services/smsService");
const {
  generateOtp,
  formatPhoneNumber,
  generateRandomPassword,
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
  // Even if user doesn't exist, we compare against a dummy hash
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
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || 300); // Default: 300 seconds (5 minutes)
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);

  // Check if user exists before sending SMS
  const user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
    select: { id: true, firstName: true, lastName: true },
  });

  // Save OTP to database
  await prisma.otpCode.create({
    data: {
      phoneNumber: formattedPhone,
      code,
      expiresAt,
    },
  });

  // Prepare SMS message based on user existence
  let smsMessage;
  if (user) {
    smsMessage = `سلام ${user.firstName} عزیز، به سامانه کلینیک دندان پزشکی طاها خوش آمدید، کد تایید شما: ${code}`;
  } else {
    smsMessage = `به سامانه نوبت دهی کلینیک طاها خوش آمدید. کد ورود شما: ${code}`;
  }

  // Send SMS
  const smsResult = await smsService.sendSimpleSms(formattedPhone, smsMessage);

  if (!smsResult.success) {
    throw new AppError("خطا در ارسال پیامک", 500);
  }

  res.json({
    success: true,
    message: "کد تایید ارسال شد",
    data: {
      isNewUser: !user,
      expiresIn: expirySeconds, // seconds
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
      },
    });
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

  // Get current user to check for existing profile image
  const currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { profileImage: true },
  });

  if (!currentUser) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  // Prepare update data
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (nationalCode !== undefined)
    updateData.nationalCode = nationalCode || null;
  if (address !== undefined) updateData.address = address || null;
  if (gender) updateData.gender = gender;

  // Handle profile image removal
  if (req.body.removeProfileImage === "true") {
    // Delete old image if exists
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
  }
  // Handle profile image upload
  else if (req.file) {
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
