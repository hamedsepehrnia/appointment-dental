const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * Get comments for a doctor
 */
const getDoctorComments = async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { skip, take } = paginate(page, limit);

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { doctorId },
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where: { doctorId } }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Create comment (Patient only)
 */
const createComment = async (req, res) => {
  const { doctorId } = req.params;
  const { content, rating } = req.body;

  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new AppError('پزشک یافت نشد', 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('امتیاز باید بین ۱ تا ۵ باشد', 400);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      rating: rating ? parseInt(rating) : null,
      userId: req.session.userId,
      doctorId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'نظر شما با موفقیت ثبت شد',
    data: { comment },
  });
};

/**
 * Update comment (Owner only)
 */
const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content, rating } = req.body;

  const existingComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!existingComment) {
    throw new AppError('نظر یافت نشد', 404);
  }

  // Check ownership
  if (existingComment.userId !== req.session.userId) {
    throw new AppError('شما فقط می‌توانید نظر خود را ویرایش کنید', 403);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('امتیاز باید بین ۱ تا ۵ باشد', 400);
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: {
      ...(content && { content }),
      ...(rating !== undefined && { rating: rating ? parseInt(rating) : null }),
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'نظر با موفقیت به‌روزرسانی شد',
    data: { comment },
  });
};

/**
 * Delete comment (Owner or Admin)
 */
const deleteComment = async (req, res) => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    throw new AppError('نظر یافت نشد', 404);
  }

  // Check ownership or admin
  if (comment.userId !== req.session.userId && req.session.userRole !== 'ADMIN') {
    throw new AppError('شما دسترسی لازم را ندارید', 403);
  }

  await prisma.comment.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'نظر با موفقیت حذف شد',
  });
};

module.exports = {
  getDoctorComments,
  createComment,
  updateComment,
  deleteComment,
};

