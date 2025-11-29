const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const { sanitizeContent } = require('../utils/sanitizeHtml');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all reviews
 */
const getReviews = async (req, res) => {
  const { page = 1, limit = 10, search, published } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Published filter - only show published reviews to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }
  
  // Search functionality
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    success: true,
    data: { reviews },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single review by ID
 */
const getReview = async (req, res) => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new AppError('نظر یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { review },
  });
};

/**
 * Create review (public - users can submit reviews)
 */
const createReview = async (req, res) => {
  const {
    name,
    content,
    rating,
    order,
  } = req.body;

  // Validate rating
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new AppError('امتیاز باید بین 1 تا 5 باشد', 400);
  }

  const profileImage = req.file ? `/uploads/images/${req.file.filename}` : null;

  const review = await prisma.review.create({
    data: {
      name,
      content: sanitizeContent(content),
      rating: ratingNum,
      profileImage,
      order: order ? parseInt(order) : 0,
      published: false, // Reviews are not published by default, admin must approve
    },
  });

  res.status(201).json({
    success: true,
    message: 'نظر شما با موفقیت ثبت شد. پس از تایید ادمین نمایش داده خواهد شد.',
    data: { review },
  });
};

/**
 * Update review (Admin/Secretary)
 */
const updateReview = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    content,
    rating,
    published,
    order,
  } = req.body;

  const currentReview = await prisma.review.findUnique({
    where: { id },
  });

  if (!currentReview) {
    throw new AppError('نظر یافت نشد', 404);
  }

  // Validate rating if provided
  let ratingNum = currentReview.rating;
  if (rating !== undefined) {
    ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError('امتیاز باید بین 1 تا 5 باشد', 400);
    }
  }

  // Prepare update data
  const updateData = {};
  if (name) {
    updateData.name = name;
  }
  if (content) {
    updateData.content = sanitizeContent(content);
  }
  if (rating !== undefined) {
    updateData.rating = ratingNum;
  }
  if (published !== undefined) {
    updateData.published = published === 'true' || published === true;
  }
  if (order !== undefined) {
    updateData.order = parseInt(order) || 0;
  }

  // Handle profile image removal
  if (req.body.removeProfileImage === "true") {
    // Delete old image if exists
    if (currentReview.profileImage) {
      const imagePath = currentReview.profileImage.startsWith('/')
        ? currentReview.profileImage.slice(1)
        : currentReview.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    updateData.profileImage = null;
  }
  // Handle profile image upload
  else if (req.file) {
    if (currentReview.profileImage) {
      const imagePath = currentReview.profileImage.startsWith('/')
        ? currentReview.profileImage.slice(1)
        : currentReview.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    updateData.profileImage = `/uploads/images/${req.file.filename}`;
  }

  const review = await prisma.review.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'نظر با موفقیت به‌روزرسانی شد',
    data: { review },
  });
};

/**
 * Delete review (Admin/Secretary)
 */
const deleteReview = async (req, res) => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new AppError('نظر یافت نشد', 404);
  }

  // Delete profile image if exists
  if (review.profileImage) {
    const imagePath = path.join(process.cwd(), review.profileImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  await prisma.review.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'نظر با موفقیت حذف شد',
  });
};

module.exports = {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
};


