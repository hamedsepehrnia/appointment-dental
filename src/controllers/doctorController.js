const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, createSlug } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all doctors
 */
const getDoctors = async (req, res) => {
  const { page = 1, limit = 10, clinicId, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};
  if (clinicId) {
    where.clinics = {
      some: { clinicId },
    };
  }
  
  // Search functionality
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { university: { contains: search, mode: 'insensitive' } },
      { biography: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take,
      include: {
        clinics: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.doctor.count({ where }),
  ]);

  res.json({
    success: true,
    data: { doctors },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single doctor
 */
const getDoctor = async (req, res) => {
  const { id } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      clinics: {
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
            },
          },
        },
      },
      comments: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!doctor) {
    throw new AppError('پزشک یافت نشد', 404);
  }

  // Calculate average rating
  const avgRating = doctor.comments.length > 0
    ? doctor.comments.reduce((sum, c) => sum + (c.rating || 0), 0) / doctor.comments.filter(c => c.rating).length
    : null;

  res.json({
    success: true,
    data: {
      doctor,
      stats: {
        totalComments: doctor.comments.length,
        averageRating: avgRating ? avgRating.toFixed(1) : null,
      },
    },
  });
};

/**
 * Create doctor (Admin/Secretary)
 */
const createDoctor = async (req, res) => {
  const {
    firstName,
    lastName,
    university,
    biography,
    skills,
    medicalLicenseNo,
    clinicIds,
    workingDays,
  } = req.body;

  const profileImage = req.file ? `/uploads/doctors/${req.file.filename}` : null;

  // Generate unique slug from firstName + lastName
  let baseSlug = createSlug(`${firstName}-${lastName}`);
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug is unique
  while (await prisma.doctor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Parse workingDays if it's a string (from form-data)
  let parsedWorkingDays = null;
  if (workingDays) {
    if (typeof workingDays === 'string') {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (error) {
        throw new AppError('فرمت روزهای کاری معتبر نیست', 400);
      }
    } else {
      parsedWorkingDays = workingDays;
    }
  }

  // Create doctor
  const doctor = await prisma.doctor.create({
    data: {
      firstName,
      lastName,
      slug,
      profileImage,
      university,
      biography,
      skills: skills || [],
      medicalLicenseNo,
      workingDays: parsedWorkingDays,
    },
  });

  // Link to clinics
  if (clinicIds && clinicIds.length > 0) {
    await prisma.doctorClinic.createMany({
      data: clinicIds.map((clinicId) => ({
        doctorId: doctor.id,
        clinicId,
      })),
    });
  }

  const doctorWithClinics = await prisma.doctor.findUnique({
    where: { id: doctor.id },
    include: {
      clinics: {
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'پزشک با موفقیت ایجاد شد',
    data: { doctor: doctorWithClinics },
  });
};

/**
 * Update doctor (Admin/Secretary)
 */
const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    university,
    biography,
    skills,
    medicalLicenseNo,
    clinicIds,
    workingDays,
  } = req.body;

  // Get current doctor
  const currentDoctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!currentDoctor) {
    throw new AppError('پزشک یافت نشد', 404);
  }

  // Handle profile image
  let profileImage = currentDoctor.profileImage;
  if (req.file) {
    // Delete old image if exists
    if (currentDoctor.profileImage) {
      const oldImagePath = path.join(process.cwd(), currentDoctor.profileImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    profileImage = `/uploads/doctors/${req.file.filename}`;
  }

  // Generate new slug if firstName or lastName is being updated
  let slug;
  if (firstName || lastName) {
    const fullName = `${firstName || currentDoctor.firstName}-${lastName || currentDoctor.lastName}`;
    const baseSlug = createSlug(fullName);
    slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.doctor.findFirst({ 
      where: { slug, id: { not: id } } 
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Parse workingDays if it's a string (from form-data)
  let parsedWorkingDays = undefined;
  if (workingDays !== undefined) {
    if (workingDays === null || workingDays === '') {
      parsedWorkingDays = null;
    } else if (typeof workingDays === 'string') {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (error) {
        throw new AppError('فرمت روزهای کاری معتبر نیست', 400);
      }
    } else {
      parsedWorkingDays = workingDays;
    }
  }

  // Update doctor
  const doctor = await prisma.doctor.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(slug && { slug }),
      ...(profileImage && { profileImage }),
      ...(university && { university }),
      ...(biography !== undefined && { biography }),
      ...(skills && { skills }),
      ...(medicalLicenseNo && { medicalLicenseNo }),
      ...(workingDays !== undefined && { workingDays: parsedWorkingDays }),
    },
  });

  // Update clinic associations
  if (clinicIds) {
    // Remove existing associations
    await prisma.doctorClinic.deleteMany({
      where: { doctorId: id },
    });

    // Create new associations
    if (clinicIds.length > 0) {
      await prisma.doctorClinic.createMany({
        data: clinicIds.map((clinicId) => ({
          doctorId: id,
          clinicId,
        })),
      });
    }
  }

  const updatedDoctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      clinics: {
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'پزشک با موفقیت به‌روزرسانی شد',
    data: { doctor: updatedDoctor },
  });
};

/**
 * Delete doctor (Admin only)
 */
const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    throw new AppError('پزشک یافت نشد', 404);
  }

  // Delete profile image if exists
  if (doctor.profileImage) {
    const imagePath = path.join(process.cwd(), doctor.profileImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  await prisma.doctor.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'پزشک با موفقیت حذف شد',
  });
};

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};

