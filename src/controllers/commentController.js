const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { paginate, createPaginationMeta } = require("../utils/helpers");

/**
 * Get all doctor comments (Admin only)
 */
const getAllDoctorComments = async (req, res) => {
  const { page = 1, limit = 10, published, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { doctorId: { not: null }, parentId: null };

  if (published !== undefined) {
    where.published = published === "true";
  }

  // Search functionality
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      {
        doctor: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get all article comments (Admin only)
 */
const getAllArticleComments = async (req, res) => {
  const { page = 1, limit = 10, published, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { articleId: { not: null }, parentId: null };

  if (published !== undefined) {
    where.published = published === "true";
  }

  // Search functionality
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      { article: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        article: {
          select: {
            title: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get all service comments (Admin only)
 */
const getAllServiceComments = async (req, res) => {
  const { page = 1, limit = 10, published, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { serviceId: { not: null }, parentId: null };

  if (published !== undefined) {
    where.published = published === "true";
  }

  // Search functionality
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      { service: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get comments for a doctor
 */
const getDoctorComments = async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { doctorId };

  // Only show published comments to non-admin users
  if (
    req.session.userRole !== "ADMIN" &&
    req.session.userRole !== "SECRETARY"
  ) {
    where.published = true;
  }

  // Only get main comments (not replies)
  where.parentId = null;

  // Filter replies by published status for non-admin users
  const isAdminOrSecretary =
    req.session.userRole === "ADMIN" || req.session.userRole === "SECRETARY";
  const repliesWhere = isAdminOrSecretary ? {} : { published: true };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          where: repliesWhere,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get comments for an article
 */
const getArticleComments = async (req, res) => {
  const { articleId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { articleId };

  // Only show published comments to non-admin users
  if (
    req.session.userRole !== "ADMIN" &&
    req.session.userRole !== "SECRETARY"
  ) {
    where.published = true;
  }

  // Only get main comments (not replies)
  where.parentId = null;

  // Filter replies by published status for non-admin users
  const isAdminOrSecretary =
    req.session.userRole === "ADMIN" || req.session.userRole === "SECRETARY";
  const repliesWhere = isAdminOrSecretary ? {} : { published: true };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          where: repliesWhere,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get comments for a service
 */
const getServiceComments = async (req, res) => {
  const { serviceId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = { serviceId };

  // Only show published comments to non-admin users
  if (
    req.session.userRole !== "ADMIN" &&
    req.session.userRole !== "SECRETARY"
  ) {
    where.published = true;
  }

  // Only get main comments (not replies)
  where.parentId = null;

  // Filter replies by published status for non-admin users
  const isAdminOrSecretary =
    req.session.userRole === "ADMIN" || req.session.userRole === "SECRETARY";
  const repliesWhere = isAdminOrSecretary ? {} : { published: true };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          where: repliesWhere,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Create comment for doctor (Patient only)
 */
const createDoctorComment = async (req, res) => {
  const { doctorId } = req.params;
  const { content, rating } = req.body;

  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new AppError("پزشک یافت نشد", 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("امتیاز باید بین ۱ تا ۵ باشد", 400);
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
    message: "نظر شما با موفقیت ثبت شد",
    data: { comment },
  });
};

/**
 * Create comment for article (Patient only)
 */
const createArticleComment = async (req, res) => {
  const { articleId } = req.params;
  const { content, rating } = req.body;

  // Check if article exists
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new AppError("مقاله یافت نشد", 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("امتیاز باید بین ۱ تا ۵ باشد", 400);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      rating: rating ? parseInt(rating) : null,
      userId: req.session.userId,
      articleId,
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
    message: "نظر شما با موفقیت ثبت شد",
    data: { comment },
  });
};

/**
 * Create comment for service (Patient only)
 */
const createServiceComment = async (req, res) => {
  const { serviceId } = req.params;
  const { content, rating } = req.body;

  // Check if service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError("خدمت یافت نشد", 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("امتیاز باید بین ۱ تا ۵ باشد", 400);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      rating: rating ? parseInt(rating) : null,
      userId: req.session.userId,
      serviceId,
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
    message: "نظر شما با موفقیت ثبت شد",
    data: { comment },
  });
};

/**
 * Reply to a comment (Authenticated users)
 * Only replies to main comments (no nested replies)
 */
const replyToComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  // Find the parent comment
  const parentComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!parentComment) {
    throw new AppError("نظر یافت نشد", 404);
  }

  // Only allow replies to main comments (not to replies)
  if (parentComment.parentId) {
    throw new AppError("فقط به کامنت اصلی می‌توان پاسخ داد", 400);
  }

  // Create reply with same entity reference as parent
  const reply = await prisma.comment.create({
    data: {
      content,
      userId: req.session.userId,
      parentId: id,
      // Copy entity reference from parent
      doctorId: parentComment.doctorId,
      articleId: parentComment.articleId,
      serviceId: parentComment.serviceId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      parent: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "پاسخ شما با موفقیت ثبت شد",
    data: { reply },
  });
};

/**
 * Update comment (Owner or Admin)
 */
const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content, rating, published } = req.body;

  const existingComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!existingComment) {
    throw new AppError("نظر یافت نشد", 404);
  }

  // Check ownership or admin
  const isOwner = existingComment.userId === req.session.userId;
  const isAdmin =
    req.session.userRole === "ADMIN" || req.session.userRole === "SECRETARY";

  if (!isOwner && !isAdmin) {
    throw new AppError("شما دسترسی لازم را ندارید", 403);
  }

  // Only admin can change published status
  if (published !== undefined && !isAdmin) {
    throw new AppError("فقط ادمین می‌تواند وضعیت انتشار را تغییر دهد", 403);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("امتیاز باید بین ۱ تا ۵ باشد", 400);
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: {
      ...(content && { content }),
      ...(rating !== undefined && { rating: rating ? parseInt(rating) : null }),
      ...(published !== undefined && isAdmin && { published }),
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
    message: "نظر با موفقیت به‌روزرسانی شد",
    data: { comment },
  });
};

/**
 * Toggle comment published status (Admin only)
 */
const toggleCommentStatus = async (req, res) => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    throw new AppError("نظر یافت نشد", 404);
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: {
      published: !comment.published,
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
    message: `نظر ${updatedComment.published ? "منتشر" : "پنهان"} شد`,
    data: { comment: updatedComment },
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
    throw new AppError("نظر یافت نشد", 404);
  }

  // Check ownership or admin
  if (
    comment.userId !== req.session.userId &&
    req.session.userRole !== "ADMIN"
  ) {
    throw new AppError("شما دسترسی لازم را ندارید", 403);
  }

  await prisma.comment.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "نظر با موفقیت حذف شد",
  });
};

module.exports = {
  getAllDoctorComments,
  getAllArticleComments,
  getAllServiceComments,
  getDoctorComments,
  getArticleComments,
  getServiceComments,
  createDoctorComment,
  createArticleComment,
  createServiceComment,
  replyToComment,
  updateComment,
  toggleCommentStatus,
  deleteComment,
};
