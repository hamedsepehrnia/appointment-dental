const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { AppError } = require("./errorHandler");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    if (file.fieldname === "profileImage") {
      // Check if this is for a user (from /users or /auth/me route), doctor, or review
      const isUserRoute =
        req.originalUrl &&
        (req.originalUrl.includes("/users") ||
          req.originalUrl.includes("/auth/me"));
      const isReviewRoute =
        req.originalUrl && req.originalUrl.includes("/reviews");
      if (isUserRoute) {
        uploadPath += "users/";
      } else if (isReviewRoute) {
        uploadPath += "images/";
      } else {
        uploadPath += "doctors/";
      }
    } else if (file.fieldname === "coverImage") {
      uploadPath += "images/";
    } else if (file.fieldname === "galleryImage") {
      uploadPath += "gallery/";
    } else if (file.fieldname === "heroSliderImage") {
      uploadPath += "images/";
    } else if (file.fieldname === "documents") {
      uploadPath += "documents/";
    } else if (file.fieldname === "logo") {
      // Check if this is for insurance or site settings
      const isInsuranceRoute =
        req.originalUrl && req.originalUrl.includes("/insurance");
      uploadPath += isInsuranceRoute ? "insurance/" : "site/";
    } else if (
      file.fieldname === "aboutUsImage" ||
      file.fieldname === "contactUsImage"
    ) {
      uploadPath += "images/";
    } else if (
      file.fieldname === "aboutUsVideo" ||
      file.fieldname === "contactUsVideo"
    ) {
      uploadPath += "videos/";
    } else if (file.fieldname === "upload" || file.fieldname === "file") {
      // For CKEditor image uploads
      uploadPath += "images/";
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter with strict validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check if this is a video file
  const isVideo =
    file.fieldname === "aboutUsVideo" || file.fieldname === "contactUsVideo";

  if (isVideo) {
    // Video file validation
    const allowedVideoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
    const allowedVideoMimeTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    if (!allowedVideoExtensions.includes(ext)) {
      return cb(
        new AppError(
          "نوع فایل ویدیو نامعتبر است. فقط فرمت‌های mp4, webm, ogg, mov مجاز هستند",
          400
        )
      );
    }

    if (!allowedVideoMimeTypes.includes(file.mimetype)) {
      return cb(new AppError("نوع MIME ویدیو نامعتبر است", 400));
    }

    return cb(null, true);
  } else {
    // Image file validation
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(ext);
    const mimetype = allowedTypes.test(file.mimetype);

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedExtensions.includes(ext)) {
      return cb(
        new AppError("نوع فایل نامعتبر است. فقط تصاویر مجاز هستند", 400)
      );
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError("نوع MIME فایل نامعتبر است", 400));
    }

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new AppError("فقط فایل‌های تصویری مجاز هستند", 400));
  }
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default (for videos)
  },
});

module.exports = upload;
