const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * Get all insurance organizations (Public)
 */
const getInsuranceOrganizations = async (req, res) => {
  const { page = 1, limit = 10, published = true } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = published === 'true' ? { published: true } : {};

  const [organizations, total] = await Promise.all([
    prisma.insuranceOrganization.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
    }),
    prisma.insuranceOrganization.count({ where }),
  ]);

  res.json({
    success: true,
    data: { organizations },
    meta: createPaginationMeta(total, page, limit),
  });
};

/**
 * Get single insurance organization (Public)
 */
const getInsuranceOrganization = async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.insuranceOrganization.findUnique({
    where: { id },
  });

  if (!organization) {
    throw new AppError('سازمان بیمه یافت نشد', 404);
  }

  res.json({
    success: true,
    data: { organization },
  });
};

/**
 * Create insurance organization (Admin only)
 */
const createInsuranceOrganization = async (req, res) => {
  const { name, description, website, phoneNumber, email, logo, published = true, order = 0 } = req.body;

  // Check if organization with same name exists
  const existingOrg = await prisma.insuranceOrganization.findUnique({
    where: { name },
  });

  if (existingOrg) {
    throw new AppError('سازمان بیمه با این نام قبلاً ثبت شده است', 400);
  }

  const organization = await prisma.insuranceOrganization.create({
    data: {
      name,
      description,
      website,
      phoneNumber,
      email,
      logo,
      published: published === 'true' || published === true,
      order: parseInt(order) || 0,
    },
  });

  res.status(201).json({
    success: true,
    message: 'سازمان بیمه با موفقیت ایجاد شد',
    data: { organization },
  });
};

/**
 * Update insurance organization (Admin only)
 */
const updateInsuranceOrganization = async (req, res) => {
  const { id } = req.params;
  const { name, description, website, phoneNumber, email, logo, published, order } = req.body;

  const existingOrg = await prisma.insuranceOrganization.findUnique({
    where: { id },
  });

  if (!existingOrg) {
    throw new AppError('سازمان بیمه یافت نشد', 404);
  }

  // Check if new name conflicts with existing organizations
  if (name && name !== existingOrg.name) {
    const nameConflict = await prisma.insuranceOrganization.findUnique({
      where: { name },
    });

    if (nameConflict) {
      throw new AppError('سازمان بیمه با این نام قبلاً ثبت شده است', 400);
    }
  }

  const organization = await prisma.insuranceOrganization.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(website !== undefined && { website }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(email !== undefined && { email }),
      ...(logo !== undefined && { logo }),
      ...(published !== undefined && { published: published === 'true' || published === true }),
      ...(order !== undefined && { order: parseInt(order) || 0 }),
    },
  });

  res.json({
    success: true,
    message: 'سازمان بیمه با موفقیت به‌روزرسانی شد',
    data: { organization },
  });
};

/**
 * Delete insurance organization (Admin only)
 */
const deleteInsuranceOrganization = async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.insuranceOrganization.findUnique({
    where: { id },
  });

  if (!organization) {
    throw new AppError('سازمان بیمه یافت نشد', 404);
  }

  await prisma.insuranceOrganization.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'سازمان بیمه با موفقیت حذف شد',
  });
};

/**
 * Toggle insurance organization published status (Admin only)
 */
const toggleInsuranceOrganizationStatus = async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.insuranceOrganization.findUnique({
    where: { id },
  });

  if (!organization) {
    throw new AppError('سازمان بیمه یافت نشد', 404);
  }

  const updatedOrganization = await prisma.insuranceOrganization.update({
    where: { id },
    data: {
      published: !organization.published,
    },
  });

  res.json({
    success: true,
    message: `سازمان بیمه ${updatedOrganization.published ? 'فعال' : 'غیرفعال'} شد`,
    data: { organization: updatedOrganization },
  });
};

module.exports = {
  getInsuranceOrganizations,
  getInsuranceOrganization,
  createInsuranceOrganization,
  updateInsuranceOrganization,
  deleteInsuranceOrganization,
  toggleInsuranceOrganizationStatus,
};
