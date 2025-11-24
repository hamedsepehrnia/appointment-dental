const { AppError } = require('../middlewares/errorHandler');

/**
 * Upload image for CKEditor
 * This endpoint is used by CKEditor to upload images directly
 * Returns the full URL of the uploaded image
 */
const uploadImage = async (req, res) => {
  if (!req.file) {
    throw new AppError('لطفاً یک تصویر انتخاب کنید', 400);
  }

  // Construct the image URL path
  const imageUrl = `/uploads/images/${req.file.filename}`;
  
  // Get the full URL (protocol + host + path)
  // This ensures CKEditor gets a complete URL that works in the editor
  const fullImageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;

  // CKEditor expects a specific response format: { url: "..." }
  res.json({
    url: fullImageUrl,
  });
};

module.exports = {
  uploadImage,
};

