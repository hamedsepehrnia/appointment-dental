const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const {
  paginate,
  createPaginationMeta,
  createSlug,
  formatPhoneNumberOptional,
} = require("../utils/helpers");
const fs = require("fs").promises;
const path = require("path");

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
  const {
    name,
    address,
    phoneNumber,
    description,
    latitude,
    longitude,
    workingHours,
  } = req.body;

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
    if (typeof workingHours === "string") {
      try {
        parsedWorkingHours = JSON.parse(workingHours);
      } catch (error) {
        throw new AppError("فرمت ساعات کاری معتبر نیست", 400);
      }
    } else {
      parsedWorkingHours = workingHours;
    }
  }

  // Handle image upload
  const image = req.file ? `/uploads/clinics/${req.file.filename}` : null;

  const clinic = await prisma.clinic.create({
    data: {
      name,
      slug,
      address,
      phoneNumber: normalizedPhoneNumber || "",
      description,
      image,
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
  const {
    name,
    address,
    phoneNumber,
    description,
    latitude,
    longitude,
    workingHours,
  } = req.body;

  // #region agent log
  try {
    const logPath = require("path").join(
      process.cwd(),
      "..",
      ".cursor",
      "debug.log"
    );
    require("fs").mkdirSync(
      require("path").join(process.cwd(), "..", ".cursor"),
      { recursive: true }
    );
    require("fs").writeFileSync(
      logPath,
      JSON.stringify({
        location: "clinicController.js:157",
        message: "updateClinic function called",
        data: {
          clinicId: id,
          bodyKeys: Object.keys(req.body),
          removeImage: req.body.removeImage,
          removeImageType: typeof req.body.removeImage,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }) + "\n",
      { flag: "a" }
    );
  } catch (err) {
    // Ignore logging errors
  }
  // #endregion

  // Get current clinic
  const currentClinic = await prisma.clinic.findUnique({
    where: { id },
  });

  if (!currentClinic) {
    throw new AppError("کلینیک یافت نشد", 404);
  }

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
    normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber) || "";
  }

  // Parse workingHours if it's a string (from form-data)
  let parsedWorkingHours = undefined;
  if (workingHours !== undefined) {
    if (workingHours === null || workingHours === "") {
      parsedWorkingHours = null;
    } else if (typeof workingHours === "string") {
      try {
        parsedWorkingHours = JSON.parse(workingHours);
      } catch (error) {
        throw new AppError("فرمت ساعات کاری معتبر نیست", 400);
      }
    } else {
      parsedWorkingHours = workingHours;
    }
  }

  // Prepare update data
  const updateData = {};
  if (name) {
    updateData.name = name;
  }
  if (slug) {
    updateData.slug = slug;
  }
  if (address) {
    updateData.address = address;
  }
  if (normalizedPhoneNumber !== undefined) {
    updateData.phoneNumber = normalizedPhoneNumber;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (latitude !== undefined) {
    updateData.latitude = parsedLatitude;
  }
  if (longitude !== undefined) {
    updateData.longitude = parsedLongitude;
  }
  if (parsedWorkingHours !== undefined) {
    updateData.workingHours = parsedWorkingHours;
  }

  // Handle image removal
  // #region agent log
  try {
    const logData = {
      removeImage: req.body.removeImage,
      removeImageType: typeof req.body.removeImage,
      bodyKeys: Object.keys(req.body),
      clinicId: id,
      currentImage: currentClinic.image,
    };
    const logPath = require("path").join(
      process.cwd(),
      "..",
      ".cursor",
      "debug.log"
    );
    require("fs").writeFileSync(
      logPath,
      JSON.stringify({
        location: "clinicController.js:251",
        message: "Checking removeImage",
        data: logData,
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }) + "\n",
      { flag: "a" }
    );
  } catch (err) {
    // Ignore logging errors
  }
  // #endregion
  if (req.body.removeImage === "true") {
    // #region agent log
    try {
      const logPath = require("path").join(
        process.cwd(),
        "..",
        ".cursor",
        "debug.log"
      );
      require("fs").writeFileSync(
        logPath,
        JSON.stringify({
          location: "clinicController.js:293",
          message: "removeImage is true, deleting image",
          data: { clinicId: id, currentImage: currentClinic.image },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }) + "\n",
        { flag: "a" }
      );
    } catch (err) {
      // Ignore logging errors
    }
    // #endregion
    // Delete old image if exists
    if (currentClinic.image) {
      const imagePath = currentClinic.image.startsWith("/")
        ? currentClinic.image.slice(1)
        : currentClinic.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    updateData.image = null;
    // #region agent log
    try {
      const logPath = require("path").join(
        process.cwd(),
        "..",
        ".cursor",
        "debug.log"
      );
      require("fs").writeFileSync(
        logPath,
        JSON.stringify({
          location: "clinicController.js:324",
          message: "updateData.image set to null",
          data: { clinicId: id, updateDataImage: updateData.image },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }) + "\n",
        { flag: "a" }
      );
    } catch (err) {
      // Ignore logging errors
    }
    // #endregion
  }
  // Handle image upload
  else if (req.file) {
    // Delete old image if exists
    if (currentClinic.image) {
      // Remove leading slash if present to make it relative
      const imagePath = currentClinic.image.startsWith("/")
        ? currentClinic.image.slice(1)
        : currentClinic.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }
    updateData.image = `/uploads/clinics/${req.file.filename}`;
  }

  const clinic = await prisma.clinic.update({
    where: { id },
    data: updateData,
  });

  // #region agent log
  try {
    const logPath = require("path").join(
      process.cwd(),
      "..",
      ".cursor",
      "debug.log"
    );
    require("fs").writeFileSync(
      logPath,
      JSON.stringify({
        location: "clinicController.js:360",
        message: "Clinic updated, sending response",
        data: {
          clinicId: id,
          clinicImage: clinic.image,
          clinicImageNull: clinic.image === null,
          clinicImageUndefined: clinic.image === undefined,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }) + "\n",
      { flag: "a" }
    );
  } catch (err) {
    // Ignore logging errors
  }
  // #endregion

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
