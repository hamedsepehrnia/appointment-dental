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
  const { name, address, phoneNumber, description, latitude, longitude, workingHours, eitaaChatId } = req.body;
  // Normalize phone number(s) if provided - handle JSON string or array
  let normalizedPhoneNumber = "";
  if (phoneNumber) {
    let phoneNumbersArray = [];
    
    // Try to parse as JSON first (in case it's sent as JSON string)
    if (typeof phoneNumber === 'string') {
      const trimmed = phoneNumber.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            phoneNumbersArray = parsed;
          } else {
            phoneNumbersArray = [parsed];
          }
        } catch {
          // If JSON parse fails, treat as single phone number
          phoneNumbersArray = [trimmed];
        }
      } else {
        phoneNumbersArray = [trimmed];
      }
    } else if (Array.isArray(phoneNumber)) {
      phoneNumbersArray = phoneNumber;
    } else {
      phoneNumbersArray = [phoneNumber];
    }
    
    // Format and filter phone numbers
    const validPhones = phoneNumbersArray
      .map(phone => formatPhoneNumberOptional(phone))
      .filter(phone => phone !== null && phone !== undefined && phone !== '');
    
    // Join with comma separator for storage, or set to empty string if no valid phones
    normalizedPhoneNumber = validPhones.length > 0 ? validPhones.join(', ') : "";
  }

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
  let parsedLatitude = null;
  let parsedLongitude = null;
  if (latitude) {
    const parsed = parseFloat(latitude);
    parsedLatitude = isNaN(parsed) ? null : parsed;
  }
  if (longitude) {
    const parsed = parseFloat(longitude);
    parsedLongitude = isNaN(parsed) ? null : parsed;
  }

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

  // Process eitaaChatId - always handle it (mandatory field)
  // Convert empty string to null for database
  const processedEitaaChatId = eitaaChatId !== undefined 
    ? (eitaaChatId === "" || eitaaChatId === null ? null : eitaaChatId)
    : null;

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
      eitaaChatId: processedEitaaChatId,
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
  const { name, address, phoneNumber, description, latitude, longitude, workingHours, eitaaChatId } =
    req.body;

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
    if (latitude === null || latitude === "") {
      parsedLatitude = null;
    } else {
      // Convert to string first, then parse to handle any type
      const latStr = String(latitude).trim();
      const parsed = parseFloat(latStr);
      parsedLatitude = isNaN(parsed) ? null : parsed;
    }
  }
  if (longitude !== undefined) {
    if (longitude === null || longitude === "") {
      parsedLongitude = null;
    } else {
      // Convert to string first, then parse to handle any type
      const lngStr = String(longitude).trim();
      const parsed = parseFloat(lngStr);
      parsedLongitude = isNaN(parsed) ? null : parsed;
    }
  }

  // Normalize phone number(s) if provided - handle JSON string or array
  let normalizedPhoneNumber = undefined;
  if (phoneNumber !== undefined) {
    let phoneNumbersArray = [];
    
    // Try to parse as JSON first (in case it's sent as JSON string)
    if (typeof phoneNumber === 'string') {
      const trimmed = phoneNumber.trim();
      // Check if it's a valid JSON array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            phoneNumbersArray = parsed.map(p => String(p).trim()).filter(p => p);
          } else {
            phoneNumbersArray = [String(parsed).trim()].filter(p => p);
          }
        } catch (error) {
          // If JSON parse fails, treat as single phone number
          phoneNumbersArray = trimmed ? [trimmed] : [];
        }
      } else {
        // Not a JSON array, treat as single phone number or comma-separated
        if (trimmed.includes(',')) {
          phoneNumbersArray = trimmed.split(',').map(p => p.trim()).filter(p => p);
        } else {
          phoneNumbersArray = trimmed ? [trimmed] : [];
        }
      }
    } else if (Array.isArray(phoneNumber)) {
      phoneNumbersArray = phoneNumber.map(p => String(p).trim()).filter(p => p);
    } else if (phoneNumber !== null && phoneNumber !== '') {
      phoneNumbersArray = [String(phoneNumber).trim()].filter(p => p);
    }
    
    // Format and filter phone numbers
    const validPhones = phoneNumbersArray
      .map(phone => {
        const formatted = formatPhoneNumberOptional(String(phone).trim());
        return formatted;
      })
      .filter(phone => phone !== null && phone !== undefined && phone !== '');
    
    // Join with comma separator for storage, or set to empty string if no valid phones
    normalizedPhoneNumber = validPhones.length > 0 ? validPhones.join(', ') : "";
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
    updateData.phoneNumber = normalizedPhoneNumber || "";
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (latitude !== undefined) {
    // Only set latitude if it's a valid number or null
    updateData.latitude = parsedLatitude;
  }
  if (longitude !== undefined) {
    // Only set longitude if it's a valid number or null
    updateData.longitude = parsedLongitude;
  }
  if (parsedWorkingHours !== undefined) {
    updateData.workingHours = parsedWorkingHours;
  }

  // Handle image removal
  if (req.body.removeImage === "true") {
    // Delete old image if exists
    if (currentClinic.image) {
      const imagePath = currentClinic.image.startsWith("/")
        ? currentClinic.image.slice(1)
        : currentClinic.image;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error deleting image:", err);
        }
      }
    }
    updateData.image = null;
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
        if (process.env.NODE_ENV === "development") {
          console.error("Error deleting old image:", err);
        }
      }
    }
    updateData.image = `/uploads/clinics/${req.file.filename}`;
  }

  // Process eitaaChatId - always handle it (mandatory field)
  // Convert empty string to null for database
  const processedEitaaChatId = eitaaChatId !== undefined 
    ? (eitaaChatId === "" || eitaaChatId === null ? null : eitaaChatId)
    : undefined;

  // Add eitaaChatId to updateData if provided
  if (processedEitaaChatId !== undefined) {
    updateData.eitaaChatId = processedEitaaChatId;
  }

  // Debug: Log updateData in development
  if (process.env.NODE_ENV === "development") {
    console.log("Update data:", JSON.stringify(updateData, null, 2));
  }

  const clinic = await prisma.clinic.update({
    where: { id },
    data: updateData,
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
