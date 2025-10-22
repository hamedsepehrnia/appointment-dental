const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, createSlug } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all articles (published only for public)
 */
const getArticles = async (req, res) => {
  const { page = 1, limit = 10, published } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Only show published articles to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.article.count({ where }),
  ]);

  res.json({
    success: true,
    data: { articles },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single article by slug or ID
 */
const getArticle = async (req, res) => {
  const { identifier } = req.params;

  // Try to find by slug first, then by ID
  const article = await prisma.article.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
  });

  if (!article) {
    throw new AppError('مقاله یافت نشد', 404);
  }

  // Check if article is published (for non-admin/secretary)
  if (!article.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('مقاله یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { article },
  });
};

/**
 * Create article (Admin/Secretary)
 */
const createArticle = async (req, res) => {
  const { title, content, excerpt, published } = req.body;
  
  const slug = createSlug(title);
  const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

  // Check if slug already exists
  const existingArticle = await prisma.article.findUnique({
    where: { slug },
  });

  if (existingArticle) {
    // Add timestamp to make slug unique
    slug = `${slug}-${Date.now()}`;
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      published: published || false,
    },
  });

  res.status(201).json({
    success: true,
    message: 'مقاله با موفقیت ایجاد شد',
    data: { article },
  });
};

/**
 * Update article (Admin/Secretary)
 */
const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, published } = req.body;

  const currentArticle = await prisma.article.findUnique({
    where: { id },
  });

  if (!currentArticle) {
    throw new AppError('مقاله یافت نشد', 404);
  }

  let slug = currentArticle.slug;
  if (title && title !== currentArticle.title) {
    slug = createSlug(title);
    
    // Check if new slug exists
    const existingArticle = await prisma.article.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Handle cover image
  let coverImage = currentArticle.coverImage;
  if (req.file) {
    // Delete old image if exists
    if (currentArticle.coverImage) {
      const oldImagePath = path.join(process.cwd(), currentArticle.coverImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    coverImage = `/uploads/images/${req.file.filename}`;
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(title && { title, slug }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(coverImage && { coverImage }),
      ...(published !== undefined && { published }),
    },
  });

  res.json({
    success: true,
    message: 'مقاله با موفقیت به‌روزرسانی شد',
    data: { article },
  });
};

/**
 * Delete article (Admin/Secretary)
 */
const deleteArticle = async (req, res) => {
  const { id } = req.params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new AppError('مقاله یافت نشد', 404);
  }

  // Delete cover image if exists
  if (article.coverImage) {
    const imagePath = path.join(process.cwd(), article.coverImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  await prisma.article.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'مقاله با موفقیت حذف شد',
  });
};

module.exports = {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
};

