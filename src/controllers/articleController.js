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
 * Get all articles (published only for public)
 */
const getArticles = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    published,
    search,
    categoryId,
    categorySlug,
  } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {};

  // Only show published articles to non-admin/secretary users
  if (
    req.session.userRole !== "ADMIN" &&
    req.session.userRole !== "SECRETARY"
  ) {
    where.published = true;
  } else if (published !== undefined) {
    where.published = published === "true";
  }

  // Category filter (Many-to-Many)
  const hasCategoryFilter = categoryId || categorySlug;
  const hasSearchFilter = search && typeof search === "string" && search.trim().length > 0;

  if (hasCategoryFilter) {
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
  if (hasSearchFilter) {
    const searchTerm = search.trim();
    const searchConditions = [
      { title: { contains: searchTerm } },
      { excerpt: { contains: searchTerm } },
      { content: { contains: searchTerm } },
    ];

    // If both category and search filters exist, combine them with AND
    if (hasCategoryFilter) {
      const categoryFilter = { ...where.categories };
      where.AND = [
        { categories: categoryFilter },
        { OR: searchConditions },
      ];
      delete where.categories;
    } else {
      where.OR = searchConditions;
    }
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        coverImage: true,
        author: true,
        published: true,
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
    prisma.article.count({ where }),
  ]);

  // Transform categories to simpler format - ensure it's always an array
  const transformedArticles = articles.map((article) => ({
    ...article,
    categories: (article.categories || []).map((rel) => rel.category),
  }));

  res.json({
    success: true,
    data: { articles: transformedArticles },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single article by slug or ID
 */
const getArticle = async (req, res) => {
  const { identifier } = req.params;

  // Try to find by slug first, then by ID
  const article = await prisma.article.findFirst({
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

  if (!article) {
    throw new AppError("مقاله یافت نشد", 404);
  }

  // Transform categories - ensure it's always an array
  article.categories = (article.categories || []).map((rel) => rel.category);

  // Check if article is published (for non-admin/secretary)
  if (
    !article.published &&
    req.session.userRole !== "ADMIN" &&
    req.session.userRole !== "SECRETARY"
  ) {
    throw new AppError("مقاله یافت نشد", 404);
  }

  res.json({
    success: true,
    data: { article },
  });
};

/**
 * Create article (Admin/Secretary)
 */
const createArticle = async (req, res) => {
  const { title, content, excerpt, author, published, categoryIds } = req.body;

  let slug = createSlug(title);
  const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

  // Check if slug already exists
  const existingArticle = await prisma.article.findUnique({
    where: { slug },
  });

  if (existingArticle) {
    // Add timestamp to make slug unique
    slug = `${slug}-${Date.now()}`;
  }

  // Validate categories if provided
  let categoryIdsArray = [];
  if (categoryIds) {
    categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

    // Validate all categories exist
    const categories = await prisma.articleCategory.findMany({
      where: { id: { in: categoryIdsArray } },
    });

    if (categories.length !== categoryIdsArray.length) {
      throw new AppError("یک یا چند دسته‌بندی یافت نشد", 404);
    }
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      content: sanitizeContent(content),
      excerpt,
      author: author && author.trim() !== "" ? author.trim() : null,
      coverImage,
      published: published || false,
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

  // Transform categories - ensure it's always an array
  article.categories = (article.categories || []).map((rel) => rel.category);

  res.status(201).json({
    success: true,
    message: "مقاله با موفقیت ایجاد شد",
    data: { article },
  });
};

/**
 * Update article (Admin/Secretary)
 */
const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, author, published, categoryIds } = req.body;

  const currentArticle = await prisma.article.findUnique({
    where: { id },
  });

  if (!currentArticle) {
    throw new AppError("مقاله یافت نشد", 404);
  }

  let slug = currentArticle.slug;
  if (title && title !== currentArticle.title) {
    slug = createSlug(title);

    // Check if new slug exists
    const existingArticle = await prisma.article.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Prepare update data
  const updateData = {};
  if (title) {
    updateData.title = title;
    updateData.slug = slug;
  }
  if (content) {
    updateData.content = sanitizeContent(content);
  }
  if (excerpt !== undefined) {
    updateData.excerpt = excerpt;
  }
  if (author !== undefined) {
    updateData.author = author && author.trim() !== "" ? author.trim() : null;
  }
  if (published !== undefined) {
    updateData.published = published;
  }

  // Handle cover image removal
  if (req.body.removeCoverImage === "true") {
    // Delete old image if exists
    if (currentArticle.coverImage) {
      const imagePath = currentArticle.coverImage.startsWith("/")
        ? currentArticle.coverImage.slice(1)
        : currentArticle.coverImage;
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
    // Delete old image if exists
    if (currentArticle.coverImage) {
      const imagePath = currentArticle.coverImage.startsWith("/")
        ? currentArticle.coverImage.slice(1)
        : currentArticle.coverImage;
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
      const categories = await prisma.articleCategory.findMany({
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

  const article = await prisma.article.update({
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

  // Transform categories - ensure it's always an array
  article.categories = (article.categories || []).map((rel) => rel.category);

  res.json({
    success: true,
    message: "مقاله با موفقیت به‌روزرسانی شد",
    data: { article },
  });
};

/**
 * Delete article (Admin/Secretary)
 */
const deleteArticle = async (req, res) => {
  const { id } = req.params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new AppError("مقاله یافت نشد", 404);
  }

  // Delete cover image if exists
  if (article.coverImage) {
    const imagePath = path.join(process.cwd(), article.coverImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  }

  await prisma.article.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "مقاله با موفقیت حذف شد",
  });
};

/**
 * Upload image for article content (CKEditor) (Admin/Secretary)
 */
const uploadContentImage = async (req, res) => {
  if (!req.file) {
    throw new AppError("لطفاً یک تصویر انتخاب کنید", 400);
  }

  const imageUrl = `/uploads/images/${req.file.filename}`;
  // استفاده از URL نسبی برای سازگاری با production
  // فرانت‌اند این URL را به URL کامل تبدیل می‌کند
  const fullImageUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;

  // CKEditor expects a specific response format
  // برگرداندن URL کامل برای CKEditor (که در ادیتور نیاز دارد)
  // اما در نمایش، فرانت‌اند URL را تبدیل می‌کند
  res.json({
    url: fullImageUrl,
  });
};

module.exports = {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadContentImage,
};
