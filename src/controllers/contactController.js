const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, formatPhoneNumberOptional } = require('../utils/helpers');

/**
 * Get all contact messages (Admin only)
 */
const getContactMessages = async (req, res) => {
  const { page = 1, limit = 10, read, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Filter by read status
  if (read !== undefined) {
    where.read = read === 'true';
  }

  // Search functionality
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.count({ where }),
  ]);

  res.json({
    success: true,
    data: { messages },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single contact message (Admin only)
 */
const getContactMessage = async (req, res) => {
  const { id } = req.params;

  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new AppError('پیام یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { message },
  });
};

/**
 * Create contact message (Public)
 */
const createContactMessage = async (req, res) => {
  const { name, email, phoneNumber, subject, message } = req.body;

  // Normalize phone number if provided
  const normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber);
  
  // Normalize email - set to null if empty
  const normalizedEmail = email && email.trim() !== '' ? email.trim() : null;

  const contactMessage = await prisma.contactMessage.create({
    data: {
      name,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      subject,
      message,
    },
  });

  res.status(201).json({
    success: true,
    message: 'پیام شما با موفقیت ارسال شد',
    data: { message: contactMessage },
  });
};

/**
 * Mark message as read (Admin only)
 */
const markAsRead = async (req, res) => {
  const { id } = req.params;

  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new AppError('پیام یافت نشد', 404);
  }

  const updatedMessage = await prisma.contactMessage.update({
    where: { id },
    data: { read: true },
  });

  res.json({
    success: true,
    message: 'پیام به عنوان خوانده شده علامت‌گذاری شد',
    data: { message: updatedMessage },
  });
};

/**
 * Mark message as unread (Admin only)
 */
const markAsUnread = async (req, res) => {
  const { id } = req.params;

  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new AppError('پیام یافت نشد', 404);
  }

  const updatedMessage = await prisma.contactMessage.update({
    where: { id },
    data: { read: false },
  });

  res.json({
    success: true,
    message: 'پیام به عنوان خوانده نشده علامت‌گذاری شد',
    data: { message: updatedMessage },
  });
};

/**
 * Delete contact message (Admin only)
 */
const deleteContactMessage = async (req, res) => {
  const { id } = req.params;

  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new AppError('پیام یافت نشد', 404);
  }

  await prisma.contactMessage.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'پیام با موفقیت حذف شد',
  });
};

/**
 * Get contact messages statistics (Admin only)
 */
const getContactMessagesStats = async (req, res) => {
  const [total, unread, read] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.count({ where: { read: true } }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      unread,
      read,
    },
  });
};

module.exports = {
  getContactMessages,
  getContactMessage,
  createContactMessage,
  markAsRead,
  markAsUnread,
  deleteContactMessage,
  getContactMessagesStats,
};

