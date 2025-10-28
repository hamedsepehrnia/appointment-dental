const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, createSlug } = require('../utils/helpers');
const { sanitizeContent } = require('../utils/sanitizeHtml');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all services
 */
const getServices = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Search functionality
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { beforeTreatmentTips: { contains: search, mode: 'insensitive' } },
      { afterTreatmentTips: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        price: true,
        durationMinutes: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  res.json({
    success: true,
    data: { services },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single service by slug or ID
 */
const getService = async (req, res) => {
  const { identifier } = req.params;

  const service = await prisma.service.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
  });

  if (!service) {
    throw new AppError('خدمت یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { service },
  });
};

/**
 * Create service (Admin/Secretary)
 */
const createService = async (req, res) => {
  const {
    title,
    description,
    beforeTreatmentTips,
    afterTreatmentTips,
    price,
    durationMinutes,
  } = req.body;

  const slug = createSlug(title);
  const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

  // Check if slug already exists
  const existingService = await prisma.service.findUnique({
    where: { slug },
  });

  let finalSlug = slug;
  if (existingService) {
    finalSlug = `${slug}-${Date.now()}`;
  }

  const service = await prisma.service.create({
    data: {
      title,
      slug: finalSlug,
      description: sanitizeContent(description),
      beforeTreatmentTips: beforeTreatmentTips ? sanitizeContent(beforeTreatmentTips) : null,
      afterTreatmentTips: afterTreatmentTips ? sanitizeContent(afterTreatmentTips) : null,
      price: price ? parseInt(price) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      coverImage,
    },
  });

  res.status(201).json({
    success: true,
    message: 'خدمت با موفقیت ایجاد شد',
    data: { service },
  });
};

/**
 * Update service (Admin/Secretary)
 */
const updateService = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    beforeTreatmentTips,
    afterTreatmentTips,
    price,
    durationMinutes,
  } = req.body;

  const currentService = await prisma.service.findUnique({
    where: { id },
  });

  if (!currentService) {
    throw new AppError('خدمت یافت نشد', 404);
  }

  let slug = currentService.slug;
  if (title && title !== currentService.title) {
    slug = createSlug(title);
    
    const existingService = await prisma.service.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingService) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Handle cover image
  let coverImage = currentService.coverImage;
  if (req.file) {
    if (currentService.coverImage) {
      const oldImagePath = path.join(process.cwd(), currentService.coverImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    coverImage = `/uploads/images/${req.file.filename}`;
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(title && { title, slug }),
      ...(description && { description: sanitizeContent(description) }),
      ...(beforeTreatmentTips !== undefined && { 
        beforeTreatmentTips: beforeTreatmentTips ? sanitizeContent(beforeTreatmentTips) : null 
      }),
      ...(afterTreatmentTips !== undefined && { 
        afterTreatmentTips: afterTreatmentTips ? sanitizeContent(afterTreatmentTips) : null 
      }),
      ...(price !== undefined && { price: price ? parseInt(price) : null }),
      ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? parseInt(durationMinutes) : null }),
      ...(coverImage && { coverImage }),
    },
  });

  res.json({
    success: true,
    message: 'خدمت با موفقیت به‌روزرسانی شد',
    data: { service },
  });
};

/**
 * Delete service (Admin/Secretary)
 */
const deleteService = async (req, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new AppError('خدمت یافت نشد', 404);
  }

  // Delete cover image if exists
  if (service.coverImage) {
    const imagePath = path.join(process.cwd(), service.coverImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  await prisma.service.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'خدمت با موفقیت حذف شد',
  });
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
};

