const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const { AppError } = require("../middlewares/errorHandler");
const {
  paginate,
  createPaginationMeta,
  formatPhoneNumber,
} = require("../utils/helpers");
const fs = require("fs").promises;
const path = require("path");

/**
 * Get all users (Admin/Secretary)
 */
const getUsers = async (req, res) => {
  const { page = 1, limit = 10, role, search, clinicId } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};

  // If secretary, only show users from their clinic
  if (req.session.userRole === "SECRETARY") {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (!currentUser || !currentUser.clinicId) {
      throw new AppError("شما به کلینیک اختصاص داده نشده‌اید", 403);
    }

    where.clinicId = currentUser.clinicId;
  }

  // Filter by role
  if (role && ["ADMIN", "SECRETARY", "PATIENT"].includes(role)) {
    where.role = role;
  }

  // Filter by clinic (only for admin)
  if (clinicId && req.session.userRole === "ADMIN") {
    where.clinicId = clinicId;
  }

  // Search functionality
  if (search && typeof search === "string" && search.trim().length > 0) {
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
      orderBy: { createdAt: "desc" },
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
 * Get single user by ID (Admin/Secretary)
 */
const getUser = async (req, res) => {
  const { id } = req.params;

  // If secretary, check if user belongs to their clinic
  if (req.session.userRole === "SECRETARY") {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (!currentUser || !currentUser.clinicId) {
      throw new AppError("شما به کلینیک اختصاص داده نشده‌اید", 403);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { clinicId: true, role: true },
    });

    if (!targetUser) {
      throw new AppError("کاربر یافت نشد", 404);
    }

    // Secretaries cannot access ADMIN users
    if (targetUser.role === "ADMIN") {
      throw new AppError("شما دسترسی لازم را ندارید", 403);
    }

    // Secretaries can only access users from their clinic
    if (targetUser.clinicId !== currentUser.clinicId) {
      throw new AppError("شما دسترسی لازم را ندارید", 403);
    }
  }

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
    throw new AppError("کاربر یافت نشد", 404);
  }

  res.json({
    success: true,
    data: { user },
  });
};

/**
 * Create user (Admin/Secretary)
 */
const createUser = async (req, res) => {
  const {
    phoneNumber,
    firstName,
    lastName,
    password,
    role = "PATIENT",
    nationalCode,
    address,
    gender,
    clinicId,
  } = req.body;

  // If secretary, restrict role and clinic
  if (req.session.userRole === "SECRETARY") {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (!currentUser || !currentUser.clinicId) {
      throw new AppError("شما به کلینیک اختصاص داده نشده‌اید", 403);
    }

    // Secretaries cannot create ADMIN users
    if (role === "ADMIN") {
      throw new AppError("شما نمی‌توانید کاربر مدیر ایجاد کنید", 403);
    }

    // Secretaries can only create users for their own clinic
    if (clinicId && clinicId !== currentUser.clinicId) {
      throw new AppError(
        "شما نمی‌توانید کاربر برای کلینیک دیگری ایجاد کنید",
        403
      );
    }
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Check if phone number already exists
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
  });

  if (existingUser) {
    throw new AppError("این شماره تلفن قبلاً ثبت شده است", 400);
  }

  // Validate role
  if (!["ADMIN", "SECRETARY", "PATIENT"].includes(role)) {
    throw new AppError("نقش کاربر نامعتبر است", 400);
  }

  // If secretary, set clinicId to their clinic
  let finalClinicId = clinicId;
  if (req.session.userRole === "SECRETARY") {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });
    finalClinicId = currentUser.clinicId;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Handle profile image
  let profileImage = req.file ? `/uploads/users/${req.file.filename}` : null;

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
      clinicId: finalClinicId || null,
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
    message: "کاربر با موفقیت ایجاد شد",
    data: { user },
  });
};

/**
 * Update user (Admin/Secretary)
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

  // Get current user (the one being updated)
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  // If secretary, check permissions
  if (req.session.userRole === "SECRETARY") {
    const currentSecretary = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (!currentSecretary || !currentSecretary.clinicId) {
      throw new AppError("شما به کلینیک اختصاص داده نشده‌اید", 403);
    }

    // Secretaries cannot update ADMIN users
    if (targetUser.role === "ADMIN") {
      throw new AppError("شما نمی‌توانید کاربر مدیر را ویرایش کنید", 403);
    }

    // Secretaries can only update users from their clinic
    if (targetUser.clinicId !== currentSecretary.clinicId) {
      throw new AppError(
        "شما نمی‌توانید کاربر کلینیک دیگری را ویرایش کنید",
        403
      );
    }

    // Secretaries cannot change role to ADMIN
    if (role === "ADMIN") {
      throw new AppError("شما نمی‌توانید نقش کاربر را به مدیر تغییر دهید", 403);
    }

    // Secretaries cannot change clinicId
    if (clinicId !== undefined && clinicId !== currentSecretary.clinicId) {
      throw new AppError("شما نمی‌توانید کلینیک کاربر را تغییر دهید", 403);
    }
  }

  // Check if phone number is being changed and if it's already taken
  if (phoneNumber) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone !== targetUser.phoneNumber) {
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: formattedPhone },
      });

      if (existingUser) {
        throw new AppError("این شماره تلفن قبلاً ثبت شده است", 400);
      }
    }
  }

  // Validate role if provided
  if (role && !["ADMIN", "SECRETARY", "PATIENT"].includes(role)) {
    throw new AppError("نقش کاربر نامعتبر است", 400);
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
  // Only allow clinicId change for admins
  if (clinicId !== undefined && req.session.userRole === "ADMIN") {
    updateData.clinicId = clinicId || null;
  }

  // Handle profile image removal
  if (req.body.removeProfileImage === "true") {
    // Delete old image if exists
    if (targetUser.profileImage) {
      const imagePath = targetUser.profileImage.startsWith("/")
        ? targetUser.profileImage.slice(1)
        : targetUser.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    updateData.profileImage = null;
  }
  // Handle profile image upload
  else if (req.file) {
    // Delete old image if exists
    if (targetUser.profileImage) {
      const imagePath = targetUser.profileImage.startsWith("/")
        ? targetUser.profileImage.slice(1)
        : targetUser.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
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
    message: "کاربر با موفقیت به‌روزرسانی شد",
    data: { user },
  });
};

/**
 * Delete user (Admin/Secretary)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  // Prevent deleting yourself
  if (user.id === req.session.userId) {
    throw new AppError("شما نمی‌توانید حساب کاربری خود را حذف کنید", 400);
  }

  // If secretary, check permissions
  if (req.session.userRole === "SECRETARY") {
    const currentSecretary = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (!currentSecretary || !currentSecretary.clinicId) {
      throw new AppError("شما به کلینیک اختصاص داده نشده‌اید", 403);
    }

    // Secretaries cannot delete ADMIN users
    if (user.role === "ADMIN") {
      throw new AppError("شما نمی‌توانید کاربر مدیر را حذف کنید", 403);
    }

    // Secretaries can only delete users from their clinic
    if (user.clinicId !== currentSecretary.clinicId) {
      throw new AppError("شما نمی‌توانید کاربر کلینیک دیگری را حذف کنید", 403);
    }
  }

  // Delete profile image if exists
  if (user.profileImage) {
    const imagePath = user.profileImage.startsWith("/")
      ? user.profileImage.slice(1)
      : user.profileImage;
    const fullImagePath = path.join(process.cwd(), imagePath);
    try {
      await fs.unlink(fullImagePath);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "کاربر با موفقیت حذف شد",
  });
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
