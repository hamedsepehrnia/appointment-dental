const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { formatPhoneNumberOptional } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

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
    aboutUsContent,
    contactUsImage,
    contactUsVideo,
    becomeDoctorContent,
  } = req.body;

  // Get existing settings or create new one
  let settings = await prisma.siteSettings.findFirst();

  // Normalize phone number if provided
  const normalizedPhoneNumber = phoneNumber !== undefined ? formatPhoneNumberOptional(phoneNumber) : undefined;

  // Handle file uploads (logo, aboutUsImage, contactUsImage, aboutUsVideo, contactUsVideo)
  let logoPath = undefined;
  let aboutUsImagePath = undefined;
  let contactUsImagePath = undefined;
  let aboutUsVideoPath = undefined;
  let contactUsVideoPath = undefined;

  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      // Delete old logo if exists
      if (settings?.logo) {
        try {
          const oldLogoPath = path.join(process.cwd(), settings.logo);
          await fs.unlink(oldLogoPath);
        } catch (error) {
          console.log('Error deleting old logo:', error.message);
        }
      }
      logoPath = `/uploads/site/${req.files.logo[0].filename}`;
    }
    if (req.files.aboutUsImage && req.files.aboutUsImage[0]) {
      // Delete old image if exists
      if (settings?.aboutUsImage) {
        try {
          const oldImagePath = path.join(process.cwd(), settings.aboutUsImage);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Error deleting old aboutUsImage:', error.message);
        }
      }
      aboutUsImagePath = `/uploads/images/${req.files.aboutUsImage[0].filename}`;
    }
    if (req.files.contactUsImage && req.files.contactUsImage[0]) {
      // Delete old image if exists
      if (settings?.contactUsImage) {
        try {
          const oldImagePath = path.join(process.cwd(), settings.contactUsImage);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Error deleting old contactUsImage:', error.message);
        }
      }
      contactUsImagePath = `/uploads/images/${req.files.contactUsImage[0].filename}`;
    }
    if (req.files.aboutUsVideo && req.files.aboutUsVideo[0]) {
      // Delete old video if exists
      if (settings?.aboutUsVideo) {
        try {
          const oldVideoPath = path.join(process.cwd(), settings.aboutUsVideo);
          await fs.unlink(oldVideoPath);
        } catch (error) {
          console.log('Error deleting old aboutUsVideo:', error.message);
        }
      }
      aboutUsVideoPath = `/uploads/videos/${req.files.aboutUsVideo[0].filename}`;
    }
    if (req.files.contactUsVideo && req.files.contactUsVideo[0]) {
      // Delete old video if exists
      if (settings?.contactUsVideo) {
        try {
          const oldVideoPath = path.join(process.cwd(), settings.contactUsVideo);
          await fs.unlink(oldVideoPath);
        } catch (error) {
          console.log('Error deleting old contactUsVideo:', error.message);
        }
      }
      contactUsVideoPath = `/uploads/videos/${req.files.contactUsVideo[0].filename}`;
    }
  }

  // If files are not uploaded but provided as strings (existing paths or empty strings)
  // Handle delete (empty string means delete)
  if (logoPath === undefined && logo !== undefined) {
    if (logo === '') {
      // Delete existing logo file
      if (settings?.logo) {
        try {
          const oldLogoPath = path.join(process.cwd(), settings.logo);
          await fs.unlink(oldLogoPath);
        } catch (error) {
          // File might not exist, ignore error
          console.log('Error deleting old logo:', error.message);
        }
      }
      logoPath = '';
    } else {
      logoPath = logo;
    }
  }
  
  if (aboutUsImagePath === undefined && aboutUsImage !== undefined) {
    if (aboutUsImage === '') {
      // Delete existing image file
      if (settings?.aboutUsImage) {
        try {
          const oldImagePath = path.join(process.cwd(), settings.aboutUsImage);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Error deleting old aboutUsImage:', error.message);
        }
      }
      aboutUsImagePath = '';
    } else {
      aboutUsImagePath = aboutUsImage;
    }
  }
  
  if (contactUsImagePath === undefined && contactUsImage !== undefined) {
    if (contactUsImage === '') {
      // Delete existing image file
      if (settings?.contactUsImage) {
        try {
          const oldImagePath = path.join(process.cwd(), settings.contactUsImage);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Error deleting old contactUsImage:', error.message);
        }
      }
      contactUsImagePath = '';
    } else {
      contactUsImagePath = contactUsImage;
    }
  }
  
  if (aboutUsVideoPath === undefined && aboutUsVideo !== undefined) {
    if (aboutUsVideo === '') {
      // Delete existing video file
      if (settings?.aboutUsVideo) {
        try {
          const oldVideoPath = path.join(process.cwd(), settings.aboutUsVideo);
          await fs.unlink(oldVideoPath);
        } catch (error) {
          console.log('Error deleting old aboutUsVideo:', error.message);
        }
      }
      aboutUsVideoPath = '';
    } else {
      aboutUsVideoPath = aboutUsVideo;
    }
  }
  
  if (contactUsVideoPath === undefined && contactUsVideo !== undefined) {
    if (contactUsVideo === '') {
      // Delete existing video file
      if (settings?.contactUsVideo) {
        try {
          const oldVideoPath = path.join(process.cwd(), settings.contactUsVideo);
          await fs.unlink(oldVideoPath);
        } catch (error) {
          console.log('Error deleting old contactUsVideo:', error.message);
        }
      }
      contactUsVideoPath = '';
    } else {
      contactUsVideoPath = contactUsVideo;
    }
  }

  if (!settings) {
    // Create new settings
    settings = await prisma.siteSettings.create({
      data: {
        siteName,
        siteTitle,
        description,
        logo: logoPath,
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
        aboutUsImage: aboutUsImagePath !== undefined ? aboutUsImagePath : aboutUsImage,
        aboutUsVideo: aboutUsVideoPath !== undefined ? aboutUsVideoPath : aboutUsVideo,
        aboutUsContent,
        contactUsImage: contactUsImagePath !== undefined ? contactUsImagePath : contactUsImage,
        contactUsVideo: contactUsVideoPath !== undefined ? contactUsVideoPath : contactUsVideo,
        becomeDoctorContent,
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
        ...(aboutUsImagePath !== undefined && { aboutUsImage: aboutUsImagePath }),
        ...(aboutUsImagePath === undefined && aboutUsImage !== undefined && { aboutUsImage }),
        ...(aboutUsVideoPath !== undefined && { aboutUsVideo: aboutUsVideoPath }),
        ...(aboutUsVideoPath === undefined && aboutUsVideo !== undefined && { aboutUsVideo }),
        ...(aboutUsContent !== undefined && { aboutUsContent }),
        ...(contactUsImagePath !== undefined && { contactUsImage: contactUsImagePath }),
        ...(contactUsImagePath === undefined && contactUsImage !== undefined && { contactUsImage }),
        ...(contactUsVideoPath !== undefined && { contactUsVideo: contactUsVideoPath }),
        ...(contactUsVideoPath === undefined && contactUsVideo !== undefined && { contactUsVideo }),
        ...(becomeDoctorContent !== undefined && { becomeDoctorContent }),
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

