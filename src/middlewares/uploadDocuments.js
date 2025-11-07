const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Ensure uploads/documents directory exists
const documentsDir = 'uploads/documents/';
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Storage configuration for documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'document-' + uniqueSuffix + ext);
  },
});

// File filter for documents (PDF, images, etc.)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(new AppError('نوع فایل نامعتبر است. فقط PDF، تصاویر و فایل‌های Word مجاز هستند', 400));
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError('نوع MIME فایل نامعتبر است', 400));
  }

  cb(null, true);
};

// Upload middleware for documents (multiple files)
const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_DOCUMENT_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

module.exports = uploadDocuments;

