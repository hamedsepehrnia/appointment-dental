const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, createSlug, formatPhoneNumberOptional } = require('../utils/helpers');

/**
 * Get all clinics
 */
const getClinics = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, take } = paginate(page, limit);

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      skip,
      take,
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clinic.count(),
  ]);

  res.json({
    success: true,
    data: { clinics },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single clinic
 */
const getClinic = async (req, res) => {
  const { id } = req.params;

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    include: {
      doctors: {
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              university: true,
              skills: true,
            },
          },
        },
      },
      secretaries: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!clinic) {
    throw new AppError("کلینیک یافت نشد", 404);
  }

  res.json({
    success: true,
    data: { clinic },
  });
};

/**
 * Create clinic (Admin only)
 */
const createClinic = async (req, res) => {
  const { name, address, phoneNumber, description, latitude, longitude, workingHours } = req.body;
  
  // Normalize phone number if provided
  const normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber);

  // Generate unique slug
  let baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug is unique
  while (await prisma.clinic.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Parse latitude and longitude if they are strings
  const parsedLatitude = latitude ? parseFloat(latitude) : null;
  const parsedLongitude = longitude ? parseFloat(longitude) : null;

  // Parse workingHours if it's a string (from form-data)
  let parsedWorkingHours = null;
  if (workingHours) {
    if (typeof workingHours === 'string') {
      try {
        parsedWorkingHours = JSON.parse(workingHours);
      } catch (error) {
        throw new AppError('فرمت ساعات کاری معتبر نیست', 400);
      }
    } else {
      parsedWorkingHours = workingHours;
    }
  }

  const clinic = await prisma.clinic.create({
    data: {
      name,
      slug,
      address,
      phoneNumber: normalizedPhoneNumber || '',
      description,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      workingHours: parsedWorkingHours,
    },
  });

  res.status(201).json({
    success: true,
    message: "کلینیک با موفقیت ایجاد شد",
    data: { clinic },
  });
};

/**
 * Update clinic (Admin/Secretary)
 */
const updateClinic = async (req, res) => {
  const { id } = req.params;
  const { name, address, phoneNumber, description, latitude, longitude, workingHours } =
    req.body;

  // If secretary, check if they belong to this clinic
  if (req.session.userRole === "SECRETARY") {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { clinicId: true },
    });

    if (user.clinicId !== id) {
      throw new AppError("شما دسترسی لازم را ندارید", 403);
    }
  }

  // Generate new slug if name is being updated
  let slug;
  if (name) {
    const currentClinic = await prisma.clinic.findUnique({ where: { id } });
    const baseSlug = createSlug(name);
    slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (
      await prisma.clinic.findFirst({
        where: { slug, id: { not: id } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Parse latitude and longitude if they are strings
  let parsedLatitude = undefined;
  let parsedLongitude = undefined;
  if (latitude !== undefined) {
    parsedLatitude =
      latitude === null || latitude === "" ? null : parseFloat(latitude);
  }
  if (longitude !== undefined) {
    parsedLongitude =
      longitude === null || longitude === "" ? null : parseFloat(longitude);
  }

  // Normalize phone number if provided
  let normalizedPhoneNumber = undefined;
  if (phoneNumber !== undefined) {
    normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber) || '';
  }

  // Parse workingHours if it's a string (from form-data)
  let parsedWorkingHours = undefined;
  if (workingHours !== undefined) {
    if (workingHours === null || workingHours === '') {
      parsedWorkingHours = null;
    } else if (typeof workingHours === 'string') {
      try {
        parsedWorkingHours = JSON.parse(workingHours);
      } catch (error) {
        throw new AppError('فرمت ساعات کاری معتبر نیست', 400);
      }
    } else {
      parsedWorkingHours = workingHours;
    }
  }

  const clinic = await prisma.clinic.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(address && { address }),
      ...(normalizedPhoneNumber !== undefined && { phoneNumber: normalizedPhoneNumber }),
      ...(description !== undefined && { description }),
      ...(latitude !== undefined && { latitude: parsedLatitude }),
      ...(longitude !== undefined && { longitude: parsedLongitude }),
      ...(parsedWorkingHours !== undefined && { workingHours: parsedWorkingHours }),
    },
  });

  res.json({
    success: true,
    message: "کلینیک با موفقیت به‌روزرسانی شد",
    data: { clinic },
  });
};

/**
 * Delete clinic (Admin only)
 */
const deleteClinic = async (req, res) => {
  const { id } = req.params;

  await prisma.clinic.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "کلینیک با موفقیت حذف شد",
  });
};

module.exports = {
  getClinics,
  getClinic,
  createClinic,
  updateClinic,
  deleteClinic,
};
