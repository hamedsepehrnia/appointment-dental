const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const {
  paginate,
  createPaginationMeta,
  createSlug,
} = require("../utils/helpers");
const fs = require("fs").promises;
const path = require("path");

/**
 * Get all doctors
 */
const getDoctors = async (req, res) => {
  const { page = 1, limit = 10, clinicId, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};

  // Filter by clinic
  if (clinicId) {
    where.clinics = {
      some: { clinicId },
    };
  }

  // Search functionality - باید trim شود و خالی نباشد
  if (search && typeof search === "string" && search.trim().length > 0) {
    const searchTerm = search.trim();
    const searchWords = searchTerm
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const searchConditions = [];

    // اگر چند کلمه وجود دارد، سعی می‌کنیم آنها را به firstName و lastName تقسیم کنیم
    if (searchWords.length >= 2) {
      // حالت اول: کلمه اول در firstName و بقیه در lastName (اولویت بالاتر)
      const firstNameTerm = searchWords[0];
      const lastNameTerm = searchWords.slice(1).join(" ");
      searchConditions.push({
        AND: [
          { firstName: { contains: firstNameTerm } },
          { lastName: { contains: lastNameTerm } },
        ],
      });
    }

    // جستجو در هر فیلد به صورت جداگانه
    searchConditions.push(
      { firstName: { contains: searchTerm } },
      { lastName: { contains: searchTerm } },
      { university: { contains: searchTerm } },
      { biography: { contains: searchTerm } }
    );

    // اگر clinicId هم وجود دارد، باید از AND استفاده کنیم
    if (clinicId) {
      where.AND = [
        { clinics: { some: { clinicId } } },
        { OR: searchConditions },
      ];
      // clinics را حذف کن چون در AND است
      delete where.clinics;
    } else {
      // اگر فقط search وجود دارد
      where.OR = searchConditions;
    }
  }

  // Debug: بررسی ساختار where
  if (process.env.NODE_ENV === "development") {
    console.log("Search query:", search);
    console.log("Where clause:", JSON.stringify(where, null, 2));
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
      orderBy: { createdAt: "desc" },
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
 * Get single doctor by slug or ID
 */
const getDoctor = async (req, res) => {
  const { identifier } = req.params;

  // Try to find by slug first, then by ID
  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ slug: identifier }, { id: identifier }],
    },
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!doctor) {
    throw new AppError("پزشک یافت نشد", 404);
  }

  // Calculate average rating
  const avgRating =
    doctor.comments.length > 0
      ? doctor.comments.reduce((sum, c) => sum + (c.rating || 0), 0) /
        doctor.comments.filter((c) => c.rating).length
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
    shortDescription,
    biography,
    skills,
    medicalLicenseNo,
    clinicIds,
    workingDays,
    isAppointmentEnabled,
  } = req.body;

  const profileImage = req.file
    ? `/uploads/doctors/${req.file.filename}`
    : null;

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
    if (typeof workingDays === "string") {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (error) {
        throw new AppError("فرمت روزهای کاری معتبر نیست", 400);
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
      shortDescription,
      university,
      biography,
      skills: skills || [],
      medicalLicenseNo,
      workingDays: parsedWorkingDays,
      isAppointmentEnabled: isAppointmentEnabled === true || isAppointmentEnabled === "true",
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
    message: "پزشک با موفقیت ایجاد شد",
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
    shortDescription,
    biography,
    skills,
    medicalLicenseNo,
    clinicIds,
    workingDays,
    isAppointmentEnabled,
  } = req.body;

  // Get current doctor
  const currentDoctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!currentDoctor) {
    throw new AppError("پزشک یافت نشد", 404);
  }

  // Generate new slug if firstName or lastName is being updated
  let slug;
  if (firstName || lastName) {
    const fullName = `${firstName || currentDoctor.firstName}-${
      lastName || currentDoctor.lastName
    }`;
    const baseSlug = createSlug(fullName);
    slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (
      await prisma.doctor.findFirst({
        where: { slug, id: { not: id } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Parse workingDays if it's a string (from form-data)
  let parsedWorkingDays = undefined;
  if (workingDays !== undefined) {
    if (workingDays === null || workingDays === "") {
      parsedWorkingDays = null;
    } else if (typeof workingDays === "string") {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (error) {
        throw new AppError("فرمت روزهای کاری معتبر نیست", 400);
      }
    } else {
      parsedWorkingDays = workingDays;
    }
  }

  // Prepare update data
  const updateData = {};
  if (firstName) {
    updateData.firstName = firstName;
  }
  if (lastName) {
    updateData.lastName = lastName;
  }
  if (slug) {
    updateData.slug = slug;
  }
  if (shortDescription !== undefined) {
    updateData.shortDescription = shortDescription;
  }
  if (university) {
    updateData.university = university;
  }
  if (biography !== undefined) {
    updateData.biography = biography;
  }
  if (skills) {
    updateData.skills = skills;
  }
  if (medicalLicenseNo) {
    updateData.medicalLicenseNo = medicalLicenseNo;
  }
  if (workingDays !== undefined) {
    updateData.workingDays = parsedWorkingDays;
  }
  if (isAppointmentEnabled !== undefined) {
    updateData.isAppointmentEnabled = isAppointmentEnabled === true || isAppointmentEnabled === "true";
  }

  // Handle profile image removal
  if (req.body.removeProfileImage === "true") {
    // Delete old image if exists
    if (currentDoctor.profileImage) {
      const imagePath = currentDoctor.profileImage.startsWith("/")
        ? currentDoctor.profileImage.slice(1)
        : currentDoctor.profileImage;
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
    if (currentDoctor.profileImage) {
      // Remove leading slash if present to make it relative
      const imagePath = currentDoctor.profileImage.startsWith("/")
        ? currentDoctor.profileImage.slice(1)
        : currentDoctor.profileImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }
    updateData.profileImage = `/uploads/doctors/${req.file.filename}`;
  }

  // Update doctor
  const doctor = await prisma.doctor.update({
    where: { id },
    data: updateData,
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
    message: "پزشک با موفقیت به‌روزرسانی شد",
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
    throw new AppError("پزشک یافت نشد", 404);
  }

  // Delete profile image if exists
  if (doctor.profileImage) {
    // Remove leading slash if present to make it relative
    const imagePath = doctor.profileImage.startsWith("/")
      ? doctor.profileImage.slice(1)
      : doctor.profileImage;
    const fullImagePath = path.join(process.cwd(), imagePath);
    try {
      await fs.unlink(fullImagePath);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  }

  await prisma.doctor.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "پزشک با موفقیت حذف شد",
  });
};

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
