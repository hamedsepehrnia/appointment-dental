const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * Get all FAQs (published only for public)
 */
const getFaqs = async (req, res) => {
  const { page = 1, limit = 50, published } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Only show published FAQs to non-admin/secretary users
  if (req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === 'true';
  }

  const [faqs, total] = await Promise.all([
    prisma.faq.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.faq.count({ where }),
  ]);

  res.json({
    success: true,
    data: { faqs },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single FAQ
 */
const getFaq = async (req, res) => {
  const { id } = req.params;

  const faq = await prisma.faq.findUnique({
    where: { id },
  });

  if (!faq) {
    throw new AppError('سوال یافت نشد', 404);
  }

  // Check if FAQ is published (for non-admin/secretary)
  if (!faq.published && req.session.userRole !== 'ADMIN' && req.session.userRole !== 'SECRETARY') {
    throw new AppError('سوال یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { faq },
  });
};

/**
 * Create FAQ (Admin/Secretary)
 */
const createFaq = async (req, res) => {
  const { question, answer, order, published } = req.body;

  const faq = await prisma.faq.create({
    data: {
      question,
      answer,
      order: order || 0,
      published: published !== undefined ? published : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'سوال با موفقیت ایجاد شد',
    data: { faq },
  });
};

/**
 * Update FAQ (Admin/Secretary)
 */
const updateFaq = async (req, res) => {
  const { id } = req.params;
  const { question, answer, order, published } = req.body;

  const faq = await prisma.faq.update({
    where: { id },
    data: {
      ...(question && { question }),
      ...(answer && { answer }),
      ...(order !== undefined && { order }),
      ...(published !== undefined && { published }),
    },
  });

  res.json({
    success: true,
    message: 'سوال با موفقیت به‌روزرسانی شد',
    data: { faq },
  });
};

/**
 * Delete FAQ (Admin/Secretary)
 */
const deleteFaq = async (req, res) => {
  const { id } = req.params;

  await prisma.faq.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'سوال با موفقیت حذف شد',
  });
};

/**
 * Reorder FAQs (Admin/Secretary)
 * Update multiple FAQ orders at once
 */
const reorderFaqs = async (req, res) => {
  const { faqs } = req.body; // Array of { id, order }

  if (!Array.isArray(faqs) || faqs.length === 0) {
    throw new AppError('لیست سوالات معتبر نیست', 400);
  }

  // Update all FAQs in a transaction
  await prisma.$transaction(
    faqs.map((faq) =>
      prisma.faq.update({
        where: { id: faq.id },
        data: { order: faq.order },
      })
    )
  );

  res.json({
    success: true,
    message: 'ترتیب سوالات با موفقیت به‌روزرسانی شد',
  });
};

module.exports = {
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
};

