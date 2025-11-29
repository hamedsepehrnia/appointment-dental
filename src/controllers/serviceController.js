const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const {
  paginate,
  createPaginationMeta,
  createSlug,
} = require("../utils/helpers");
const { sanitizeContent } = require("../utils/sanitizeHtml");
const fs = require("fs").promises;
const path = require("path");

/**
 * Get all services
 */
const getServices = async (req, res) => {
  const { page = 1, limit = 10, search, categoryId, categorySlug } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};

  // Category filter (Many-to-Many)
  if (categoryId || categorySlug) {
    const categoryWhere = {};
    if (categoryId) {
      categoryWhere.id = categoryId;
    }
    if (categorySlug) {
      categoryWhere.slug = categorySlug;
    }
    // Only show published categories to non-admin/secretary users
    if (
      req.session.userRole !== "ADMIN" &&
      req.session.userRole !== "SECRETARY"
    ) {
      categoryWhere.published = true;
    }
    where.categories = {
      some: {
        category: categoryWhere,
      },
    };
  }

  // Search functionality
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { beforeTreatmentTips: { contains: search, mode: "insensitive" } },
      { afterTreatmentTips: { contains: search, mode: "insensitive" } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        beforeTreatmentTips: true,
        afterTreatmentTips: true,
        price: true,
        durationMinutes: true,
        coverImage: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.count({ where }),
  ]);

  // Transform categories to simpler format
  const transformedServices = services.map((service) => ({
    ...service,
    categories: service.categories.map((rel) => rel.category),
  }));

  res.json({
    success: true,
    data: { services: transformedServices },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single service by slug or ID
 */
const getService = async (req, res) => {
  const { identifier } = req.params;

  const service = await prisma.service.findFirst({
    where: {
      OR: [{ slug: identifier }, { id: identifier }],
    },
    include: {
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Transform categories
  if (service) {
    service.categories = service.categories.map((rel) => rel.category);
  }

  if (!service) {
    throw new AppError("خدمت یافت نشد", 404);
  }

  res.json({
    success: true,
    data: { service },
  });
};

/**
 * Create service (Admin/Secretary)
 */
const createService = async (req, res) => {
  const {
    title,
    description,
    beforeTreatmentTips,
    afterTreatmentTips,
    price,
    durationMinutes,
    categoryIds,
  } = req.body;

  const slug = createSlug(title);
  const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

  // Check if slug already exists
  const existingService = await prisma.service.findUnique({
    where: { slug },
  });

  let finalSlug = slug;
  if (existingService) {
    finalSlug = `${slug}-${Date.now()}`;
  }

  // Validate categories if provided
  let categoryIdsArray = [];
  if (categoryIds) {
    categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

    // Validate all categories exist
    const categories = await prisma.serviceCategory.findMany({
      where: { id: { in: categoryIdsArray } },
    });

    if (categories.length !== categoryIdsArray.length) {
      throw new AppError("یک یا چند دسته‌بندی یافت نشد", 404);
    }
  }

  const service = await prisma.service.create({
    data: {
      title,
      slug: finalSlug,
      description: sanitizeContent(description),
      beforeTreatmentTips: beforeTreatmentTips
        ? sanitizeContent(beforeTreatmentTips)
        : null,
      afterTreatmentTips: afterTreatmentTips
        ? sanitizeContent(afterTreatmentTips)
        : null,
      price: price ? parseInt(price) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      coverImage,
      categories: {
        create: categoryIdsArray.map((categoryId) => ({
          categoryId,
        })),
      },
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Transform categories
  service.categories = service.categories.map((rel) => rel.category);

  res.status(201).json({
    success: true,
    message: "خدمت با موفقیت ایجاد شد",
    data: { service },
  });
};

/**
 * Update service (Admin/Secretary)
 */
const updateService = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    beforeTreatmentTips,
    afterTreatmentTips,
    price,
    durationMinutes,
    categoryIds,
  } = req.body;

  const currentService = await prisma.service.findUnique({
    where: { id },
  });

  if (!currentService) {
    throw new AppError("خدمت یافت نشد", 404);
  }

  let slug = currentService.slug;
  if (title && title !== currentService.title) {
    slug = createSlug(title);

    const existingService = await prisma.service.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingService) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Prepare update data
  const updateData = {};
  if (title) {
    updateData.title = title;
    updateData.slug = slug;
  }
  if (description) {
    updateData.description = sanitizeContent(description);
  }
  if (beforeTreatmentTips !== undefined) {
    updateData.beforeTreatmentTips = beforeTreatmentTips
      ? sanitizeContent(beforeTreatmentTips)
      : null;
  }
  if (afterTreatmentTips !== undefined) {
    updateData.afterTreatmentTips = afterTreatmentTips
      ? sanitizeContent(afterTreatmentTips)
      : null;
  }
  if (price !== undefined) {
    updateData.price = price ? parseInt(price) : null;
  }
  if (durationMinutes !== undefined) {
    updateData.durationMinutes = durationMinutes
      ? parseInt(durationMinutes)
      : null;
  }

  // Handle cover image removal
  if (req.body.removeCoverImage === "true") {
    // Delete old image if exists
    if (currentService.coverImage) {
      const imagePath = currentService.coverImage.startsWith("/")
        ? currentService.coverImage.slice(1)
        : currentService.coverImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    updateData.coverImage = null;
  }
  // Handle cover image upload
  else if (req.file) {
    if (currentService.coverImage) {
      const imagePath = currentService.coverImage.startsWith("/")
        ? currentService.coverImage.slice(1)
        : currentService.coverImage;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }
    updateData.coverImage = `/uploads/images/${req.file.filename}`;
  }

  if (categoryIds !== undefined) {
    let categoryIdsArray = [];
    if (categoryIds) {
      categoryIdsArray = Array.isArray(categoryIds)
        ? categoryIds
        : [categoryIds];

      // Validate all categories exist
      const categories = await prisma.serviceCategory.findMany({
        where: { id: { in: categoryIdsArray } },
      });

      if (categories.length !== categoryIdsArray.length) {
        throw new AppError("یک یا چند دسته‌بندی یافت نشد", 404);
      }
    }

    // Delete existing relations and create new ones
    updateData.categories = {
      deleteMany: {},
      create: categoryIdsArray.map((categoryId) => ({
        categoryId,
      })),
    };
  }

  const service = await prisma.service.update({
    where: { id },
    data: updateData,
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Transform categories
  service.categories = service.categories.map((rel) => rel.category);

  res.json({
    success: true,
    message: "خدمت با موفقیت به‌روزرسانی شد",
    data: { service },
  });
};

/**
 * Delete service (Admin/Secretary)
 */
const deleteService = async (req, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new AppError("خدمت یافت نشد", 404);
  }

  // Delete cover image if exists
  if (service.coverImage) {
    const imagePath = path.join(process.cwd(), service.coverImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  }

  await prisma.service.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "خدمت با موفقیت حذف شد",
  });
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
};
