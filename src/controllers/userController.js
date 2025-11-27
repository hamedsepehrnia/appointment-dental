const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, formatPhoneNumber } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all users (Admin only)
 */
const getUsers = async (req, res) => {
  const { page = 1, limit = 10, role, search, clinicId } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};

  // Filter by role
  if (role && ['ADMIN', 'SECRETARY', 'PATIENT'].includes(role)) {
    where.role = role;
  }

  // Filter by clinic
  if (clinicId) {
    where.clinicId = clinicId;
  }

  // Search functionality
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const searchTerm = search.trim();
    where.OR = [
      { firstName: { contains: searchTerm } },
      { lastName: { contains: searchTerm } },
      { phoneNumber: { contains: searchTerm } },
      { nationalCode: { contains: searchTerm } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        nationalCode: true,
        address: true,
        gender: true,
        profileImage: true,
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: { users },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single user by ID (Admin only)
 */
const getUser = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      nationalCode: true,
      address: true,
      gender: true,
      profileImage: true,
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('کاربر یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
};

/**
 * Create user (Admin only)
 */
const createUser = async (req, res) => {
  const {
    phoneNumber,
    firstName,
    lastName,
    password,
    role = 'PATIENT',
    nationalCode,
    address,
    gender,
    clinicId,
  } = req.body;

  // Format phone number
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Check if phone number already exists
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
  });

  if (existingUser) {
    throw new AppError('این شماره تلفن قبلاً ثبت شده است', 400);
  }

  // Validate role
  if (!['ADMIN', 'SECRETARY', 'PATIENT'].includes(role)) {
    throw new AppError('نقش کاربر نامعتبر است', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Handle profile image
  const profileImage = req.file
    ? `/uploads/users/${req.file.filename}`
    : null;

  // Create user
  const user = await prisma.user.create({
    data: {
      phoneNumber: formattedPhone,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      nationalCode: nationalCode || null,
      address: address || null,
      gender: gender || null,
      clinicId: clinicId || null,
      profileImage,
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      nationalCode: true,
      address: true,
      gender: true,
      profileImage: true,
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'کاربر با موفقیت ایجاد شد',
    data: { user },
  });
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    phoneNumber,
    firstName,
    lastName,
    password,
    role,
    nationalCode,
    address,
    gender,
    clinicId,
  } = req.body;

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!currentUser) {
    throw new AppError('کاربر یافت نشد', 404);
  }

  // Check if phone number is being changed and if it's already taken
  if (phoneNumber) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone !== currentUser.phoneNumber) {
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: formattedPhone },
      });

      if (existingUser) {
        throw new AppError('این شماره تلفن قبلاً ثبت شده است', 400);
      }
    }
  }

  // Validate role if provided
  if (role && !['ADMIN', 'SECRETARY', 'PATIENT'].includes(role)) {
    throw new AppError('نقش کاربر نامعتبر است', 400);
  }

  // Prepare update data
  const updateData = {};

  if (phoneNumber) {
    updateData.phoneNumber = formatPhoneNumber(phoneNumber);
  }
  if (firstName) {
    updateData.firstName = firstName;
  }
  if (lastName) {
    updateData.lastName = lastName;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  if (role) {
    updateData.role = role;
  }
  if (nationalCode !== undefined) {
    updateData.nationalCode = nationalCode || null;
  }
  if (address !== undefined) {
    updateData.address = address || null;
  }
  if (gender) {
    updateData.gender = gender;
  }
  if (clinicId !== undefined) {
    updateData.clinicId = clinicId || null;
  }

  // Handle profile image
  if (req.file) {
    // Delete old image if exists
    if (currentUser.profileImage) {
      const imagePath = currentUser.profileImage.startsWith('/')
        ? currentUser.profileImage.slice(1)
        : currentUser.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    updateData.profileImage = `/uploads/users/${req.file.filename}`;
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      nationalCode: true,
      address: true,
      gender: true,
      profileImage: true,
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: 'کاربر با موفقیت به‌روزرسانی شد',
    data: { user },
  });
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('کاربر یافت نشد', 404);
  }

  // Prevent deleting yourself
  if (user.id === req.session.userId) {
    throw new AppError('شما نمی‌توانید حساب کاربری خود را حذف کنید', 400);
  }

  // Delete profile image if exists
  if (user.profileImage) {
    const imagePath = user.profileImage.startsWith('/')
      ? user.profileImage.slice(1)
      : user.profileImage;
    const fullImagePath = path.join(process.cwd(), imagePath);
    try {
      await fs.unlink(fullImagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'کاربر با موفقیت حذف شد',
  });
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};

