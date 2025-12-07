const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
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
        aboutUsImage: aboutUsImagePath !== undefined ? aboutUsImagePath : null,
        aboutUsVideo: aboutUsVideoPath !== undefined ? aboutUsVideoPath : null,
        aboutUsContent,
        contactUsImage:
          contactUsImagePath !== undefined ? contactUsImagePath : null,
        contactUsVideo:
          contactUsVideoPath !== undefined ? contactUsVideoPath : null,
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
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(instagram !== undefined && { instagram }),
        ...(telegram !== undefined && { telegram }),
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
    message: "لینک‌های شبکه‌های اجتماعی با موفقیت به‌روزرسانی شد",
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
