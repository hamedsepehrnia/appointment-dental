const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { paginate, createPaginationMeta } = require("../utils/helpers");

/**
 * گرفتن نوتیفیکیشن‌های منشی/ادمین
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20, read, type } = req.query;
  const { skip, take } = paginate(parseInt(page), parseInt(limit));
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const where = {};

  // منشی فقط نوتیفیکیشن‌های کلینیک خودش را ببیند
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      where.clinicId = user.clinicId;
    }
  }

  // فیلتر خوانده شده/نشده
  if (read !== undefined) {
    where.read = read === 'true';
  }

  // فیلتر نوع
  if (type) {
    where.type = type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
            appointmentDate: true,
            patientName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where })
  ]);

  res.json({
    success: true,
    data: { notifications },
    meta: createPaginationMeta(total, parseInt(page), parseInt(limit))
  });
};

/**
 * گرفتن تعداد نوتیفیکیشن‌های خوانده نشده
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const where = { read: false };

  // منشی فقط نوتیفیکیشن‌های کلینیک خودش
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      where.clinicId = user.clinicId;
    }
  }

  const count = await prisma.notification.count({ where });

  res.json({
    success: true,
    data: { unreadCount: count }
  });
};

/**
 * علامت‌گذاری یک نوتیفیکیشن به عنوان خوانده شده
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    throw new AppError("نوتیفیکیشن یافت نشد", 404);
  }

  // بررسی دسترسی منشی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== notification.clinicId) {
      throw new AppError("شما دسترسی به این نوتیفیکیشن ندارید", 403);
    }
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  res.json({
    success: true,
    message: "نوتیفیکیشن خوانده شد",
    data: { notification: updatedNotification }
  });
};

/**
 * علامت‌گذاری همه نوتیفیکیشن‌ها به عنوان خوانده شده
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const where = { read: false };

  // منشی فقط نوتیفیکیشن‌های کلینیک خودش
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      where.clinicId = user.clinicId;
    }
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { read: true }
  });

  res.json({
    success: true,
    message: `${result.count} نوتیفیکیشن خوانده شد`,
    data: { updatedCount: result.count }
  });
};

/**
 * حذف یک نوتیفیکیشن
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    throw new AppError("نوتیفیکیشن یافت نشد", 404);
  }

  // بررسی دسترسی منشی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== notification.clinicId) {
      throw new AppError("شما دسترسی به این نوتیفیکیشن ندارید", 403);
    }
  }

  await prisma.notification.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: "نوتیفیکیشن حذف شد"
  });
};

/**
 * حذف نوتیفیکیشن‌های قدیمی (بیش از 30 روز)
 * این تابع به صورت داخلی استفاده می‌شود
 */
const cleanupOldNotifications = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      read: true
    }
  });

  console.log(`🧹 Cleaned up ${result.count} old notifications`);
  return result.count;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
};

