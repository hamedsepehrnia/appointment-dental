const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all hero sliders (published only for public)
 */
const getHeroSliders = async (req, res) => {
  const { page = 1, limit = 20, published } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Only show published sliders to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const [sliders, total] = await Promise.all([
    prisma.heroSlider.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.heroSlider.count({ where }),
  ]);

  res.json({
    success: true,
    data: { sliders },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single hero slider
 */
const getHeroSlider = async (req, res) => {
  const { id } = req.params;

  const slider = await prisma.heroSlider.findUnique({
    where: { id },
  });

  if (!slider) {
    throw new AppError('اسلایدر یافت نشد', 404);
  }

  // Check if slider is published (for non-admin/secretary)
  if (!slider.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('اسلایدر یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { slider },
  });
};

/**
 * Create hero slider (Admin/Secretary)
 */
const createHeroSlider = async (req, res) => {
  const {
    title,
    description,
    buttonText,
    buttonLink,
    order,
    published,
  } = req.body;

  if (!req.file) {
    throw new AppError('لطفاً یک تصویر انتخاب کنید', 400);
  }

  const imagePath = `/uploads/images/${req.file.filename}`;

  const slider = await prisma.heroSlider.create({
    data: {
      title: title || null,
      description: description || null,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      image: imagePath,
      order: order ? parseInt(order) : 0,
      published: published !== undefined ? (published === 'true' || published === true) : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'اسلایدر با موفقیت ایجاد شد',
    data: { slider },
  });
};

/**
 * Update hero slider (Admin/Secretary)
 */
const updateHeroSlider = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    buttonText,
    buttonLink,
    order,
    published,
  } = req.body;

  const currentSlider = await prisma.heroSlider.findUnique({
    where: { id },
  });

  if (!currentSlider) {
    throw new AppError('اسلایدر یافت نشد', 404);
  }

  // Prepare update data
  const updateData = {};
  if (title !== undefined) {
    updateData.title = title || null;
  }
  if (description !== undefined) {
    updateData.description = description || null;
  }
  if (buttonText !== undefined) {
    updateData.buttonText = buttonText || null;
  }
  if (buttonLink !== undefined) {
    updateData.buttonLink = buttonLink || null;
  }
  if (order !== undefined) {
    updateData.order = parseInt(order) || 0;
  }
  if (published !== undefined) {
    updateData.published = published === 'true' || published === true;
  }

  // Handle image removal
  if (req.body.removeHeroSliderImage === "true") {
    // Delete old image if exists
    if (currentSlider.image) {
      const imagePath = currentSlider.image.startsWith('/')
        ? currentSlider.image.slice(1)
        : currentSlider.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    updateData.image = null;
  }
  // Handle image upload
  else if (req.file) {
    // Delete old image
    if (currentSlider.image) {
      const imagePath = currentSlider.image.startsWith('/')
        ? currentSlider.image.slice(1)
        : currentSlider.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    updateData.image = `/uploads/images/${req.file.filename}`;
  }

  const slider = await prisma.heroSlider.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'اسلایدر با موفقیت به‌روزرسانی شد',
    data: { slider },
  });
};

/**
 * Delete hero slider (Admin/Secretary)
 */
const deleteHeroSlider = async (req, res) => {
  const { id } = req.params;

  const slider = await prisma.heroSlider.findUnique({
    where: { id },
  });

  if (!slider) {
    throw new AppError('اسلایدر یافت نشد', 404);
  }

  // Delete image file
  if (slider.image) {
    const imagePath = slider.image.startsWith('/')
      ? slider.image.slice(1)
      : slider.image;
    const fullImagePath = path.join(process.cwd(), imagePath);
    try {
      await fs.unlink(fullImagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  await prisma.heroSlider.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'اسلایدر با موفقیت حذف شد',
  });
};

module.exports = {
  getHeroSliders,
  getHeroSlider,
  createHeroSlider,
  updateHeroSlider,
  deleteHeroSlider,
};

