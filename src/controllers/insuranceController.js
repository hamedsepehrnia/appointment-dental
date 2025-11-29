const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, createPaginationMeta, formatPhoneNumberOptional } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get all insurance organizations (Public)
 */
const getInsuranceOrganizations = async (req, res) => {
  // Convert query params to numbers (they come as strings)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { published } = req.query;
  
  const { skip, take } = paginate(page, limit);

  const where = {};
  
  // Only show published insurances to non-admin/secretary users
  const isAdminOrSecretary = req.session?.userRole === 'ADMIN' || req.session?.userRole === 'SECRETARY';
  
  // FIX: برای ادمین/منشی فقط وقتی published مشخص شده فیلتر کن
  if (!isAdminOrSecretary) {
    where.published = true;
  } else if (published !== undefined && published !== null && published !== '') {
    // FIX: چک کردن مقادیر مختلف published
    where.published = published === 'true' || published === true || published === '1';
  }

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
  const { name, description, website, phoneNumber, email, published = true, order = 0 } = req.body;

  // Check if organization with same name exists
  const existingOrg = await prisma.insuranceOrganization.findUnique({
    where: { name },
  });

  if (existingOrg) {
    throw new AppError('سازمان بیمه با این نام قبلاً ثبت شده است', 400);
  }

  // Normalize phone number if provided
  const normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber);

  // Handle logo upload
  let logoPath = null;
  if (req.file) {
    logoPath = `/uploads/insurance/${req.file.filename}`;
  }

  const organization = await prisma.insuranceOrganization.create({
    data: {
      name,
      description,
      website,
      phoneNumber: normalizedPhoneNumber,
      email,
      logo: logoPath,
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
  const { name, description, website, phoneNumber, email, published, order } = req.body;

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

  // Normalize phone number if provided
  let normalizedPhoneNumber = undefined;
  if (phoneNumber !== undefined) {
    normalizedPhoneNumber = formatPhoneNumberOptional(phoneNumber);
  }

  // Prepare update data
  const updateData = {};
  if (name) {
    updateData.name = name;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (website !== undefined) {
    updateData.website = website;
  }
  if (normalizedPhoneNumber !== undefined) {
    updateData.phoneNumber = normalizedPhoneNumber;
  }
  if (email !== undefined) {
    updateData.email = email;
  }
  if (published !== undefined) {
    updateData.published = published === 'true' || published === true;
  }
  if (order !== undefined) {
    updateData.order = parseInt(order) || 0;
  }

  // Handle logo removal
  if (req.body.removeLogo === "true") {
    // Delete old logo if exists
    if (existingOrg.logo) {
      const imagePath = existingOrg.logo.startsWith('/')
        ? existingOrg.logo.slice(1)
        : existingOrg.logo;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting logo:', err);
      }
    }
    updateData.logo = null;
  }
  // Handle logo upload
  else if (req.file) {
    // Delete old logo if exists
    if (existingOrg.logo) {
      const imagePath = existingOrg.logo.startsWith('/')
        ? existingOrg.logo.slice(1)
        : existingOrg.logo;
      const oldImagePath = path.join(process.cwd(), imagePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old logo:', err);
      }
    }
    updateData.logo = `/uploads/insurance/${req.file.filename}`;
  }

  const organization = await prisma.insuranceOrganization.update({
    where: { id },
    data: updateData,
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
