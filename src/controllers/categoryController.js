const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { createSlug } = require('../utils/helpers');

/**
 * Get all article categories
 */
const getArticleCategories = async (req, res) => {
  const { published } = req.query;

  const where = {};
  
  // Only show published categories to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const categories = await prisma.articleCategory.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      order: true,
      published: true,
      _count: {
        select: {
          articles: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  res.json({
    success: true,
    data: { categories },
  });
};

/**
 * Get all service categories
 */
const getServiceCategories = async (req, res) => {
  const { published } = req.query;

  const where = {};
  
  // Only show published categories to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const categories = await prisma.serviceCategory.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      order: true,
      published: true,
      _count: {
        select: {
          services: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  res.json({
    success: true,
    data: { categories },
  });
};

/**
 * Get single article category
 */
const getArticleCategory = async (req, res) => {
  const { identifier } = req.params;

  const category = await prisma.articleCategory.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
  });

  if (!category) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  // Check if category is published (for non-admin/secretary)
  if (!category.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { category },
  });
};

/**
 * Get single service category
 */
const getServiceCategory = async (req, res) => {
  const { identifier } = req.params;

  const category = await prisma.serviceCategory.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
  });

  if (!category) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  // Check if category is published (for non-admin/secretary)
  if (!category.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { category },
  });
};

/**
 * Create article category (Admin/Secretary)
 */
const createArticleCategory = async (req, res) => {
  const { name, description, order, published } = req.body;
  
  const slug = createSlug(name);

  // Check if slug already exists
  const existingCategory = await prisma.articleCategory.findUnique({
    where: { slug },
  });

  let finalSlug = slug;
  if (existingCategory) {
    finalSlug = `${slug}-${Date.now()}`;
  }

  const category = await prisma.articleCategory.create({
    data: {
      name,
      slug: finalSlug,
      description,
      order: order ? parseInt(order) : 0,
      published: published !== undefined ? published : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'دسته‌بندی مقاله با موفقیت ایجاد شد',
    data: { category },
  });
};

/**
 * Create service category (Admin/Secretary)
 */
const createServiceCategory = async (req, res) => {
  const { name, description, order, published } = req.body;
  
  const slug = createSlug(name);

  // Check if slug already exists
  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { slug },
  });

  let finalSlug = slug;
  if (existingCategory) {
    finalSlug = `${slug}-${Date.now()}`;
  }

  const category = await prisma.serviceCategory.create({
    data: {
      name,
      slug: finalSlug,
      description,
      order: order ? parseInt(order) : 0,
      published: published !== undefined ? published : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'دسته‌بندی خدمت با موفقیت ایجاد شد',
    data: { category },
  });
};

/**
 * Update article category (Admin/Secretary)
 */
const updateArticleCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, order, published } = req.body;

  const currentCategory = await prisma.articleCategory.findUnique({
    where: { id },
  });

  if (!currentCategory) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  let slug = currentCategory.slug;
  if (name && name !== currentCategory.name) {
    slug = createSlug(name);
    
    // Check if new slug exists
    const existingCategory = await prisma.articleCategory.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingCategory) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const category = await prisma.articleCategory.update({
    where: { id },
    data: {
      ...(name && { name, slug }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order: parseInt(order) }),
      ...(published !== undefined && { published }),
    },
  });

  res.json({
    success: true,
    message: 'دسته‌بندی مقاله با موفقیت به‌روزرسانی شد',
    data: { category },
  });
};

/**
 * Update service category (Admin/Secretary)
 */
const updateServiceCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, order, published } = req.body;

  const currentCategory = await prisma.serviceCategory.findUnique({
    where: { id },
  });

  if (!currentCategory) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  let slug = currentCategory.slug;
  if (name && name !== currentCategory.name) {
    slug = createSlug(name);
    
    // Check if new slug exists
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingCategory) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: {
      ...(name && { name, slug }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order: parseInt(order) }),
      ...(published !== undefined && { published }),
    },
  });

  res.json({
    success: true,
    message: 'دسته‌بندی خدمت با موفقیت به‌روزرسانی شد',
    data: { category },
  });
};

/**
 * Delete article category (Admin/Secretary)
 */
const deleteArticleCategory = async (req, res) => {
  const { id } = req.params;

  const category = await prisma.articleCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  // Check if category has articles
  if (category._count.articles > 0) {
    throw new AppError('نمی‌توان دسته‌بندی دارای مقاله را حذف کرد. ابتدا مقالات را به دسته‌بندی دیگری منتقل کنید', 400);
  }

  await prisma.articleCategory.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'دسته‌بندی مقاله با موفقیت حذف شد',
  });
};

/**
 * Delete service category (Admin/Secretary)
 */
const deleteServiceCategory = async (req, res) => {
  const { id } = req.params;

  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          services: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('دسته‌بندی یافت نشد', 404);
  }

  // Check if category has services
  if (category._count.services > 0) {
    throw new AppError('نمی‌توان دسته‌بندی دارای خدمت را حذف کرد. ابتدا خدمات را به دسته‌بندی دیگری منتقل کنید', 400);
  }

  await prisma.serviceCategory.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'دسته‌بندی خدمت با موفقیت حذف شد',
  });
};

module.exports = {
  getArticleCategories,
  getServiceCategories,
  getArticleCategory,
  getServiceCategory,
  createArticleCategory,
  createServiceCategory,
  updateArticleCategory,
  updateServiceCategory,
  deleteArticleCategory,
  deleteServiceCategory,
};

