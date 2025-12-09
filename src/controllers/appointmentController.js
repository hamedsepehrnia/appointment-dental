const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { paginate, createPaginationMeta } = require("../utils/helpers");
const smsService = require("../services/smsService");

/**
 * تبدیل تاریخ میلادی به شمسی
 */
const toJalali = (date) => {
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    calendar: 'persian',
    numberingSystem: 'latn'
  };
  return d.toLocaleDateString('fa-IR', options);
};

/**
 * گرفتن نام روز هفته به فارسی
 */
const getPersianDayName = (date) => {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return days[new Date(date).getDay()];
};

/**
 * فرمت ساعت
 */
const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * گرفتن عنوان جنسیت
 */
const getGenderTitle = (gender) => {
  if (gender === 'MALE') return 'آقای';
  if (gender === 'FEMALE') return 'خانم';
  return '';
};

/**
 * ایجاد نوبت جدید توسط کاربر
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
  const { clinicId, doctorId, appointmentDate, patientName, notes } = req.body;
  const userId = req.session.userId;

  // بررسی وجود کلینیک
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, phoneNumber: true }
  });

  if (!clinic) {
    throw new AppError("کلینیک یافت نشد", 404);
  }

  // بررسی وجود پزشک (اگر انتخاب شده)
  let doctor = null;
  if (doctorId) {
    doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!doctor) {
      throw new AppError("پزشک یافت نشد", 404);
    }
  }

  // گرفتن اطلاعات کاربر
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      phoneNumber: true, 
      gender: true 
    }
  });

  if (!user) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  // ایجاد نوبت
  const appointment = await prisma.appointment.create({
    data: {
      userId,
      clinicId,
      doctorId: doctorId || null,
      appointmentDate: new Date(appointmentDate),
      patientName: patientName || null,
      notes: notes || null,
      status: 'APPROVED_BY_USER', // تأیید اولیه توسط کاربر
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  // نام مراجع (اگر برای شخص دیگری است یا خود کاربر)
  const actualPatientName = patientName || `${user.firstName} ${user.lastName}`;
  const genderTitle = getGenderTitle(user.gender);
  const doctorName = doctor ? `دکتر ${doctor.firstName} ${doctor.lastName}` : 'پزشک کلینیک';
  const persianDate = toJalali(appointmentDate);
  const dayName = getPersianDayName(appointmentDate);
  const time = formatTime(appointmentDate);

  // پیامک به مراجع
  const patientSmsMessage = `${genderTitle} ${actualPatientName} عزیز،
نوبت شما در کلینیک ${clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} ثبت شد و در دست بررسی می‌باشد.
لطفاً تا تأیید نهایی صبر کنید.`;

  await smsService.sendSimpleSms(user.phoneNumber, patientSmsMessage);

  // پیدا کردن منشی‌های کلینیک
  const secretaries = await prisma.user.findMany({
    where: {
      clinicId: clinicId,
      role: 'SECRETARY'
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
    }
  });

  // لینک پنل ادمین
  const adminLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/appointments/${appointment.id}`;

  // پیامک به منشی
  const secretarySmsMessage = `درخواست رزرو نوبت جدید

نام مراجع: ${actualPatientName}
تاریخ: ${dayName} ${persianDate} ساعت ${time}
پزشک: ${doctorName}
تلفن مراجع: ${user.phoneNumber}

برای بررسی به پنل مراجعه کنید:
${adminLink}`;

  // ارسال پیامک به همه منشی‌ها
  for (const secretary of secretaries) {
    await smsService.sendSimpleSms(secretary.phoneNumber, secretarySmsMessage);
  }

  // ایجاد نوتیفیکیشن برای پنل ادمین
  await prisma.notification.create({
    data: {
      type: 'appointment_new',
      title: 'درخواست نوبت جدید',
      message: `درخواست نوبت جدید از ${actualPatientName} برای ${dayName} ${persianDate} ساعت ${time}`,
      link: `/admin/appointments/${appointment.id}`,
      appointmentId: appointment.id,
      clinicId: clinicId,
    }
  });

  res.status(201).json({
    success: true,
    message: "نوبت با موفقیت ثبت شد و در انتظار تأیید منشی می‌باشد",
    data: { appointment }
  });
};

/**
 * گرفتن لیست نوبت‌ها (برای ادمین/منشی)
 * GET /api/appointments
 */
const getAppointments = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    clinicId, 
    doctorId,
    fromDate,
    toDate,
    search
  } = req.query;
  
  const { skip, take } = paginate(parseInt(page), parseInt(limit));
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const where = {};

  // فیلتر بر اساس نقش کاربر
  if (userRole === 'SECRETARY') {
    // منشی فقط نوبت‌های کلینیک خودش را ببیند
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      where.clinicId = user.clinicId;
    }
  } else if (clinicId) {
    where.clinicId = clinicId;
  }

  // فیلتر وضعیت
  if (status) {
    where.status = status;
  }

  // فیلتر پزشک
  if (doctorId) {
    where.doctorId = doctorId;
  }

  // فیلتر تاریخ
  if (fromDate || toDate) {
    where.appointmentDate = {};
    if (fromDate) {
      where.appointmentDate.gte = new Date(fromDate);
    }
    if (toDate) {
      where.appointmentDate.lte = new Date(toDate);
    }
  }

  // جستجو
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { patientName: { contains: searchTerm } },
      { user: { firstName: { contains: searchTerm } } },
      { user: { lastName: { contains: searchTerm } } },
      { user: { phoneNumber: { contains: searchTerm } } },
    ];
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            gender: true,
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    }),
    prisma.appointment.count({ where })
  ]);

  res.json({
    success: true,
    data: { appointments },
    meta: createPaginationMeta(total, parseInt(page), parseInt(limit))
  });
};

/**
 * گرفتن نوبت‌های کاربر جاری
 * GET /api/appointments/my
 */
const getMyAppointments = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, take } = paginate(parseInt(page), parseInt(limit));
  const userId = req.session.userId;

  const where = { userId };

  if (status) {
    where.status = status;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phoneNumber: true,
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    }),
    prisma.appointment.count({ where })
  ]);

  res.json({
    success: true,
    data: { appointments },
    meta: createPaginationMeta(total, parseInt(page), parseInt(limit))
  });
};

/**
 * گرفتن یک نوبت
 * GET /api/appointments/:id
 */
const getAppointment = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
          nationalCode: true,
          address: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'PATIENT' && appointment.userId !== userId) {
    throw new AppError("شما دسترسی به این نوبت ندارید", 403);
  }

  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  res.json({
    success: true,
    data: { appointment }
  });
};

/**
 * تأیید نوبت توسط منشی
 * PATCH /api/appointments/:id/approve
 */
const approveAppointment = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        }
      },
      clinic: {
        select: {
          name: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی منشی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // بررسی وضعیت فعلی
  if (appointment.status === 'FINAL_APPROVED') {
    throw new AppError("این نوبت قبلاً تأیید شده است", 400);
  }

  if (appointment.status === 'CANCELED') {
    throw new AppError("این نوبت لغو شده و قابل تأیید نیست", 400);
  }

  // به‌روزرسانی وضعیت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: { status: 'FINAL_APPROVED' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          name: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  // اطلاعات برای پیامک
  const actualPatientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
  const doctorName = appointment.doctor 
    ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}` 
    : 'پزشک کلینیک';
  const persianDate = toJalali(appointment.appointmentDate);
  const dayName = getPersianDayName(appointment.appointmentDate);
  const time = formatTime(appointment.appointmentDate);

  // پیامک تأیید به مراجع
  const confirmSmsMessage = `${actualPatientName} عزیز،
نوبت شما در کلینیک ${appointment.clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} تأیید شد.
لطفاً در تاریخ و زمان مقرر به کلینیک مراجعه نمایید.`;

  await smsService.sendSimpleSms(appointment.user.phoneNumber, confirmSmsMessage);

  res.json({
    success: true,
    message: "نوبت با موفقیت تأیید شد و پیامک به مراجع ارسال گردید",
    data: { appointment: updatedAppointment }
  });
};

/**
 * لغو نوبت
 * PATCH /api/appointments/:id/cancel
 */
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          name: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'PATIENT' && appointment.userId !== userId) {
    throw new AppError("شما دسترسی به این نوبت ندارید", 403);
  }

  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // بررسی وضعیت فعلی
  if (appointment.status === 'CANCELED') {
    throw new AppError("این نوبت قبلاً لغو شده است", 400);
  }

  // به‌روزرسانی وضعیت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: { 
      status: 'CANCELED',
      notes: reason ? `${appointment.notes || ''}\nدلیل لغو: ${reason}`.trim() : appointment.notes
    }
  });

  // پیامک لغو به مراجع (فقط اگر منشی لغو کرده)
  if (userRole !== 'PATIENT') {
    const actualPatientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
    const persianDate = toJalali(appointment.appointmentDate);
    const dayName = getPersianDayName(appointment.appointmentDate);
    const time = formatTime(appointment.appointmentDate);

    const cancelSmsMessage = `${actualPatientName} عزیز،
متأسفانه نوبت شما در کلینیک ${appointment.clinic.name} برای ساعت ${time} روز ${dayName} ${persianDate} لغو شد.
${reason ? `دلیل: ${reason}` : ''}
برای رزرو مجدد با کلینیک تماس بگیرید.`;

    await smsService.sendSimpleSms(appointment.user.phoneNumber, cancelSmsMessage);
  }

  res.json({
    success: true,
    message: "نوبت با موفقیت لغو شد",
    data: { appointment: updatedAppointment }
  });
};

/**
 * به‌روزرسانی نوبت (ویرایش تاریخ/پزشک)
 * PATCH /api/appointments/:id
 */
const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, doctorId, patientName, notes } = req.body;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // آماده‌سازی داده‌های به‌روزرسانی
  const updateData = {};
  
  if (appointmentDate) {
    updateData.appointmentDate = new Date(appointmentDate);
    // ریست یادآوری‌ها در صورت تغییر تاریخ
    updateData.reminder24hSent = false;
    updateData.reminder30mSent = false;
  }
  
  if (doctorId !== undefined) {
    updateData.doctorId = doctorId || null;
  }
  
  if (patientName !== undefined) {
    updateData.patientName = patientName || null;
  }
  
  if (notes !== undefined) {
    updateData.notes = notes || null;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  res.json({
    success: true,
    message: "نوبت با موفقیت به‌روزرسانی شد",
    data: { appointment: updatedAppointment }
  });
};

/**
 * حذف نوبت (فقط ادمین)
 * DELETE /api/appointments/:id
 */
const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  await prisma.appointment.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: "نوبت با موفقیت حذف شد"
  });
};

/**
 * آمار نوبت‌ها (داشبورد ادمین)
 * GET /api/appointments/stats
 */
const getAppointmentStats = async (req, res) => {
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  let clinicFilter = {};

  // منشی فقط آمار کلینیک خودش را ببیند
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      clinicFilter = { clinicId: user.clinicId };
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    pendingCount,
    approvedByUserCount,
    finalApprovedCount,
    canceledCount,
    todayCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: clinicFilter }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'PENDING' } }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'APPROVED_BY_USER' } }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'FINAL_APPROVED' } }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'CANCELED' } }),
    prisma.appointment.count({
      where: {
        ...clinicFilter,
        appointmentDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'FINAL_APPROVED'
      }
    }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        total: totalAppointments,
        pending: pendingCount,
        approvedByUser: approvedByUserCount,
        finalApproved: finalApprovedCount,
        canceled: canceledCount,
        todayAppointments: todayCount,
      }
    }
  });
};

module.exports = {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointment,
  approveAppointment,
  cancelAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
};

