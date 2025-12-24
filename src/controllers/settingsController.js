const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { formatPhoneNumberOptional } = require("../utils/helpers");
const fs = require("fs").promises;
const path = require("path");

/**
 * Get site settings (public)
 */
const getSettings = async (req, res) => {
  let settings = await prisma.siteSettings.findFirst();

  // If no settings exist, create default ones
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        siteName: "Dental Clinic",
        siteTitle: "Professional Dental Care",
        description: "Your trusted dental care provider",
      },
    });
  }

  res.json({
    success: true,
    data: { settings },
  });
};

/**
 * Update site settings (Admin only)
 */
const updateSettings = async (req, res) => {
  const {
    siteName,
    siteTitle,
    description,
    logo,
    email,
    phoneNumber,
    address,
    instagram,
    telegram,
    eitaa,
    whatsapp,
    twitter,
    linkedin,
    facebook,
    youtube,
    workingHours,
    aboutUsImage,
    aboutUsVideo,
    aboutUsContent,
    contactUsImage,
    contactUsVideo,
    becomeDoctorContent,
    becomeNurseContent,
  } = req.body;

  // Get existing settings or create new one
  let settings = await prisma.siteSettings.findFirst();

  // Normalize phone number if provided
  const normalizedPhoneNumber =
    phoneNumber !== undefined
      ? formatPhoneNumberOptional(phoneNumber)
      : undefined;

  // Handle file uploads and removals (logo, aboutUsImage, contactUsImage, aboutUsVideo, contactUsVideo)
  let logoPath = undefined;
  let aboutUsImagePath = undefined;
  let contactUsImagePath = undefined;
  let aboutUsVideoPath = undefined;
  let contactUsVideoPath = undefined;

  // Handle logo removal
  if (req.body.removeLogo === "true") {
    // Delete old logo if exists
    if (settings?.logo) {
      const logoPathToDelete = settings.logo.startsWith("/")
        ? settings.logo.slice(1)
        : settings.logo;
      const oldLogoPath = path.join(process.cwd(), logoPathToDelete);
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log("Error deleting logo:", error.message);
      }
    }
    logoPath = null;
  }
  // Handle logo upload
  else if (req.files && req.files.logo && req.files.logo[0]) {
    // Delete old logo if exists
    if (settings?.logo) {
      const logoPathToDelete = settings.logo.startsWith("/")
        ? settings.logo.slice(1)
        : settings.logo;
      const oldLogoPath = path.join(process.cwd(), logoPathToDelete);
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log("Error deleting old logo:", error.message);
      }
    }
    logoPath = `/uploads/site/${req.files.logo[0].filename}`;
  }

  // Handle aboutUsImage removal
  if (req.body.removeAboutUsImage === "true") {
    // Delete old image if exists
    if (settings?.aboutUsImage) {
      const imagePathToDelete = settings.aboutUsImage.startsWith("/")
        ? settings.aboutUsImage.slice(1)
        : settings.aboutUsImage;
      const oldImagePath = path.join(process.cwd(), imagePathToDelete);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log("Error deleting aboutUsImage:", error.message);
      }
    }
    aboutUsImagePath = null;
  }
  // Handle aboutUsImage upload
  else if (req.files && req.files.aboutUsImage && req.files.aboutUsImage[0]) {
    // Delete old image if exists
    if (settings?.aboutUsImage) {
      const imagePathToDelete = settings.aboutUsImage.startsWith("/")
        ? settings.aboutUsImage.slice(1)
        : settings.aboutUsImage;
      const oldImagePath = path.join(process.cwd(), imagePathToDelete);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log("Error deleting old aboutUsImage:", error.message);
      }
    }
    aboutUsImagePath = `/uploads/images/${req.files.aboutUsImage[0].filename}`;
  }

  // Handle contactUsImage removal
  if (req.body.removeContactUsImage === "true") {
    // Delete old image if exists
    if (settings?.contactUsImage) {
      const imagePathToDelete = settings.contactUsImage.startsWith("/")
        ? settings.contactUsImage.slice(1)
        : settings.contactUsImage;
      const oldImagePath = path.join(process.cwd(), imagePathToDelete);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log("Error deleting contactUsImage:", error.message);
      }
    }
    contactUsImagePath = null;
  }
  // Handle contactUsImage upload
  else if (
    req.files &&
    req.files.contactUsImage &&
    req.files.contactUsImage[0]
  ) {
    // Delete old image if exists
    if (settings?.contactUsImage) {
      const imagePathToDelete = settings.contactUsImage.startsWith("/")
        ? settings.contactUsImage.slice(1)
        : settings.contactUsImage;
      const oldImagePath = path.join(process.cwd(), imagePathToDelete);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log("Error deleting old contactUsImage:", error.message);
      }
    }
    contactUsImagePath = `/uploads/images/${req.files.contactUsImage[0].filename}`;
  }

  // Handle aboutUsVideo upload (no removal flag needed, videos can be replaced)
  if (req.files && req.files.aboutUsVideo && req.files.aboutUsVideo[0]) {
    // Delete old video if exists
    if (settings?.aboutUsVideo) {
      const videoPathToDelete = settings.aboutUsVideo.startsWith("/")
        ? settings.aboutUsVideo.slice(1)
        : settings.aboutUsVideo;
      const oldVideoPath = path.join(process.cwd(), videoPathToDelete);
      try {
        await fs.unlink(oldVideoPath);
      } catch (error) {
        console.log("Error deleting old aboutUsVideo:", error.message);
      }
    }
    aboutUsVideoPath = `/uploads/videos/${req.files.aboutUsVideo[0].filename}`;
  }

  // Handle contactUsVideo upload (no removal flag needed, videos can be replaced)
  if (req.files && req.files.contactUsVideo && req.files.contactUsVideo[0]) {
    // Delete old video if exists
    if (settings?.contactUsVideo) {
      const videoPathToDelete = settings.contactUsVideo.startsWith("/")
        ? settings.contactUsVideo.slice(1)
        : settings.contactUsVideo;
      const oldVideoPath = path.join(process.cwd(), videoPathToDelete);
      try {
        await fs.unlink(oldVideoPath);
      } catch (error) {
        console.log("Error deleting old contactUsVideo:", error.message);
      }
    }
    contactUsVideoPath = `/uploads/videos/${req.files.contactUsVideo[0].filename}`;
  }

  if (!settings) {
    // Create new settings
    settings = await prisma.siteSettings.create({
      data: {
        siteName,
        siteTitle,
        description,
        logo: logoPath !== undefined ? logoPath : null,
        email,
        phoneNumber: normalizedPhoneNumber,
        address,
        instagram,
        telegram,
        whatsapp,
        twitter,
        linkedin,
        facebook,
        youtube,
        workingHours,
        aboutUsImage: aboutUsImagePath !== undefined ? aboutUsImagePath : null,
        aboutUsVideo: aboutUsVideoPath !== undefined ? aboutUsVideoPath : null,
        aboutUsContent,
        contactUsImage:
          contactUsImagePath !== undefined ? contactUsImagePath : null,
        contactUsVideo:
          contactUsVideoPath !== undefined ? contactUsVideoPath : null,
        becomeDoctorContent,
        becomeNurseContent,
      },
    });
  } else {
    // Update existing settings
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        ...(siteName !== undefined && { siteName }),
        ...(siteTitle !== undefined && { siteTitle }),
        ...(description !== undefined && { description }),
        ...(logoPath !== undefined && { logo: logoPath }),
        ...(email !== undefined && { email }),
        ...(normalizedPhoneNumber !== undefined && {
          phoneNumber: normalizedPhoneNumber,
        }),
        ...(address !== undefined && { address }),
        ...(instagram !== undefined && { instagram }),
        ...(telegram !== undefined && { telegram }),
        ...(eitaa !== undefined && { eitaa }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(twitter !== undefined && { twitter }),
        ...(linkedin !== undefined && { linkedin }),
        ...(facebook !== undefined && { facebook }),
        ...(youtube !== undefined && { youtube }),
        ...(workingHours !== undefined && { workingHours }),
        ...(aboutUsImagePath !== undefined && {
          aboutUsImage: aboutUsImagePath,
        }),
        ...(aboutUsVideoPath !== undefined && {
          aboutUsVideo: aboutUsVideoPath,
        }),
        ...(aboutUsContent !== undefined && { aboutUsContent }),
        ...(contactUsImagePath !== undefined && {
          contactUsImage: contactUsImagePath,
        }),
        ...(contactUsVideoPath !== undefined && {
          contactUsVideo: contactUsVideoPath,
        }),
        ...(becomeDoctorContent !== undefined && { becomeDoctorContent }),
        ...(becomeNurseContent !== undefined && { becomeNurseContent }),
      },
    });
  }

  res.json({
    success: true,
    message: "تنظیمات سایت با موفقیت به‌روزرسانی شد",
    data: { settings },
  });
};

/**
 * Update social media links only (Admin only)
 */
const updateSocialMedia = async (req, res) => {
  const {
    instagram,
    telegram,
    eitaa,
    whatsapp,
    twitter,
    linkedin,
    facebook,
    youtube,
  } = req.body;

  let settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    // Create new settings with only social media
    settings = await prisma.siteSettings.create({
      data: {
        instagram,
        telegram,
        eitaa,
        whatsapp,
        twitter,
        linkedin,
        facebook,
        youtube,
      },
    });
  } else {
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        ...(instagram !== undefined && { instagram }),
        ...(telegram !== undefined && { telegram }),
        ...(eitaa !== undefined && { eitaa }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(twitter !== undefined && { twitter }),
        ...(linkedin !== undefined && { linkedin }),
        ...(facebook !== undefined && { facebook }),
        ...(youtube !== undefined && { youtube }),
      },
    });
  }

  res.json({
    success: true,
    message: "لینک‌های شبکه‌های اجتماعی با موفقیت به‌روزرسانی شد",
    data: {
      socialMedia: {
        instagram: settings.instagram,
        telegram: settings.telegram,
        eitaa: settings.eitaa,
        whatsapp: settings.whatsapp,
        twitter: settings.twitter,
        linkedin: settings.linkedin,
        facebook: settings.facebook,
        youtube: settings.youtube,
      },
    },
  });
};

/**
 * Get social media links only (public)
 */
const getSocialMedia = async (req, res) => {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      instagram: true,
      telegram: true,
      eitaa: true,
      whatsapp: true,
      twitter: true,
      linkedin: true,
      facebook: true,
      youtube: true,
    },
  });

  res.json({
    success: true,
    data: {
      socialMedia: settings || {
        instagram: null,
        telegram: null,
        eitaa: null,
        whatsapp: null,
        twitter: null,
        linkedin: null,
        facebook: null,
        youtube: null,
      },
    },
  });
};

/**
 * Get appointment settings (Admin only)
 */
const getAppointmentSettings = async (req, res) => {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      id: true,
      appointmentMode: true,
      maxAppointmentsPerHour: true,
      syncApiKeys: {
        select: {
          id: true,
          name: true,
          clinicId: true,
          clinic: { select: { id: true, name: true } },
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  res.json({
    success: true,
    data: {
      appointmentSettings: {
        mode: settings?.appointmentMode || "SIMPLE",
        maxAppointmentsPerHour: settings?.maxAppointmentsPerHour || 10,
        syncApiKeys: settings?.syncApiKeys || [],
      },
    },
  });
};

/**
 * Update appointment settings (Admin only)
 */
const updateAppointmentSettings = async (req, res) => {
  const { appointmentMode, maxAppointmentsPerHour } = req.body;

  // Validate appointmentMode
  if (appointmentMode && !["SIMPLE", "ADVANCED"].includes(appointmentMode)) {
    throw new AppError("حالت نوبت‌دهی نامعتبر است", 400);
  }

  // Validate maxAppointmentsPerHour
  if (maxAppointmentsPerHour !== undefined) {
    const max = parseInt(maxAppointmentsPerHour);
    if (isNaN(max) || max < 1 || max > 100) {
      throw new AppError("تعداد نوبت در ساعت باید بین ۱ تا ۱۰۰ باشد", 400);
    }
  }

  let settings = await prisma.siteSettings.findFirst();

  const updateData = {
    ...(appointmentMode && { appointmentMode }),
    ...(maxAppointmentsPerHour !== undefined && {
      maxAppointmentsPerHour: parseInt(maxAppointmentsPerHour),
    }),
  };

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: updateData,
    });
  } else {
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  res.json({
    success: true,
    message: "تنظیمات نوبت‌دهی با موفقیت به‌روزرسانی شد",
    data: {
      appointmentSettings: {
        mode: settings.appointmentMode,
        maxAppointmentsPerHour: settings.maxAppointmentsPerHour,
      },
    },
  });
};

/**
 * Create a new Sync API Key (Admin only)
 */
const createSyncApiKey = async (req, res) => {
  const { name, clinicId } = req.body;

  if (!name || name.trim().length === 0) {
    throw new AppError("نام کلید API الزامی است", 400);
  }

  // Verify clinic exists if provided
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      throw new AppError("کلینیک یافت نشد", 404);
    }
  }

  // Get or create site settings
  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        siteName: "Dental Clinic",
      },
    });
  }

  // Generate unique API key
  const crypto = require("crypto");
  const apiKey = crypto.randomBytes(32).toString("hex");

  // Create the API key
  const syncApiKey = await prisma.syncApiKey.create({
    data: {
      name: name.trim(),
      apiKey,
      clinicId: clinicId || null,
      siteSettingsId: settings.id,
    },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: "کلید API با موفقیت ایجاد شد",
    data: {
      syncApiKey: {
        id: syncApiKey.id,
        name: syncApiKey.name,
        apiKey: syncApiKey.apiKey, // فقط یکبار نمایش داده می‌شود
        clinicId: syncApiKey.clinicId,
        clinic: syncApiKey.clinic,
        isActive: syncApiKey.isActive,
        createdAt: syncApiKey.createdAt,
      },
    },
  });
};

/**
 * Delete a Sync API Key (Admin only)
 */
const deleteSyncApiKey = async (req, res) => {
  const { id } = req.params;

  const syncApiKey = await prisma.syncApiKey.findUnique({
    where: { id },
  });

  if (!syncApiKey) {
    throw new AppError("کلید API یافت نشد", 404);
  }

  await prisma.syncApiKey.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "کلید API با موفقیت حذف شد",
  });
};

/**
 * Toggle Sync API Key active status (Admin only)
 */
const toggleSyncApiKey = async (req, res) => {
  const { id } = req.params;

  const syncApiKey = await prisma.syncApiKey.findUnique({
    where: { id },
  });

  if (!syncApiKey) {
    throw new AppError("کلید API یافت نشد", 404);
  }

  const updated = await prisma.syncApiKey.update({
    where: { id },
    data: { isActive: !syncApiKey.isActive },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  });

  res.json({
    success: true,
    message: updated.isActive ? "کلید API فعال شد" : "کلید API غیرفعال شد",
    data: {
      syncApiKey: {
        id: updated.id,
        name: updated.name,
        clinicId: updated.clinicId,
        clinic: updated.clinic,
        isActive: updated.isActive,
        lastUsedAt: updated.lastUsedAt,
      },
    },
  });
};

/**
 * دریافت تنظیمات نوتیفیکیشن (Admin only)
 */
const getNotificationSettings = async (req, res) => {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      secretaryNotificationMethod: true,
      eitaaApiToken: true,
    },
  });

  res.json({
    success: true,
    data: {
      notificationSettings: {
        method: settings?.secretaryNotificationMethod || "SMS",
        hasEitaaToken: !!settings?.eitaaApiToken,
      },
    },
  });
};

/**
 * به‌روزرسانی تنظیمات نوتیفیکیشن (Admin only)
 */
const updateNotificationSettings = async (req, res) => {
  const { method, eitaaApiToken } = req.body;

  // اعتبارسنجی method
  if (method && !["SMS", "EITAA", "BOTH"].includes(method)) {
    throw new AppError("روش ارسال نوتیفیکیشن نامعتبر است", 400);
  }

  // اگر method ایتا یا هر دو است، توکن الزامی است
  if ((method === "EITAA" || method === "BOTH") && !eitaaApiToken) {
    throw new AppError("برای استفاده از ایتا، توکن API الزامی است", 400);
  }

  let settings = await prisma.siteSettings.findFirst();

  const updateData = {};
  if (method) {
    updateData.secretaryNotificationMethod = method;
  }
  if (eitaaApiToken !== undefined) {
    updateData.eitaaApiToken = eitaaApiToken || null;
  }

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        siteName: "Dental Clinic",
        ...updateData,
      },
    });
  } else {
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  res.json({
    success: true,
    message: "تنظیمات نوتیفیکیشن با موفقیت به‌روزرسانی شد",
    data: {
      notificationSettings: {
        method: settings.secretaryNotificationMethod,
        hasEitaaToken: !!settings.eitaaApiToken,
      },
    },
  });
};

/**
 * تست اتصال به API ایتا (Admin only)
 */
const testEitaaConnection = async (req, res) => {
  const { token, chatId } = req.body;

  if (!token || !chatId) {
    throw new AppError("توکن API و شناسه کانال/گروه الزامی است", 400);
  }

  const eitaaService = require("../services/eitaaService");

  // تست با getMe
  const meResult = await eitaaService.getMe(token);
  if (!meResult.success) {
    return res.status(400).json({
      success: false,
      error: meResult.error || "خطا در اتصال به API ایتا",
    });
  }

  // تست با ارسال پیام تستی
  const testMessage = `✅ تست اتصال به API ایتا\n\nاین یک پیام تست است. اگر این پیام را دریافت کردید، اتصال برقرار است.`;
  const sendResult = await eitaaService.sendMessage(token, chatId, testMessage);

  if (!sendResult.success) {
    return res.status(400).json({
      success: false,
      error: sendResult.error || "خطا در ارسال پیام تست",
    });
  }

  res.json({
    success: true,
    message: "اتصال به API ایتا برقرار است و پیام تست ارسال شد",
    data: {
      botInfo: meResult.data,
      testMessageId: sendResult.messageId,
    },
  });
};

module.exports = {
  getSettings,
  updateSettings,
  updateSocialMedia,
  getSocialMedia,
  getAppointmentSettings,
  updateAppointmentSettings,
  createSyncApiKey,
  deleteSyncApiKey,
  toggleSyncApiKey,
  getNotificationSettings,
  updateNotificationSettings,
  testEitaaConnection,
};
