const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { formatPhoneNumberOptional } = require('../utils/helpers');

/**
 * Get site settings (public)
 */
const getSettings = async (req, res) => {
  let settings = await prisma.siteSettings.findFirst();

  // If no settings exist, create default ones
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        siteName: 'Dental Clinic',
        siteTitle: 'Professional Dental Care',
        description: 'Your trusted dental care provider',
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
    whatsapp,
    twitter,
    linkedin,
    facebook,
    youtube,
    workingHours,
    aboutUsImage,
    aboutUsVideo,
    contactUsImage,
    contactUsVideo,
  } = req.body;

  // Get existing settings or create new one
  let settings = await prisma.siteSettings.findFirst();

  // Normalize phone number if provided
  const normalizedPhoneNumber = phoneNumber !== undefined ? formatPhoneNumberOptional(phoneNumber) : undefined;

  if (!settings) {
    // Create new settings
    settings = await prisma.siteSettings.create({
      data: {
        siteName,
        siteTitle,
        description,
        logo,
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
        aboutUsImage,
        aboutUsVideo,
        contactUsImage,
        contactUsVideo,
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
        ...(logo !== undefined && { logo }),
        ...(email !== undefined && { email }),
        ...(normalizedPhoneNumber !== undefined && { phoneNumber: normalizedPhoneNumber }),
        ...(address !== undefined && { address }),
        ...(instagram !== undefined && { instagram }),
        ...(telegram !== undefined && { telegram }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(twitter !== undefined && { twitter }),
        ...(linkedin !== undefined && { linkedin }),
        ...(facebook !== undefined && { facebook }),
        ...(youtube !== undefined && { youtube }),
        ...(workingHours !== undefined && { workingHours }),
        ...(aboutUsImage !== undefined && { aboutUsImage }),
        ...(aboutUsVideo !== undefined && { aboutUsVideo }),
        ...(contactUsImage !== undefined && { contactUsImage }),
        ...(contactUsVideo !== undefined && { contactUsVideo }),
      },
    });
  }

  res.json({
    success: true,
    message: 'تنظیمات سایت با موفقیت به‌روزرسانی شد',
    data: { settings },
  });
};

/**
 * Update social media links only (Admin only)
 */
const updateSocialMedia = async (req, res) => {
  const { instagram, telegram, whatsapp, twitter, linkedin, facebook, youtube } = req.body;

  let settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    // Create new settings with only social media
    settings = await prisma.siteSettings.create({
      data: {
        instagram,
        telegram,
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
    message: 'لینک‌های شبکه‌های اجتماعی با موفقیت به‌روزرسانی شد',
    data: {
      socialMedia: {
        instagram: settings.instagram,
        telegram: settings.telegram,
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
        whatsapp: null,
        twitter: null,
        linkedin: null,
        facebook: null,
        youtube: null,
      },
    },
  });
};

module.exports = {
  getSettings,
  updateSettings,
  updateSocialMedia,
  getSocialMedia,
};

