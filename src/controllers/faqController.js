const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * Get all FAQs
 */
const getFaqs = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const { skip, take } = paginate(page, limit);

  const [faqs, total] = await Promise.all([
    prisma.faq.findMany({
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.faq.count(),
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

  res.json({
    success: true,
    data: { faq },
  });
};

/**
 * Create FAQ (Admin/Secretary)
 */
const createFaq = async (req, res) => {
  const { question, answer, order } = req.body;

  const faq = await prisma.faq.create({
    data: {
      question,
      answer,
      order: order || 0,
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
  const { question, answer, order } = req.body;

  const faq = await prisma.faq.update({
    where: { id },
    data: {
      ...(question && { question }),
      ...(answer && { answer }),
      ...(order !== undefined && { order }),
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

module.exports = {
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
};

