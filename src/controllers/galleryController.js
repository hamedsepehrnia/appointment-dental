const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all gallery images (published only for public)
 */
const getGalleryImages = async (req, res) => {
  const { page = 1, limit = 20, published } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Only show published images to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const [images, total] = await Promise.all([
    prisma.gallery.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.gallery.count({ where }),
  ]);

  res.json({
    success: true,
    data: { images },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single gallery image
 */
const getGalleryImage = async (req, res) => {
  const { id } = req.params;

  const image = await prisma.gallery.findUnique({
    where: { id },
  });

  if (!image) {
    throw new AppError('تصویر یافت نشد', 404);
  }

  // Check if image is published (for non-admin/secretary)
  if (!image.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('تصویر یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { image },
  });
};

/**
 * Upload image to gallery (Admin/Secretary)
 */
const uploadImage = async (req, res) => {
  const { title, description, order, published } = req.body;

  if (!req.file) {
    throw new AppError('لطفاً یک تصویر انتخاب کنید', 400);
  }

  const imagePath = `/uploads/gallery/${req.file.filename}`;

  const image = await prisma.gallery.create({
    data: {
      title: title || null,
      description: description || null,
      image: imagePath,
      order: order ? parseInt(order) : 0,
      published: published !== undefined ? published === 'true' : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'تصویر با موفقیت آپلود شد',
    data: { image },
  });
};

/**
 * Bulk upload images to gallery (Admin/Secretary)
 */
const bulkUploadImages = async (req, res) => {
  const files = req.files;
  const { published } = req.body;

  console.log('Bulk upload request:', {
    filesCount: files ? files.length : 0,
    files: files ? files.map(f => ({ fieldname: f.fieldname, filename: f.filename, originalname: f.originalname })) : [],
    published
  });

  if (!files || files.length === 0) {
    throw new AppError('لطفاً حداقل یک تصویر انتخاب کنید', 400);
  }

  const publishedValue = published !== undefined ? published === 'true' : true;

  // Get the maximum order value to append new images
  const maxOrderImage = await prisma.gallery.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  let currentOrder = maxOrderImage ? maxOrderImage.order + 1 : 0;

  // Get total count of gallery images to generate sequential numbers
  const totalCount = await prisma.gallery.count();
  let imageNumber = totalCount + 1;

  const images = await Promise.all(
    files.map((file) => {
      const imagePath = `/uploads/gallery/${file.filename}`;
      const defaultTitle = `تصویر شماره ${imageNumber++}`;
      console.log('Uploading image:', {
        filename: file.filename,
        originalname: file.originalname,
        path: imagePath,
        fieldname: file.fieldname
      });
      return prisma.gallery.create({
        data: {
          title: defaultTitle,
          description: null,
          image: imagePath,
          order: currentOrder++,
          published: publishedValue,
        },
      });
    })
  );

  res.status(201).json({
    success: true,
    message: `${images.length} تصویر با موفقیت آپلود شد`,
    data: { images },
  });
};

/**
 * Update gallery image (Admin/Secretary)
 */
const updateImage = async (req, res) => {
  const { id } = req.params;
  const { title, description, order, published } = req.body;

  const currentImage = await prisma.gallery.findUnique({
    where: { id },
  });

  if (!currentImage) {
    throw new AppError('تصویر یافت نشد', 404);
  }

  // Prepare update data
  const updateData = {};
  if (title !== undefined) {
    updateData.title = title;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (order !== undefined) {
    updateData.order = parseInt(order);
  }
  if (published !== undefined) {
    updateData.published = published === 'true';
  }

  // Handle gallery image removal
  if (req.body.removeGalleryImage === "true") {
    // Delete old image if exists
    if (currentImage.image) {
      const imagePath = currentImage.image.startsWith('/')
        ? currentImage.image.slice(1)
        : currentImage.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    updateData.image = null;
  }
  // Handle gallery image upload
  else if (req.file) {
    // Delete old image
    const imagePath = currentImage.image.startsWith('/')
      ? currentImage.image.slice(1)
      : currentImage.image;
    const oldImagePath = path.join(process.cwd(), imagePath);
    try {
      await fs.unlink(oldImagePath);
    } catch (err) {
      console.error('Error deleting old image:', err);
    }
    updateData.image = `/uploads/gallery/${req.file.filename}`;
  }

  const image = await prisma.gallery.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'تصویر با موفقیت به‌روزرسانی شد',
    data: { image },
  });
};

/**
 * Delete gallery image (Admin/Secretary)
 */
const deleteImage = async (req, res) => {
  const { id } = req.params;

  const image = await prisma.gallery.findUnique({
    where: { id },
  });

  if (!image) {
    throw new AppError('تصویر یافت نشد', 404);
  }

  // Delete image file
  const imagePath = path.join(process.cwd(), image.image);
  try {
    await fs.unlink(imagePath);
  } catch (err) {
    console.error('Error deleting image:', err);
  }

  await prisma.gallery.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'تصویر با موفقیت حذف شد',
  });
};

module.exports = {
  getGalleryImages,
  getGalleryImage,
  uploadImage,
  bulkUploadImages,
  updateImage,
  deleteImage,
};

