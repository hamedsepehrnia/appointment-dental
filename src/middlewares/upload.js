const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { AppError } = require("./errorHandler");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    if (file.fieldname === "profileImage") {
      // Check if this is for a user (from /users route) or doctor
      const isUserRoute = req.originalUrl && req.originalUrl.includes("/users");
      uploadPath += isUserRoute ? "users/" : "doctors/";
    } else if (file.fieldname === "coverImage") {
      uploadPath += "images/";
    } else if (file.fieldname === "galleryImage") {
      uploadPath += "gallery/";
    } else if (file.fieldname === "documents") {
      uploadPath += "documents/";
    } else if (file.fieldname === "logo") {
      uploadPath += "insurance/";
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
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  if (!allowedExtensions.includes(ext)) {
    return cb(new AppError("نوع فایل نامعتبر است. فقط تصاویر مجاز هستند", 400));
  }

  // Check MIME type
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError("نوع MIME فایل نامعتبر است", 400));
  }

  // Double check extension matches MIME type
  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new AppError("فقط فایل‌های تصویری مجاز هستند", 400));
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
});

module.exports = upload;
