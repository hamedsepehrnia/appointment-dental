const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, formatPhoneNumber } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all doctor applications (Admin only)
 */
const getDoctorApplications = async (req, res) => {
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
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search, mode: 'insensitive' } },
      { doctorInfo: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.doctorApplication.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.doctorApplication.count({ where }),
  ]);

  res.json({
    success: true,
    data: { applications },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single doctor application (Admin only)
 */
const getDoctorApplication = async (req, res) => {
  const { id } = req.params;

  const application = await prisma.doctorApplication.findUnique({
    where: { id },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    throw new AppError('درخواست یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { application },
  });
};

/**
 * Create doctor application (Public)
 */
const createDoctorApplication = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, doctorInfo, clinicId } = req.body;

  // Normalize phone number
  const normalizedPhoneNumber = formatPhoneNumber(phoneNumber);
  
  // Normalize email - set to null if empty
  const normalizedEmail = email && email.trim() !== '' ? email.trim() : null;

  // Validate clinic if provided
  let validatedClinicId = null;
  if (clinicId && typeof clinicId === 'string' && clinicId.trim() !== '') {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId.trim() },
      select: { id: true },
    });

    if (!clinic) {
      throw new AppError('کلینیک انتخاب شده معتبر نیست', 400);
    }

    validatedClinicId = clinic.id;
  }

  // Handle documents upload (can be multiple files)
  let documents = null;
  if (req.files && req.files.length > 0) {
    const documentPaths = req.files.map(file => `/uploads/documents/${file.filename}`);
    documents = JSON.stringify(documentPaths);
  } else if (req.file) {
    // Single file
    documents = JSON.stringify([`/uploads/documents/${req.file.filename}`]);
  }

  const application = await prisma.doctorApplication.create({
    data: {
      firstName,
      lastName,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      doctorInfo,
      documents,
      clinicId: validatedClinicId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'درخواست شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.',
    data: { application },
  });
};

/**
 * Mark application as read (Admin only)
 */
const markAsRead = async (req, res) => {
  const { id } = req.params;

  const application = await prisma.doctorApplication.findUnique({
    where: { id },
  });

  if (!application) {
    throw new AppError('درخواست یافت نشد', 404);
  }

  const updatedApplication = await prisma.doctorApplication.update({
    where: { id },
    data: { read: true },
  });

  res.json({
    success: true,
    message: 'درخواست به عنوان خوانده شده علامت‌گذاری شد',
    data: { application: updatedApplication },
  });
};

/**
 * Mark application as unread (Admin only)
 */
const markAsUnread = async (req, res) => {
  const { id } = req.params;

  const application = await prisma.doctorApplication.findUnique({
    where: { id },
  });

  if (!application) {
    throw new AppError('درخواست یافت نشد', 404);
  }

  const updatedApplication = await prisma.doctorApplication.update({
    where: { id },
    data: { read: false },
  });

  res.json({
    success: true,
    message: 'درخواست به عنوان خوانده نشده علامت‌گذاری شد',
    data: { application: updatedApplication },
  });
};

/**
 * Delete doctor application (Admin only)
 */
const deleteDoctorApplication = async (req, res) => {
  const { id } = req.params;

  const application = await prisma.doctorApplication.findUnique({
    where: { id },
  });

  if (!application) {
    throw new AppError('درخواست یافت نشد', 404);
  }

  // Delete uploaded documents if exist
  if (application.documents) {
    try {
      const documentPaths = JSON.parse(application.documents);
      for (const docPath of documentPaths) {
        const fullPath = path.join(process.cwd(), docPath);
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          console.error(`Error deleting document ${docPath}:`, err);
        }
      }
    } catch (err) {
      console.error('Error parsing documents:', err);
    }
  }

  await prisma.doctorApplication.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'درخواست با موفقیت حذف شد',
  });
};

/**
 * Get doctor applications statistics (Admin only)
 */
const getDoctorApplicationsStats = async (req, res) => {
  const [total, unread, read] = await Promise.all([
    prisma.doctorApplication.count(),
    prisma.doctorApplication.count({ where: { read: false } }),
    prisma.doctorApplication.count({ where: { read: true } }),
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
  getDoctorApplications,
  getDoctorApplication,
  createDoctorApplication,
  markAsRead,
  markAsUnread,
  deleteDoctorApplication,
  getDoctorApplicationsStats,
};

