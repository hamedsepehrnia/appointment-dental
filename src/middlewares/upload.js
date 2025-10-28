const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('./errorHandler');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'profileImage') {
      uploadPath += 'doctors/';
    } else if (file.fieldname === 'coverImage') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'galleryImage') {
      uploadPath += 'gallery/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // استفاده از crypto.randomUUID برای امنیت بیشتر و نام‌های یکتا
    const ext = path.extname(file.originalname).toLowerCase();
    
    // فقط extension های مجاز
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new AppError('Extension نامعتبر', 400));
    }
    
    // ساخت نام فایل ایمن با random UUID
    const safeFilename = `${crypto.randomUUID()}${ext}`;
    cb(null, safeFilename);
  },
});

// File filter - Improved security
const fileFilter = (req, file, cb) => {
  // بررسی دقیق‌تر MIME types
  const allowedMimes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = allowedMimes[file.mimetype]?.includes(ext);

  // بررسی اینکه نام فایل risky نباشد (path traversal protection)
  const dangerousPatterns = /\.\.|\/|\\/;
  if (dangerousPatterns.test(file.originalname)) {
    return cb(new AppError('نام فایل نامعتبر است', 400));
  }

  // بررسی extension برای جعل
  if (!isAllowedMime) {
    return cb(new AppError('فقط فایل‌های تصویری مجاز هستند (JPEG, PNG, WebP)', 400));
  }
  
  cb(null, true);
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

